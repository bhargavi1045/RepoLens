/**
 * RAG Evaluation Module
 * 
 * This module provides evaluation infrastructure for comparing RAG chunking strategies.
 * It measures retrieval quality (hit rate, MRR) and answer faithfulness.
 */

export * from './testDataset';

/**
 * To run evaluation:
 * 
 * Development:
 *   npm run eval:mock              # Dry-run with mock results
 *   npm run eval <repo-url>        # Evaluate a specific repository
 * 
 * Example:
 *   npm run eval https://github.com/user/repo-lens
 * 
 * The evaluation will:
 * 1. Retrieve chunks using your vector database
 * 2. Score retrieval quality (hit rate, MRR)
 * 3. Generate answers and score faithfulness
 * 4. Compare fixed-size vs AST-based chunking
 * 5. Output results table and findings
 */
