import { logger } from '../utils/logger';

export interface TextChunk {
  text: string;
  metadata: {
    repoUrl: string;
    filePath: string;
    chunkIndex: number;
    startChar: number;
    endChar: number;
  };
}

/**
 * AST-based chunking strategy: Split code by function/class boundaries
 * More semantically meaningful than fixed-size chunks
 */

interface CodeBlock {
  type: 'function' | 'class' | 'method' | 'block';
  name?: string;
  startLine: number;
  endLine: number;
  startChar: number;
  endChar: number;
  content: string;
}

/**
 * Simple regex-based AST parser for JavaScript/TypeScript
 * Finds functions, classes, and methods
 */
const parseJavaScriptAST = (content: string): CodeBlock[] => {
  const blocks: CodeBlock[] = [];
  const lines = content.split('\n');

  let currentChar = 0;

  // Patterns for functions, classes, and methods
  const classPattern = /^\s*(export\s+)?(class|interface)\s+(\w+)/;
  const functionPattern = /^\s*(export\s+)?(async\s+)?(function\s+(\w+)|\(.*\)\s*=>|(\w+)\s*:\s*\(.*\)\s*=>|(\w+)\s*\()/;
  const arrowFunctionPattern = /const\s+(\w+)\s*=\s*(async\s*)?\(/;

  let blockStack: Partial<CodeBlock>[] = [];

  lines.forEach((line, lineIndex) => {
    const classMatch = line.match(classPattern);
    const functionMatch = line.match(functionPattern);
    const arrowMatch = line.match(arrowFunctionPattern);

    if (classMatch) {
      blockStack.push({
        type: 'class',
        name: classMatch[3],
        startLine: lineIndex,
        startChar: currentChar,
      });
    } else if (functionMatch || arrowMatch) {
      const name = functionMatch?.[4] || functionMatch?.[5] || functionMatch?.[6] || arrowMatch?.[1] || 'anonymous';
      blockStack.push({
        type: 'function',
        name,
        startLine: lineIndex,
        startChar: currentChar,
      });
    }

    // Track closing braces to detect end of blocks
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;

    if (closeBraces > openBraces && blockStack.length > 0) {
      for (let i = 0; i < closeBraces - openBraces; i++) {
        const block = blockStack.pop();
        if (block && block.startLine !== undefined) {
          blocks.push({
            type: block.type || 'block',
            name: block.name,
            startLine: block.startLine,
            endLine: lineIndex,
            startChar: block.startChar || 0,
            endChar: currentChar + line.length,
            content: lines.slice(block.startLine, lineIndex + 1).join('\n'),
          });
        }
      }
    }

    currentChar += line.length + 1; // +1 for newline
  });

  // Handle unclosed blocks
  while (blockStack.length > 0) {
    const block = blockStack.pop();
    if (block && block.startLine !== undefined) {
      blocks.push({
        type: block.type || 'block',
        name: block.name,
        startLine: block.startLine,
        endLine: lines.length - 1,
        startChar: block.startChar || 0,
        endChar: currentChar,
        content: lines.slice(block.startLine).join('\n'),
      });
    }
  }

  return blocks.filter((b) => b.content.trim().length > 20); // Filter trivial blocks
};

/**
 * Simple regex-based AST parser for Python
 */
const parsePythonAST = (content: string): CodeBlock[] => {
  const blocks: CodeBlock[] = [];
  const lines = content.split('\n');

  let currentChar = 0;
  const classPattern = /^\s*(class|def)\s+(\w+)/;

  lines.forEach((line, lineIndex) => {
    const match = line.match(classPattern);
    if (match) {
      const indent = line.search(/\S/);
      const type = match[1] === 'class' ? 'class' : 'function';
      const name = match[2];

      // Find the end of this function/class (next def/class at same or lower indent)
      let endLine = lineIndex + 1;
      while (endLine < lines.length) {
        const nextLine = lines[endLine];
        const nextIndent = nextLine.search(/\S/);

        if (nextIndent !== -1 && nextIndent <= indent && nextLine.match(classPattern)) {
          endLine--;
          break;
        }
        endLine++;
      }

      const startChar = currentChar;
      const endChar = lines.slice(0, endLine).join('\n').length;
      const content = lines.slice(lineIndex, endLine).join('\n');

      blocks.push({
        type,
        name,
        startLine: lineIndex,
        endLine: endLine - 1,
        startChar,
        endChar,
        content,
      });
    }

    currentChar += line.length + 1;
  });

  return blocks.filter((b) => b.content.trim().length > 20);
};

/**
 * Choose parser based on file extension
 */
const parseAST = (content: string, filePath: string): CodeBlock[] => {
  if (filePath.endsWith('.py')) {
    return parsePythonAST(content);
  } else {
    return parseJavaScriptAST(content);
  }
};

/**
 * Split code by AST-detected function/class boundaries
 * Groups related code together semantically
 */
export const chunkFileByAST = (
  content: string,
  filePath: string,
  repoUrl: string
): TextChunk[] => {
  const chunks: TextChunk[] = [];

  try {
    const blocks = parseAST(content, filePath);

    if (blocks.length === 0) {
      // Fallback: treat entire file as one chunk if no blocks detected
      return [
        {
          text: content,
          metadata: {
            repoUrl,
            filePath,
            chunkIndex: 0,
            startChar: 0,
            endChar: content.length,
          },
        },
      ];
    }

    blocks.forEach((block, index) => {
      chunks.push({
        text: block.content,
        metadata: {
          repoUrl,
          filePath,
          chunkIndex: index,
          startChar: block.startChar,
          endChar: block.endChar,
        },
      });
    });
  } catch (err) {
    logger.warn(`AST parsing failed for ${filePath}, using full file: ${err}`);
    return [
      {
        text: content,
        metadata: {
          repoUrl,
          filePath,
          chunkIndex: 0,
          startChar: 0,
          endChar: content.length,
        },
      },
    ];
  }

  return chunks;
};

/**
 * Get strategy comparison info
 */
export const getChunkingStrategies = () => ({
  fixed: {
    name: 'Fixed 512-token',
    description: 'Fixed-size chunks (400 tokens, 50 token overlap)',
  },
  ast: {
    name: 'AST-based (function level)',
    description: 'Chunks split by function/class boundaries',
  },
});
