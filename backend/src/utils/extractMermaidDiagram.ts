export const extractMermaidDiagram = (llmOutput: string): string => {
  if (!llmOutput) throw new Error('Empty LLM output');

  const match = llmOutput.match(/```mermaid([\s\S]*?)```/i);
  if (!match || !match[1].trim()) {
    throw new Error('No valid Mermaid diagram found in LLM output');
  }

  // Return just the diagram code wrapped in ```mermaid for proper rendering
  return `\`\`\`mermaid\n${match[1].trim()}\n\`\`\``;
};
