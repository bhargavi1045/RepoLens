export interface LLMAnalysisInput {
  files: { path: string; content: string }[];
  eslintIssues: import('./analysis.types').ESLintIssue[];
}

export interface LLMAnalysisOutput {
  summary: string;
  suggestions: string[];
  healthScore: number;
  topIssues: import('./analysis.types').ESLintIssue[];
}