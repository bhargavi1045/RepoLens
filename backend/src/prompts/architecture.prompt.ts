export const architecturePrompt = (chunks: string[]): string => `
You are a software architect analyzing a codebase.

Here are relevant code chunks from across the repository:

${chunks.join('\n\n')}

Generate a Mermaid.js diagram showing the architecture of this repository.
Include: modules, their relationships, data flow, and entry points.

Return ONLY a valid mermaid diagram inside a \`\`\`mermaid code block. Nothing else.
`;