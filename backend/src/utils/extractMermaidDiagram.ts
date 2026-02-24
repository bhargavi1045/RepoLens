export const extractMermaidDiagram = (llmOutput: string): string => {
  if (!llmOutput) throw new Error('Empty LLM output');

  const match = llmOutput.match(/```mermaid([\s\S]*?)```/i);
  if (!match || !match[1].trim()) {
    throw new Error('No valid Mermaid diagram found in LLM output');
  }

  return `\`\`\`mermaid\n${match[1].trim()}\n\`\`\``;
};
