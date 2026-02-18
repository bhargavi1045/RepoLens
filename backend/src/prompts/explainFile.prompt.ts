export const explainFilePrompt = (filePath: string, chunks: string[]): string => `
You are a senior software engineer performing a code review.

Here are the relevant chunks from the file "${filePath}":

${chunks.join('\n\n')}

Provide a detailed explanation covering:
1. Purpose of this file
2. Key functions and classes and what they do
3. External dependencies used
4. How this file fits in the overall architecture
5. Any notable patterns or concerns

Respond in clean markdown.
`;