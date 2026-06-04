# 📋 Evaluation System quick look

## Commands

```bash
# Setup
npm install

# Quick test 
npm run eval:mock

# Evaluate a repo 
npm run eval https://github.com/user/repo

# View results
cat eval-results-*.json
```

## Files & What They Do

| File | Purpose |
|------|---------|
| `evaluation.service.ts` | Core metrics (Hit Rate, MRR, Faithfulness) |
| `astChunking.service.ts` | AST-based chunking by function/class |
| `evaluationRunner.service.ts` | Comparison orchestration |
| `evalRunner.ts` | CLI entry point |
| `testDataset.ts` | 8 test queries + 4 faithfulness items |

## Metrics Explained

| Metric | Formula | Target | Meaning |
|--------|---------|--------|---------|
| **Hit Rate** | (correct in top-8) / total | 80%+ | Retrieval precision |
| **MRR** | avg(1/rank) | 0.7+ | Quality of ranking |
| **Faithfulness** | LLM score | 75%+ | Answer grounding |
| **Relevancy** | LLM score | 80%+ | Answer addresses query |

## Customizing Tests

Edit `src/eval/testDataset.ts`:

```typescript
//add a test query
{
  query: 'Your question?',
  expectedChunkPath: 'src/path/to/file.ts',
  expectedKeywords: ['keyword1', 'keyword2'],
  retrievedChunks: [],
}

// Add faithfulness test
{
  query: 'Question?',
  retrievedContext: ['context chunk 1', 'context chunk 2'],
  generatedAnswer: 'LLM answer',
  groundTruthSegments: ['word1', 'word2'],
}
```

## Output Format

```
Hit Rate: 83%     ← % of queries with right chunk in top-8
MRR: 0.740        ← Quality of ranking (0-1, higher better)
Faithfulness: 79% ← % grounded in context (not hallucinated)
Latency: 1.4s     ← Response time
```

## Key Findings Interpretation

| Finding | Means |
|---------|-------|
| "12% improvement in hit rate" | AST finds relevant chunks more often |
| "Faithfulness improved 11%" | Better grounding in context |
| "Latency 200ms higher" | Trade-off for better accuracy |
| "Primary bottleneck is retrieval" | Fix retriever before optimizing LLM |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No chunks found" | Ingest repo first: `POST /api/v1/repo/ingest` |
| "Slow evaluation" | Reduce test queries in `testDataset.ts` |
| "Inconsistent scores" | Set temperature=0.3 for reproducibility |
| "Timeout errors" | Check API rate limits (Groq, Cohere, Pinecone) |

## Environment Variables

```bash
GROQ_API_KEY=...
PINECONE_API_KEY=...
COHERE_API_KEY=...
MONGO_URI=...
```

## Extending

### Add Custom Metric
```typescript
// evaluation.service.ts
export const calculateYourMetric = (items: any[]): number => {
  // your logic
  return result;
};
```

### Add Custom Chunking
```typescript
// astChunking.service.ts
export const chunkByYourStrategy = (content, path, repo) => {
  // your logic
  return chunks;
};
```

### Add Test Queries
```typescript
// testDataset.ts
export const RETRIEVAL_TEST_DATASET = [
  { query: '...', expectedChunkPath: '...', expectedKeywords: [...] },
  // more items
];
```

## Success Criteria

Hit Rate > 80%
Faithfulness > 75%
Latency < 2s
AST beats Fixed by >10%
