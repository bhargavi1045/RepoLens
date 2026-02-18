import Groq from 'groq-sdk';
import { config } from '../config';
import { LLMAnalysisInput, LLMAnalysisOutput } from '../types';
import { buildAnalysisPrompt } from '../prompts/analyzeRepo.prompt';
import { AppError } from '../api/middleware/errorHandler';
import { logger } from '../utils/logger';

const groq = new Groq({ apiKey: config.groqApiKey });

export const runLLMAnalysis = async (input: LLMAnalysisInput): Promise<LLMAnalysisOutput> => {
  const prompt = buildAnalysisPrompt(input.files, input.eslintIssues);

  logger.info('Sending analysis request to LLM');

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const raw = response.choices[0]?.message?.content?.trim();

    if (!raw) {
      throw new AppError('LLM returned an empty response', 500);
    }

    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed: LLMAnalysisOutput = JSON.parse(cleaned);

      if (
        typeof parsed.summary !== 'string' ||
        typeof parsed.healthScore !== 'number' ||
        !Array.isArray(parsed.suggestions) ||
        !Array.isArray(parsed.topIssues)
      ) {
        throw new Error('LLM response shape is invalid');
      }

      return parsed;
    } catch {
      logger.error(`Failed to parse LLM response: ${raw}`);
      throw new AppError('LLM returned malformed JSON. Try again.', 500);
    }
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError(`LLM request failed: ${err.message}`, 500);
  }
};