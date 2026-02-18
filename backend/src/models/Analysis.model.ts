// Reserved for MongoDB/Mongoose integration
// Will store analysis results for history tracking and RAG

export interface IAnalysis {
  repoUrl: string;
  issueCount: number;
  healthScore: number;
  summary: string;
  suggestions: string[];
  createdAt: Date;
}