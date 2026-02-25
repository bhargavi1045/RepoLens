# RepoLens — Your AI-Powered GitHub Repository Analyzer

RepoLens is an intelligent full-stack AI application built to deeply analyze GitHub repositories and transform complex codebases into clear, actionable insights.

Whether you're onboarding into a new project, reviewing architecture, assessing code health, or understanding specific files, RepoLens leverages Retrieval-Augmented Generation (RAG), vector search, and LLMs to give you instant, structured answers — so you spend less time reading code and more time building.

---

## ✨ Key Features

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

## ❓ How It Works

RepoLens uses a Retrieval-Augmented Generation (RAG) architecture:

1. The repository is parsed and processed.
2. Code chunks are embedded using Cohere.
3. Embeddings are stored in Pinecone vector database.
4. User queries retrieve relevant context via similarity search.
5. Groq LLM generates structured, context-aware responses.
6. Static analysis enhances insights with measurable quality metrics.

This enables RepoLens to deliver accurate explanations grounded in the actual codebase.

---

## 🛠️ Technology Stack

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

## 🏗️ Core Functional Modules

### 🔹 Repository Ingestion
- Parses GitHub repositories
- Chunks and embeds code
- Stores embeddings in Pinecone

### 🔹 AI Analysis Engine
- Context retrieval using vector similarity search
- Prompt orchestration for structured responses
- LLM-based reasoning for explanations and diagrams

### 🔹 Static Code Analysis
- ESLint-powered code quality checks
- Health score calculation
- Prioritized issue detection

### 🔹 Visualization & Insights
- Mermaid.js architecture diagrams
- Workflow breakdown analysis
- Improvement recommendations

---

## 🔐 Authentication & Security

- JWT-based authentication
- Protected API routes
- Secure environment configuration
- MongoDB-based user management

---

## 🚀 Deployment

- **Frontend:** Deployed on Vercel : [https://repo-lens-lime.vercel.app]
- **Backend:** Deployed on Render  : [https://repolens-n7e4.onrender.com/]
- **Database:** MongoDB Atlas  
- **Vector Database:** Pinecone Cloud  

---

## 📌 Use Cases

- Developer onboarding into large repositories  
- Understanding legacy codebases  
- Code review assistance  
- Architecture documentation automation  
- Improving code quality before deployment  

---

## 🌟 Why RepoLens?

Unlike basic AI code explainers, RepoLens:

- Uses vector search + RAG for contextual accuracy  
- Combines static analysis with LLM intelligence  
- Generates structured outputs (diagrams, workflows, health metrics)  
- Works across entire repositories — not just single files  

---

Made with passion by Bhargavi💜

Got ideas, improvements, or cool features in mind?  
Feel free to open an issue or submit a pull request 
