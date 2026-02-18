import { ESLintIssue } from '../types';

export const buildAnalysisPrompt = (
  files: { path: string; content: string }[],
  eslintIssues: ESLintIssue[]
): string => {
  const fileList = files.map((f) => `- ${f.path}`).join('\n');
  const issueList = eslintIssues
    .slice(0, 30)
    .map((i) => `[${i.severity.toUpperCase()}] ${i.filePath}:${i.line} — ${i.message} (${i.ruleId || 'no-rule'})`)
    .join('\n');

  return `You are a senior software engineer performing a code quality review.

You have been given a GitHub repository with the following files:
${fileList}

Static analysis (ESLint) found the following issues:
${issueList || 'No ESLint issues found.'}

Based on this information, provide a structured code quality analysis.

Respond ONLY with a valid JSON object in this exact shape:
{
  "summary": "string — overall assessment of the repository code quality (3-5 sentences)",
  "suggestions": ["string", "string", "string"],
  "healthScore": number between 0 and 100,
  "topIssues": [
    {
      "filePath": "string",
      "line": number,
      "column": number,
      "severity": "error" or "warning",
      "message": "string",
      "ruleId": "string or null"
    }
  ]
}

Rules:
- healthScore should reflect overall code quality (100 = perfect, 0 = critical)
- topIssues should contain at most 5 of the most critical issues
- suggestions should be 3 actionable improvements
- Do not include any text outside the JSON object
- Do not wrap in markdown code blocks`;
};