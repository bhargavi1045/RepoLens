import { ragQuery } from './rag.service';

export const askRepoService = async (repoUrl: string, prompt: string) => {
  if (!repoUrl || !prompt) throw new Error('Missing repoUrl or prompt');

  const response = await ragQuery({
    repoUrl,
    feature: 'ask_repo',
    query: prompt,
    target: 'ask_repo',
    topK: 8,
    promptBuilder: (chunks: string[]) => {
      return `You are an expert software engineer assistant. Use the repository excerpts below to answer the user's question exactly.

User question: "${prompt}"

Context excerpts (each is labeled with file path):
${chunks.join('\n\n')}

Answer concisely and directly. If the repository does not contain enough information to answer, say you couldn't find the details and suggest next steps (files to inspect or commands to run). Do not include any unrelated analysis.`;
    },
  });

  return response;
};
