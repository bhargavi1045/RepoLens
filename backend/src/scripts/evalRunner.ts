#!/usr/bin/env node
/**
 * RAG Evaluation CLI
 * Compares chunking strategies and generates metrics
 *
 * Usage:
 *   npm run eval -- https://github.com/user/repo
 *   npm run eval:mock -- dry-run with mock results
 */

import 'dotenv/config';
import { logger } from '../utils/logger';
import { compareChunkingStrategies, formatComparison } from '../services/evaluationRunner.service';
import { createMockEvaluationResult } from '../eval/testDataset';
import { formatMetrics } from '../services/evaluation.service';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const callLLM = async (prompt: string): Promise<string> => {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
  });
  return response.choices[0]?.message?.content?.trim() || '';
};

const runMockEvaluation = async () => {
  logger.info('Running mock evaluation (dry-run)...');

  const mockResult = createMockEvaluationResult();
  console.log(formatMetrics(mockResult));

  const mockComparison = {
    repository: 'mock/repo',
    evaluationDate: new Date(),
    strategies: {
      fixed: {
        strategy: 'fixed' as const,
        metrics: {
          hitRate: 0.71,
          mrr: 0.62,
          faithfulness: 0.68,
          answerRelevancy: 0.75,
          latency: 1200,
          totalQuestions: 12,
        },
        timestamp: new Date(),
        repositoryUrl: 'mock/repo',
      },
      ast: {
        strategy: 'ast' as const,
        metrics: {
          hitRate: 0.83,
          mrr: 0.74,
          faithfulness: 0.79,
          answerRelevancy: 0.82,
          latency: 1400,
          totalQuestions: 12,
        },
        timestamp: new Date(),
        repositoryUrl: 'mock/repo',
      },
    },
    findings: [
      'AST-based chunking improved retrieval hit rate by 16.9% (83.0% vs 71.0%)',
      'Answer faithfulness improved by 16.2% (79.0% vs 68.0%)',
      'AST-based chunking has higher latency by 200.0ms (1400ms vs 1200ms)',
      'Improved Mean Reciprocal Rank: 0.740 vs 0.620',
    ],
    summary:
      'AST-based chunking strategy outperformed on this repository, with a 16.9% difference in hit rate. The primary bottleneck for retrieval quality appears to be generation quality.',
  };

  console.log(formatComparison(mockComparison));
};

const runRealEvaluation = async (repoUrl: string) => {
  logger.info(`Starting evaluation for repository: ${repoUrl}`);

  try {
    const comparison = await compareChunkingStrategies(repoUrl, callLLM);
    console.log(formatComparison(comparison));

    // Save results to file
    const fs = await import('fs').then((m) => m.promises);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `eval-results-${timestamp}.json`;

    await fs.writeFile(filename, JSON.stringify(comparison, null, 2));
    logger.info(`Results saved to ${filename}`);
  } catch (err) {
    logger.error(`Evaluation failed: ${err}`);
    process.exit(1);
  }
};

// Main entry point
const main = async () => {
  const args = process.argv.slice(2);

  if (args.includes('--mock') || args.includes('-m')) {
    await runMockEvaluation();
  } else if (args.length > 0) {
    await runRealEvaluation(args[0]);
  } else {
    console.log(`
RAG Evaluation CLI
==================

Usage:
  npx ts-node src/scripts/evalRunner.ts <repo-url>    - Evaluate a repository
  npx ts-node src/scripts/evalRunner.ts --mock         - Run mock evaluation (dry-run)

Example:
  npx ts-node src/scripts/evalRunner.ts https://github.com/user/repo
  npx ts-node src/scripts/evalRunner.ts --mock
    `);
    process.exit(0);
  }
};

main().catch((err) => {
  logger.error(`Fatal error: ${err}`);
  process.exit(1);
});
