import { logger } from '../utils/logger';
import {
  EvaluationMetrics,
  RetrievalEvalItem,
  FaithfulnessEvalItem,
  runEvaluation,
  formatMetrics,
} from './evaluation.service';
import { RETRIEVAL_TEST_DATASET, FAITHFULNESS_TEST_DATASET } from '../eval/testDataset';
import { chunkFile } from './chunking.service';
import { chunkFileByAST } from './astChunking.service';
import { generateSingleEmbedding } from './embedding.service';
import { queryVectors } from './pinecone.service';
import { ChunkModel } from '../models/Chunk.model';

/**
 * Evaluation runner: Compare chunking strategies on a repository
 */

export interface ComparisonResult {
  strategy: string;
  metrics: EvaluationMetrics;
  timestamp: Date;
  repositoryUrl: string;
}

export interface EvaluationComparison {
  repository: string;
  evaluationDate: Date;
  strategies: {
    fixed: ComparisonResult | null;
    ast: ComparisonResult | null;
  };
  findings: string[];
  summary: string;
}

/**
 * Mock LLM call for evaluation (uses the same LLM as RAG)
 */
const createLLMEvaluator =
  (callLLMFunction: (prompt: string) => Promise<string>) =>
  async (prompt: string): Promise<string> => {
    return await callLLMFunction(prompt);
  };

/**
 * Evaluate retrieval quality for a chunking strategy
 */
const evaluateRetrieval = async (
  repoUrl: string,
  testItems: RetrievalEvalItem[],
  chunkingStrategy: 'fixed' | 'ast'
): Promise<RetrievalEvalItem[]> => {
  const evaluatedItems: RetrievalEvalItem[] = [];

  for (const item of testItems) {
    try {
      // Generate embedding for test query
      const queryEmbedding = await generateSingleEmbedding(item.query);

      // Query vectors using Pinecone
      const vectorResults = await queryVectors(queryEmbedding, repoUrl, 8);

      // Get actual chunk documents
      const pineconeIds = vectorResults.map((r) => r.pineconeId);
      const chunkDocs = await ChunkModel.find({ pineconeId: { $in: pineconeIds } });

      const retrievedChunks = chunkDocs.map((chunk) => ({
        filePath: chunk.filePath,
        score: vectorResults.find((r) => r.pineconeId === chunk.pineconeId)?.score || 0,
        text: chunk.text,
      }));

      evaluatedItems.push({
        ...item,
        retrievedChunks,
      });
    } catch (err) {
      logger.warn(`Retrieval evaluation failed for query: ${item.query}: ${err}`);
      evaluatedItems.push({
        ...item,
        retrievedChunks: [],
      });
    }
  }

  return evaluatedItems;
};

/**
 * Generate faithful answers for evaluation
 */
const generateFaithfulAnswers = async (
  retrievalItems: RetrievalEvalItem[],
  callLLM: (prompt: string) => Promise<string>
): Promise<FaithfulnessEvalItem[]> => {
  const answers: FaithfulnessEvalItem[] = [];

  for (const item of retrievalItems.slice(0, 4)) {
    // Use subset for faithfulness eval
    const context = item.retrievedChunks.map((c) => c.text).slice(0, 3);

    if (context.length === 0) continue;

    const prompt = `Based on this code context, answer the question briefly:

QUESTION: ${item.query}

CONTEXT:
${context.join('\n---\n')}

ANSWER:`;

    try {
      const answer = await callLLM(prompt);
      answers.push({
        query: item.query,
        retrievedContext: context,
        generatedAnswer: answer,
        groundTruthSegments: item.expectedKeywords,
      });
    } catch (err) {
      logger.warn(`Failed to generate answer for query: ${item.query}`);
    }
  }

  return answers;
};

/**
 * Run full evaluation on a repository with specified chunking strategy
 */
export const runStrategyEvaluation = async (
  repoUrl: string,
  strategy: 'fixed' | 'ast',
  callLLM: (prompt: string) => Promise<string>
): Promise<ComparisonResult> => {
  logger.info(`Starting ${strategy} chunking strategy evaluation for ${repoUrl}`);

  const startTime = Date.now();

  try {
    // Evaluate retrieval quality
    const retrievalItems = await evaluateRetrieval(repoUrl, RETRIEVAL_TEST_DATASET, strategy);

    // Generate answers for faithfulness evaluation
    const faithfulnessItems = await generateFaithfulAnswers(retrievalItems, callLLM);

    // Run evaluation suite
    const metrics = await runEvaluation(
      retrievalItems,
      faithfulnessItems,
      callLLM,
      Date.now() - startTime
    );

    logger.info(`${strategy} evaluation complete: ${formatMetrics(metrics)}`);

    return {
      strategy,
      metrics,
      timestamp: new Date(),
      repositoryUrl: repoUrl,
    };
  } catch (err) {
    logger.error(`Evaluation failed for strategy ${strategy}: ${err}`);
    throw err;
  }
};

/**
 * Compare both chunking strategies and generate findings
 */
export const compareChunkingStrategies = async (
  repoUrl: string,
  callLLM: (prompt: string) => Promise<string>
): Promise<EvaluationComparison> => {
  logger.info(`Starting chunking strategy comparison for ${repoUrl}`);

  const results: EvaluationComparison = {
    repository: repoUrl,
    evaluationDate: new Date(),
    strategies: {
      fixed: null,
      ast: null,
    },
    findings: [],
    summary: '',
  };

  try {
    // Evaluate fixed-size strategy
    results.strategies.fixed = await runStrategyEvaluation(repoUrl, 'fixed', callLLM);

    // Evaluate AST-based strategy
    results.strategies.ast = await runStrategyEvaluation(repoUrl, 'ast', callLLM);

    // Generate findings
    results.findings = generateFindings(results.strategies.fixed, results.strategies.ast);
    results.summary = generateSummary(results.strategies.fixed, results.strategies.ast);
  } catch (err) {
    logger.error(`Comparison failed: ${err}`);
    throw err;
  }

  return results;
};

/**
 * Generate insights from comparison
 */
const generateFindings = (fixed: ComparisonResult | null, ast: ComparisonResult | null): string[] => {
  if (!fixed || !ast) return [];

  const findings: string[] = [];

  // Hit rate comparison
  const hitRateImprovement = ((ast.metrics.hitRate - fixed.metrics.hitRate) / fixed.metrics.hitRate) * 100;
  findings.push(
    `AST-based chunking improved retrieval hit rate by ${hitRateImprovement.toFixed(1)}% ` +
      `(${(ast.metrics.hitRate * 100).toFixed(1)}% vs ${(fixed.metrics.hitRate * 100).toFixed(1)}%)`
  );

  // Faithfulness comparison
  const faithfulnessImprovement =
    ((ast.metrics.faithfulness - fixed.metrics.faithfulness) / fixed.metrics.faithfulness) * 100;
  findings.push(
    `Answer faithfulness ${faithfulnessImprovement > 0 ? 'improved' : 'decreased'} by ${Math.abs(faithfulnessImprovement).toFixed(1)}% ` +
      `(${(ast.metrics.faithfulness * 100).toFixed(1)}% vs ${(fixed.metrics.faithfulness * 100).toFixed(1)}%)`
  );

  // Latency comparison
  const latencyDiff = ast.metrics.latency - fixed.metrics.latency;
  findings.push(
    `AST-based chunking has ${latencyDiff > 0 ? 'higher' : 'lower'} latency by ${Math.abs(latencyDiff).toFixed(0)}ms ` +
      `(${ast.metrics.latency.toFixed(0)}ms vs ${fixed.metrics.latency.toFixed(0)}ms)`
  );

  // MRR comparison
  if (ast.metrics.mrr > fixed.metrics.mrr) {
    findings.push(
      `Improved Mean Reciprocal Rank: ${ast.metrics.mrr.toFixed(3)} vs ${fixed.metrics.mrr.toFixed(3)}`
    );
  }

  return findings;
};

/**
 * Generate executive summary
 */
const generateSummary = (fixed: ComparisonResult | null, ast: ComparisonResult | null): string => {
  if (!fixed || !ast) return '';

  const winner = ast.metrics.hitRate > fixed.metrics.hitRate ? 'AST-based' : 'Fixed-size';
  const hitRateDiff = Math.abs(
    ((ast.metrics.hitRate - fixed.metrics.hitRate) / fixed.metrics.hitRate) * 100
  );

  return (
    `${winner} chunking strategy outperformed on this repository, with a ` +
    `${hitRateDiff.toFixed(1)}% difference in hit rate. ` +
    `The primary bottleneck for retrieval quality appears to be ${
      ast.metrics.hitRate > 0.8 ? 'generation quality' : 'retrieval precision'
    }.`
  );
};

/**
 * Format comparison results for display
 */
export const formatComparison = (comparison: EvaluationComparison): string => {
  let output = `
╔════════════════════════════════════════════════════════════════╗
║         RAG Chunking Strategy Evaluation Report                ║
╚════════════════════════════════════════════════════════════════╝

Repository: ${comparison.repository}
Evaluation Date: ${comparison.evaluationDate.toISOString()}

┌─ RESULTS TABLE ─────────────────────────────────────────────┐
│ Chunking Strategy     │ Hit Rate │ Faithfulness │ Latency   │
├─────────────────────────────────────────────────────────────┤`;

  if (comparison.strategies.fixed) {
    output += `
│ Fixed 512-token       │ ${(comparison.strategies.fixed.metrics.hitRate * 100).toFixed(2)}%    │ ${(comparison.strategies.fixed.metrics.faithfulness * 100).toFixed(2)}%       │ ${comparison.strategies.fixed.metrics.latency.toFixed(0)}ms    │`;
  }

  if (comparison.strategies.ast) {
    output += `
│ AST-based (func)      │ ${(comparison.strategies.ast.metrics.hitRate * 100).toFixed(2)}%    │ ${(comparison.strategies.ast.metrics.faithfulness * 100).toFixed(2)}%       │ ${comparison.strategies.ast.metrics.latency.toFixed(0)}ms    │`;
  }

  output += `
└─────────────────────────────────────────────────────────────┘

┌─ KEY FINDINGS ──────────────────────────────────────────────┐`;

  comparison.findings.forEach((finding, index) => {
    output += `\n│ ${index + 1}. ${finding}`;
  });

  output += `
└─────────────────────────────────────────────────────────────┘

SUMMARY:
${comparison.summary}

`;

  return output;
};
