/**
 * Extracts and validates a Mermaid diagram from LLM output.
 * @param llmOutput - raw string returned from the LLM
 * @returns string containing valid Mermaid diagram, or throws an error
 */
export const extractMermaidDiagram = (llmOutput: string): string => {
  if (!llmOutput) throw new Error('Empty LLM output');

  // Match a Mermaid code block
  const match = llmOutput.match(/```mermaid([\s\S]*?)```/i);
  if (!match || !match[1].trim()) {
    throw new Error('No valid Mermaid diagram found in LLM output');
  }

  return `\`\`\`mermaid\n${match[1].trim()}\n\`\`\``;
};
