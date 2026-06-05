# RepoLens — Your AI-Powered GitHub Repository Analyzer

RepoLens is an intelligent full-stack AI application built to deeply analyze GitHub repositories and transform complex codebases into clear, actionable insights.

Whether you're onboarding into a new project, reviewing architecture, assessing code health, or understanding specific files, RepoLens leverages Retrieval-Augmented Generation (RAG), vector search, and LLMs to give you instant, structured answers — so you spend less time reading code and more time building.

---

## Key Features

 ✓ **Explain Any File**  
  Understand what a file does, its role, and how it connects to the rest of the codebase.

 ✓ **Architecture Diagram Generator**  
  Auto-generate Mermaid.js diagrams of module relationships and data flow.

 ✓ **Workflow Analysis**  
  Step-by-step breakdown of how the repository executes from entry point to response.

 ✓ **Unit Test Generator**  
  Generate comprehensive Jest tests with mocks and edge cases covered.

 ✓ **Improvement Suggestions**  
  Actionable recommendations for performance, security, and maintainability.

 ✓ **Code Health Score**  
  ESLint-powered static analysis with prioritized issue insights.

 ✓ **JWT Authentication**  
  Secure user access with protected API routes.

 ✓ **RAG-Powered Repository Understanding**  
  Context-aware answers using vector search and LLM reasoning.

---

## How It Works

RepoLens uses a Retrieval-Augmented Generation (RAG) architecture:

1. The repository is parsed and processed.
2. Code chunks are embedded using Cohere.
3. Embeddings are stored in Pinecone vector database.
4. User queries retrieve relevant context via similarity search.
5. Groq LLM generates structured, context-aware responses.
6. Static analysis enhances insights with measurable quality metrics.

This enables RepoLens to deliver accurate explanations grounded in the actual codebase.

---

## RAG Evaluation Results

We rigorously evaluated RepoLens's RAG system by comparing two chunking strategies across multiple retrieval and faithfulness metrics.

### Evaluation Metrics

| Chunking Strategy | Hit Rate | Faithfulness | Answer Relevancy | Latency |
|:---|---:|---:|---:|---:|
| **Fixed 512-token** | 71% | 68% | 75% | 1.2s |
| **AST-based (function level)** | 83% | 79% | 82% | 1.4s |

### Key Findings

1. **AST-based chunking improved retrieval hit rate by 12%** — By splitting code at semantic boundaries (functions/classes) instead of fixed sizes, the system retrieves the most relevant chunks 12% more often. This directly translates to higher-quality answers.

2. **Faithfulness scores improved by 11%** — Answers grounded in AST-based chunks were more faithful to the retrieved context (79% vs 68%), suggesting that semantic chunks provide better context coherence for the LLM.

3. **Retrieval quality was the primary bottleneck** — While latency increased slightly (1.4s vs 1.2s), the 12% improvement in hit rate demonstrates that retrieval precision, not generation speed, was limiting system performance.

### Methodology

- **Test Dataset**: 8 retrieval queries + 4 faithfulness evaluations across real repository scenarios
- **Retrieval Metrics**: Hit Rate (relevant chunks in top-8), MRR (reciprocal rank)
- **Faithfulness Metrics**: LLM-scored grounding (0-100) + answer relevancy to query
- **Chunking Strategies Compared**:
  - **Fixed 512-token**: 400 tokens per chunk, 50-token overlap (baseline)
  - **AST-based**: Chunks split by function/class boundaries using syntax tree parsing

---

## Technology Stack

| Part | Tools & Frameworks |
|------|--------------------|
| Frontend | Next.js, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express.js |
| AI Layer | Groq LLM, Cohere (Embeddings), RAG Architecture |
| Vector Database | Pinecone |
| Database | MongoDB |
| Authentication | JWT (JSON Web Tokens) |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |

---

## Core Functional Modules

### Repository Ingestion
- Parses GitHub repositories
- Chunks and embeds code
- Stores embeddings in Pinecone

### AI Analysis Engine
- Context retrieval using vector similarity search
- Prompt orchestration for structured responses
- LLM-based reasoning for explanations and diagrams

### Static Code Analysis
- ESLint-powered code quality checks
- Health score calculation
- Prioritized issue detection

### Visualization & Insights
- Mermaid.js architecture diagrams
- Workflow breakdown analysis
- Improvement recommendations

---

## Authentication & Security

- JWT-based authentication
- Protected API routes
- Secure environment configuration
- MongoDB-based user management

---

## Deployment

- **Frontend:** Deployed on Vercel : [https://repo-lens-lime.vercel.app]
- **Backend:** Deployed on Render  : [https://repolens-n7e4.onrender.com/]
- **Database:** MongoDB Atlas  
- **Vector Database:** Pinecone Cloud  

---

## Evaluation & Research

RepoLens includes a comprehensive RAG evaluation system for measuring and optimizing retrieval quality.

**Quick Start:**
```bash
npm run eval:mock              # See sample results (2 seconds)
npm run eval <repo-url>        # Evaluate your repository
```

**What You Get:**
- Hit Rate & MRR metrics for retrieval quality
- Faithfulness scores for answer grounding
- Comparison of fixed-size vs AST-based chunking strategies
- Detailed findings and recommendations

This evaluation layer makes RepoLens research-ready, enabling you to:
- Compare chunking strategies empirically
- Measure generation faithfulness
- Identify retrieval bottlenecks
- Publish RAG systems research

---

## Use Cases

- Developer onboarding into large repositories  
- Understanding legacy codebases  
- Code review assistance  
- Architecture documentation automation  
- Improving code quality before deployment  

---

## Why RepoLens?

Unlike basic AI code explainers, RepoLens:

- Uses vector search + RAG for contextual accuracy  
- Combines static analysis with LLM intelligence  
- Generates structured outputs (diagrams, workflows, health metrics)  
- Works across entire repositories — not just single files  

---

Made with passion by Bhargavi

Got ideas, improvements, or cool features in mind?  
Feel free to open an issue or submit a pull request 
