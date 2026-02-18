export const workflowPrompt = (chunks: string[]): string => `
You are a senior engineer explaining how a codebase works.

Here are relevant code chunks:

${chunks.join('\n\n')}

Explain the execution workflow of this repository step by step. Cover:
1. Entry point
2. Initialization sequence
3. Request or event flow
4. Key service interactions
5. How data moves through the system

Format as a numbered step-by-step explanation in clean markdown.
`;