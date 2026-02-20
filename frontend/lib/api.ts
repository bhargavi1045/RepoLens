import { env } from "process";
const BASE = process.env.BASE || 'http://localhost:5000/api';

async function request<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Request failed');
  return json.data;
}

export const api = {
  ingest: (repoUrl: string, force = false) =>
    request<{ message: string; chunkCount: number }>('/repo/ingest', { repoUrl, force }),

  getFiles: (repoUrl: string) =>
    request<{ path: string; content: string }[]>('/repo/files', { repoUrl }),

  analyze: (repoUrl: string) =>
    request<{
      issueCount: number;
      healthScore: number;
      summary: string;
      suggestions: string[];
      topIssues: {
        filePath: string; line: number; column: number;
        severity: 'error' | 'warning'; message: string; ruleId: string | null;
      }[];
    }>('/analysis/analyze', { repoUrl }),

  explainFile: (repoUrl: string, filePath: string) =>
    request<{ filePath: string; explanation: string }>('/features/explain-file', { repoUrl, filePath }),

  architecture: (repoUrl: string) =>
    request<{ mermaidDiagram: string }>('/features/architecture', { repoUrl }),

  workflow: (repoUrl: string) =>
    request<{ workflow: string }>('/features/workflow', { repoUrl }),

  unitTests: (repoUrl: string, filePath: string) =>
    request<{ filePath: string; tests: string }>('/features/unit-tests', { repoUrl, filePath }),

  improvements: (repoUrl: string, filePath?: string) =>
    request<{ improvements: string }>('/features/improvements', { repoUrl, ...(filePath ? { filePath } : {}) }),

  askRepo: async (repoUrl: string, prompt: string) => {
  const res = await fetch(`${BASE}/features/ask-repo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl, prompt }),
  });

  if (!res.ok) {
    throw new Error('Failed to ask repository');
  }

  const json = await res.json();

  if (json.error) {
    throw new Error(json.error);
  }

  return json as { answer: string };
},

};