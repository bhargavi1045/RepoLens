const CHARS_PER_TOKEN = 4;
const CHUNK_TOKEN_SIZE = 400;
const OVERLAP_TOKEN_SIZE = 50;

const CHUNK_SIZE = CHUNK_TOKEN_SIZE * CHARS_PER_TOKEN;
const OVERLAP_SIZE = OVERLAP_TOKEN_SIZE * CHARS_PER_TOKEN;
const STEP_SIZE = CHUNK_SIZE - OVERLAP_SIZE;

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

export const estimateTokens = (text: string): number =>
  Math.ceil(text.length / CHARS_PER_TOKEN);

export const chunkFile = (
  content: string,
  filePath: string,
  repoUrl: string
): TextChunk[] => {
  const chunks: TextChunk[] = [];

  if (!content || content.trim().length === 0) return chunks;

  let start = 0;

  while (start < content.length) {
    let end = start + CHUNK_SIZE;

    if (end < content.length) {
      const nextNewline = content.indexOf('\n', end);
      if (nextNewline !== -1 && nextNewline - end < 200) {
        end = nextNewline + 1;
      }
    } else {
      end = content.length;
    }

    const text = content.slice(start, end).trim();

    if (text.length > 0) {
      chunks.push({
        text,
        metadata: {
          repoUrl,
          filePath,
          chunkIndex: chunks.length,
          startChar: start,
          endChar: end,
        },
      });
    }

    if (end >= content.length) break;
    start += STEP_SIZE;
  }

  return chunks;
};