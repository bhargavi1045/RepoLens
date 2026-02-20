import { Request, Response, NextFunction } from 'express';
import { ragQuery } from '../../services/rag.service';
import { ingestRepo } from '../../services/ingest.service';
import { explainFilePrompt } from '../../prompts/explainFile.prompt';
import { architecturePrompt } from '../../prompts/architecture.prompt';
import { workflowPrompt } from '../../prompts/workflow.prompt';
import { unitTestPrompt } from '../../prompts/unitTest.prompt';
import { improvementsPrompt } from '../../prompts/improvements.prompt';
import { extractMermaidDiagram } from '../../utils/extractMermaidDiagram';
import { getCache, setCache, generateCacheKey } from '../../utils/cache';
import { runAnalysis } from '../../services/analysis.service';
import { fetchRepoFiles } from '../../services/github.service';
import { askRepoService } from '../../services/askRepo.service';

export const analyzeRepo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { repoUrl } = req.body;
    const cacheKey = generateCacheKey('analyzeRepo', repoUrl);

    const cached = await getCache(cacheKey);
    if (cached) {
      res.status(200).json({ success: true, data: JSON.parse(cached), cached: true });
      return;
    }

    const result = await runAnalysis(repoUrl);

    await setCache(cacheKey, 'analyzeRepo', repoUrl, '', JSON.stringify(result));

    res.status(200).json({ success: true, data: result, cached: false });
  } catch (error) {
    next(error);
  }
};

export const ingestRepoController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { repoUrl, force } = req.body;

    if (!force) {
      const cacheKey = generateCacheKey('ingestRepo', repoUrl);
      const cached = await getCache(cacheKey);
      if (cached) {
        res.status(200).json({ success: true, data: JSON.parse(cached), cached: true });
        return;
      }
    }

    const result = await ingestRepo(repoUrl, force ?? false);

    if (!force) {
      const cacheKey = generateCacheKey('ingestRepo', repoUrl);
      await setCache(cacheKey, 'ingestRepo', repoUrl, '', JSON.stringify(result));
    }

    res.status(200).json({ success: true, data: result, cached: false });
  } catch (error) {
    next(error);
  }
};

export const explainFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { repoUrl, filePath } = req.body;
    const cacheKey = generateCacheKey('explainFile', repoUrl, filePath);

    const cached = await getCache(cacheKey);
    if (cached) {
      res.status(200).json({ success: true, data: { filePath, explanation: cached }, cached: true });
      return;
    }

    const response = await ragQuery({
      repoUrl,
      feature: 'explain_file',
      query: `Explain the purpose and logic of ${filePath}`,
      target: filePath,
      filePath,
      topK: 10,
      promptBuilder: (chunks) => explainFilePrompt(filePath, chunks),
    });

    await setCache(cacheKey, 'explainFile', repoUrl, filePath, response);

    res.status(200).json({ success: true, data: { filePath, explanation: response }, cached: false });
  } catch (error) {
    next(error);
  }
};

export const generateArchitecture = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { repoUrl } = req.body;
    const cacheKey = generateCacheKey('architecture', repoUrl);

    const cached = await getCache(cacheKey);
    if (cached) {
      res.status(200).json({ success: true, data: { mermaidDiagram: cached }, cached: true });
      return;
    }

    const rawResponse = await ragQuery({
      repoUrl,
      feature: 'architecture',
      query: 'entry points imports exports module dependencies main components architecture',
      target: 'architecture',
      topK: 15,
      promptBuilder: (chunks) => architecturePrompt(chunks),
    });

    const mermaidDiagram = extractMermaidDiagram(rawResponse);

    await setCache(cacheKey, 'architecture', repoUrl, 'architecture', mermaidDiagram);

    res.status(200).json({ success: true, data: { mermaidDiagram }, cached: false });
  } catch (error) {
    next(error);
  }
};

export const explainWorkflow = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { repoUrl } = req.body;
    const cacheKey = generateCacheKey('workflow', repoUrl);

    const cached = await getCache(cacheKey);
    if (cached) {
      res.status(200).json({ success: true, data: { workflow: cached }, cached: true });
      return;
    }

    const response = await ragQuery({
      repoUrl,
      feature: 'workflow',
      query: 'entry point main function startup initialization request flow execution',
      target: 'workflow',
      topK: 10,
      promptBuilder: (chunks) => workflowPrompt(chunks),
    });

    await setCache(cacheKey, 'workflow', repoUrl, 'workflow', response);

    res.status(200).json({ success: true, data: { workflow: response }, cached: false });
  } catch (error) {
    next(error);
  }
};

export const generateUnitTests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { repoUrl, filePath } = req.body;
    const cacheKey = generateCacheKey('unit_tests', repoUrl, filePath);

    const cached = await getCache(cacheKey);
    if (cached) {
      res.status(200).json({ success: true, data: { filePath, tests: cached }, cached: true });
      return;
    }

    const response = await ragQuery({
      repoUrl,
      feature: 'unit_tests',
      query: `exported functions and classes in ${filePath}`,
      target: filePath,
      filePath,
      topK: 10,
      promptBuilder: (chunks) => unitTestPrompt(filePath, chunks),
    });

    await setCache(cacheKey, 'unit_tests', repoUrl, filePath, response);

    res.status(200).json({ success: true, data: { filePath, tests: response }, cached: false });
  } catch (error) {
    next(error);
  }
};

export const suggestImprovements = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { repoUrl, filePath } = req.body;
    const target = filePath || 'repo-wide';
    const cacheKey = generateCacheKey('improvements', repoUrl, target);

    const cached = await getCache(cacheKey);
    if (cached) {
      res.status(200).json({ success: true, data: { improvements: cached }, cached: true });
      return;
    }

    const response = await ragQuery({
      repoUrl,
      feature: 'improvements',
      query: 'code quality patterns anti-patterns performance security improvements',
      target,
      filePath,
      topK: 12,
      promptBuilder: (chunks) => improvementsPrompt(chunks),
    });

    await setCache(cacheKey, 'improvements', repoUrl, target, response);

    res.status(200).json({ success: true, data: { improvements: response }, cached: false });
  } catch (error) {
    next(error);
  }
};

export const getRepoFiles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { repoUrl } = req.body;
    const files = await fetchRepoFiles(repoUrl);
    res.status(200).json({ success: true, data: files });
  } catch (error) {
    next(error);
  }
};

export const askRepoController = async (req: Request, res: Response) => {
  try {
    const { repoUrl, prompt } = req.body;
    if (!repoUrl || !prompt) return res.status(400).json({ error: 'Missing repoUrl or prompt' });

    const answer = await askRepoService(repoUrl, prompt);
    res.json({ answer });
  } catch (err: any) {
    console.error('askRepoController error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
};

