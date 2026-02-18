export interface ESLintIssue {
  filePath: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
  message: string;
  ruleId: string | null;
}

export interface AnalysisResult {
  issueCount: number;
  issues: ESLintIssue[];
  summary: string;
  suggestions: string[];
  healthScore: number;
  topIssues: ESLintIssue[];
}