import { logger } from '../utils/logger';

/**
 * Evaluation metrics for RAG system
 * Compares retrieval quality and answer faithfulness
 */

export interface EvaluationMetrics {
  hitRate: number; // % of queries where relevant chunk was in top-k
  mrr: number; // Mean Reciprocal Rank of correct chunks
  faithfulness: number; // % of answers grounded in retrieved chunks
  answerRelevancy: number; // % of answers relevant to query
  latency: number; // milliseconds
  totalQuestions: number;
}

export interface RetrievalEvalItem {
  query: string;
  expectedChunkPath: string; // File that should be retrieved
  expectedKeywords: string[]; // Keywords that should appear
  retrievedChunks: Array<{ filePath: string; score: number; text: string }>;
  hitRank?: number; // Position where correct chunk appeared (1-indexed)
}

export interface FaithfulnessEvalItem {
  query: string;
  retrievedContext: string[];
  generatedAnswer: string;
  groundTruthSegments: string[]; // Phrases that MUST appear if grounded
}

/**
 * Calculate Hit Rate: % of queries where relevant chunk was in results
 */
export const calculateHitRate = (
  items: RetrievalEvalItem[],
  topK: number = 8
): { hitRate: number; itemsWithRank: RetrievalEvalItem[] } => {
  let hits = 0;
  const itemsWithRank = items.map((item) => {
    const rankIndex = item.retrievedChunks.findIndex(
      (chunk) =>
        chunk.filePath === item.expectedChunkPath ||
        item.expectedKeywords.some((kw) =>
          chunk.text.toLowerCase().includes(kw.toLowerCase())
        )
    );

    if (rankIndex !== -1 && rankIndex < topK) {
      hits++;
      return { ...item, hitRank: rankIndex + 1 };
    }
    return item;
  });

  const hitRate = items.length > 0 ? (hits / items.length) * 100 : 0;
  return { hitRate, itemsWithRank };
};

/**
 * Calculate Mean Reciprocal Rank (MRR)
 * Average of 1/rank for each relevant result
 */
export const calculateMRR = (items: RetrievalEvalItem[]): number => {
  let reciprocalRankSum = 0;
  let relevantCount = 0;

  items.forEach((item) => {
    if (item.hitRank) {
      reciprocalRankSum += 1 / item.hitRank;
      relevantCount++;
    }
  });

  return relevantCount > 0 ? reciprocalRankSum / items.length : 0;
};

/**
 * Score faithfulness: Check if answer is grounded in retrieved chunks
 * Simple implementation: check for presence of ground truth segments
 * More sophisticated: use Claude/Groq to verify logical grounding
 */
export const scoreFaithfulness = async (
  item: FaithfulnessEvalItem,
  callLLM: (prompt: string) => Promise<string>
): Promise<number> => {
  const context = item.retrievedContext.join('\n---\n');

  const evaluationPrompt = `You are evaluating whether an AI-generated answer is grounded in the provided context.

CONTEXT:
${context}

GENERATED ANSWER:
${item.generatedAnswer}

TASK: Score the faithfulness of the answer (0-100).
- 100 = Answer is fully grounded in context, no hallucinations
- 75 = Mostly grounded, minor unsupported claims
- 50 = Partially grounded, some hallucination
- 25 = Mostly hallucinated, little grounding
- 0 = No connection to context, entirely hallucinated

Respond with ONLY a number (0-100).`;

  try {
    const result = await callLLM(evaluationPrompt);
    const score = parseInt(result.trim(), 10);
    return isNaN(score) ? 0 : Math.max(0, Math.min(100, score));
  } catch (err) {
    logger.error(`Faithfulness evaluation error: ${err}`);
    return 0;
  }
};

/**
 * Score answer relevancy to original query
 */
export const scoreAnswerRelevancy = async (
  query: string,
  answer: string,
  callLLM: (prompt: string) => Promise<string>
): Promise<number> => {
  const evaluationPrompt = `You are evaluating whether an AI-generated answer is relevant to a user's query.

QUERY:
${query}

ANSWER:
${answer}

TASK: Score the relevancy (0-100).
- 100 = Directly and completely answers the query
- 75 = Addresses the query with minor irrelevant content
- 50 = Partially addresses the query, some irrelevance
- 25 = Mostly irrelevant to the query
- 0 = Completely irrelevant

Respond with ONLY a number (0-100).`;

  try {
    const result = await callLLM(evaluationPrompt);
    const score = parseInt(result.trim(), 10);
    return isNaN(score) ? 0 : Math.max(0, Math.min(100, score));
  } catch (err) {
    logger.error(`Relevancy evaluation error: ${err}`);
    return 0;
  }
};

/**
 * Run full evaluation suite on retrieval and faithfulness
 */
export const runEvaluation = async (
  retrievalItems: RetrievalEvalItem[],
  faithfulnessItems: FaithfulnessEvalItem[],
  callLLM: (prompt: string) => Promise<string>,
  latencyMs: number
): Promise<EvaluationMetrics> => {
  logger.info(`Starting evaluation on ${retrievalItems.length} retrieval items`);

  const { hitRate, itemsWithRank } = calculateHitRate(retrievalItems);
  const mrr = calculateMRR(itemsWithRank);

  logger.info(`Hit Rate: ${hitRate.toFixed(2)}%, MRR: ${mrr.toFixed(3)}`);

  let totalFaithfulness = 0;
  let totalRelevancy = 0;

  for (const item of faithfulnessItems) {
    const faith = await scoreFaithfulness(item, callLLM);
    const relevancy = await scoreAnswerRelevancy(item.query, item.generatedAnswer, callLLM);

    totalFaithfulness += faith;
    totalRelevancy += relevancy;
  }

  const avgFaithfulness =
    faithfulnessItems.length > 0 ? totalFaithfulness / faithfulnessItems.length / 100 : 0;
  const avgRelevancy =
    faithfulnessItems.length > 0 ? totalRelevancy / faithfulnessItems.length / 100 : 0;

  return {
    hitRate: hitRate / 100,
    mrr,
    faithfulness: avgFaithfulness,
    answerRelevancy: avgRelevancy,
    latency: latencyMs,
    totalQuestions: retrievalItems.length + faithfulnessItems.length,
  };
};

/**
 * Format metrics for display/logging
 */
export const formatMetrics = (metrics: EvaluationMetrics): string => {
  return `
Evaluation Results (${metrics.totalQuestions} questions)
═════════════════════════════════
Hit Rate:            ${(metrics.hitRate * 100).toFixed(2)}%
MRR:                 ${metrics.mrr.toFixed(3)}
Faithfulness:        ${(metrics.faithfulness * 100).toFixed(2)}%
Answer Relevancy:    ${(metrics.answerRelevancy * 100).toFixed(2)}%
Avg Latency:         ${metrics.latency.toFixed(0)}ms
`;
};
