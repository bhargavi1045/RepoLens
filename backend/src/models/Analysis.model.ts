export interface IAnalysis {
  repoUrl: string;
  issueCount: number;
  healthScore: number;
  summary: string;
  suggestions: string[];
  createdAt: Date;
}