export const improvementsPrompt = (chunks: string[]): string => `
You are a senior code reviewer.

Here are code chunks from the repository:

${chunks.join('\n\n')}

Provide specific, actionable improvements in these categories:
1. Performance optimizations
2. Security issues
3. Code quality and readability
4. Modern JS/TS patterns that should be used
5. Architecture suggestions

For each suggestion include: the file, the problem, and a concrete code example of the fix.

Respond in clean markdown.
`;