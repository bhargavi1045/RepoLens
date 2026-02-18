import { fetchRepoFiles } from './github.service';
import { lintFiles } from './eslint.service';
import { runLLMAnalysis } from './llm.service';
import { sanitizeCode } from '../utils/sanitize';
import { AnalysisResult } from '../types';
import { logger } from '../utils/logger';

export const runAnalysis = async (repoUrl: string): Promise<AnalysisResult> => {
  logger.info(`Starting analysis for: ${repoUrl}`);

  const files = await fetchRepoFiles(repoUrl);
  logger.info(`Fetched ${files.length} files`);

  const sanitizedFiles = files.map((f) => ({
    path: f.path,
    content: sanitizeCode(f.content),
  }));

  const eslintIssues = await lintFiles(sanitizedFiles);
  logger.info(`ESLint found ${eslintIssues.length} issues`);

  const llmResult = await runLLMAnalysis({
    files: sanitizedFiles,
    eslintIssues,
  });

  return {
    issueCount: eslintIssues.length,
    issues: eslintIssues,
    summary: llmResult.summary,
    suggestions: llmResult.suggestions,
    healthScore: llmResult.healthScore,
    topIssues: llmResult.topIssues,
  };
};