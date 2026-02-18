export const unitTestPrompt = (filePath: string, chunks: string[]): string => `
You are a senior test engineer.

Here are the code chunks from "${filePath}":

${chunks.join('\n\n')}

Generate comprehensive Jest unit tests for all exported functions. Requirements:
- Use describe and it blocks
- Cover happy path, edge cases, and error cases
- Mock all external dependencies
- Use TypeScript

Return only valid TypeScript test code. No explanations outside the code.
`;