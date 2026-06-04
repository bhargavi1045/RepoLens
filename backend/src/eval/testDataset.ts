import { RetrievalEvalItem, FaithfulnessEvalItem } from '../services/evaluation.service';

/**
 * Hand-crafted test dataset for RAG evaluation
 * These represent common questions developers ask about codebases
 */

export const RETRIEVAL_TEST_DATASET: RetrievalEvalItem[] = [
  {
    query: 'How does authentication work in this project?',
    expectedChunkPath: 'src/api/middleware/auth.middleware.ts',
    expectedKeywords: ['jwt', 'token', 'verify', 'authenticate'],
    retrievedChunks: [],
  },
  {
    query: 'What database models are being used?',
    expectedChunkPath: 'src/models/User.model.ts',
    expectedKeywords: ['schema', 'model', 'export', 'mongoose'],
    retrievedChunks: [],
  },
  {
    query: 'How are vectors stored and queried?',
    expectedChunkPath: 'src/services/pinecone.service.ts',
    expectedKeywords: ['pinecone', 'vector', 'query', 'index'],
    retrievedChunks: [],
  },
  {
    query: 'What is the error handling strategy?',
    expectedChunkPath: 'src/api/middleware/errorHandler.ts',
    expectedKeywords: ['error', 'catch', 'AppError', 'handler'],
    retrievedChunks: [],
  },
  {
    query: 'How are code chunks processed and embedded?',
    expectedChunkPath: 'src/services/chunking.service.ts',
    expectedKeywords: ['chunk', 'split', 'token', 'embedding'],
    retrievedChunks: [],
  },
  {
    query: 'What LLM is used for analysis and generation?',
    expectedChunkPath: 'src/services/llm.service.ts',
    expectedKeywords: ['groq', 'llm', 'completion', 'prompt'],
    retrievedChunks: [],
  },
  {
    query: 'How is rate limiting implemented?',
    expectedChunkPath: 'src/api/middleware/rateLimiter.ts',
    expectedKeywords: ['rate', 'limit', 'express-rate-limit'],
    retrievedChunks: [],
  },
  {
    query: 'What file validation logic exists?',
    expectedChunkPath: 'src/api/middleware/validateFilePath.ts',
    expectedKeywords: ['validate', 'path', 'file'],
    retrievedChunks: [],
  },
];

export const FAITHFULNESS_TEST_DATASET: FaithfulnessEvalItem[] = [
  {
    query: 'How does the RAG system retrieve code chunks?',
    retrievedContext: [
      'The system generates an embedding for the user query using the embedding service, sends it to Pinecone for vector similarity search, retrieves the top-k chunks, and then constructs a prompt with the retrieved context for the LLM.',
    ],
    generatedAnswer:
      'The RAG system works by first converting the user query into a vector embedding using the embedding service. This embedding is then sent to Pinecone, which performs a vector similarity search to find the most relevant code chunks. The top-k chunks are retrieved from the database and passed as context to the LLM, which generates answers grounded in this retrieved code.',
    groundTruthSegments: ['embedding', 'Pinecone', 'vector similarity', 'chunks', 'LLM'],
  },
  {
    query: 'What authentication mechanism is used?',
    retrievedContext: [
      'The auth middleware uses JSON Web Tokens (JWT). It validates tokens from the Authorization header, checks expiration, and ensures they are properly signed before allowing access to protected routes.',
    ],
    generatedAnswer:
      'The system uses OAuth2 with multi-factor authentication to protect endpoints. Users must sign in through an external provider.',
    groundTruthSegments: ['JWT', 'token', 'Authorization', 'signed'],
  },
  {
    query: 'How are database queries optimized?',
    retrievedContext: [
      'Code chunking service splits files into semantic units (functions/classes) before embedding. This allows more targeted retrieval since each chunk has clear semantic boundaries.',
    ],
    generatedAnswer:
      'The system uses AST-based parsing to split code into functions and classes before chunking. This creates smaller, more semantically meaningful chunks that improve retrieval precision.',
    groundTruthSegments: ['chunking', 'semantic', 'functions', 'classes'],
  },
  {
    query: 'What caching strategy reduces latency?',
    retrievedContext: [
      'The cache utility provides functions to get and set cached responses. Responses for certain features (not ask_repo) are cached to reduce redundant LLM calls.',
    ],
    generatedAnswer:
      'Responses are cached in memory to avoid redundant LLM calls for frequently asked questions about the same repository and feature.',
    groundTruthSegments: ['cache', 'redundant', 'LLM calls'],
  },
];

/**
 * Build evaluation context from repository specifics
 * This helps with more accurate evaluation
 */
export const buildEvaluationContext = (repoName: string) => {
  return {
    repoName,
    testQueries: RETRIEVAL_TEST_DATASET.map((item) => item.query),
    totalQueries: RETRIEVAL_TEST_DATASET.length + FAITHFULNESS_TEST_DATASET.length,
  };
};

/**
 * Create a mock evaluation result for dry-run testing
 */
export const createMockEvaluationResult = () => ({
  hitRate: 0.71,
  mrr: 0.62,
  faithfulness: 0.68,
  answerRelevancy: 0.75,
  latency: 1200,
  totalQuestions: RETRIEVAL_TEST_DATASET.length + FAITHFULNESS_TEST_DATASET.length,
});
