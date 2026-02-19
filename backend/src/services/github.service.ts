import axios from 'axios';
import { config } from '../config/index';
import { GithubFile, GithubTree } from '../types';
import { parseGithubUrl } from '../utils/parseGithubUrl';
import { AppError } from '../api/middleware/errorHandler';
import { logger } from '../utils/logger';

const ALLOWED_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx'];

const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github+json',
    ...(config.githubToken && { Authorization: `Bearer ${config.githubToken}` }),
  },
});

const getDefaultBranch = async (owner: string, repo: string): Promise<string> => {
  const { data } = await githubApi.get(`/repos/${owner}/${repo}`);
  return data.default_branch;
};

const getRepoTree = async (
  owner: string,
  repo: string,
  branch: string
): Promise<GithubTree> => {
  const { data } = await githubApi.get(
    `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  );
  return data;
};

const getFileContent = async (
  owner: string,
  repo: string,
  path: string
): Promise<string> => {
  const { data } = await githubApi.get(`/repos/${owner}/${repo}/contents/${path}`);
  const buffer = Buffer.from(data.content, 'base64');
  return buffer.toString('utf-8');
};

const isAllowedFile = (path: string): boolean =>
  ALLOWED_EXTENSIONS.some((ext) => path.endsWith(ext));

export const fetchRepoFiles = async (repoUrl: string): Promise<GithubFile[]> => {
  const { owner, repo } = parseGithubUrl(repoUrl);

  try {
    const branch = await getDefaultBranch(owner, repo);
    const tree = await getRepoTree(owner, repo, branch);

    const filteredPaths = tree.tree
      .filter((item) => item.type === 'blob' && isAllowedFile(item.path))
      .map((item) => item.path);

    if (filteredPaths.length > config.maxFilesPerRepo) {
      logger.warn(
        `Repo has ${filteredPaths.length} eligible files — truncating to ${config.maxFilesPerRepo}`
      );
    }

    const filePaths = filteredPaths.slice(0, config.maxFilesPerRepo);
    logger.info(`Fetching ${filePaths.length} files from ${owner}/${repo}`);

    const files: GithubFile[] = await Promise.all(
      filePaths.map(async (path) => {
      try {
        const content = await getFileContent(owner, repo, path);
        if (content.length > config.maxFileSizeBytes) return null;
        return { path, content };
      } catch {
        return null;
      }
    })
   );

    return files.filter((f): f is GithubFile=> f!==null);
  } catch (err: any) {
    if (err.response?.status === 403) {
      throw new AppError('GitHub rate limit exceeded. Add a GITHUB_TOKEN to .env', 429);
    }
    if (err.response?.status === 404) {
      throw new AppError('Repository not found. Check the URL and ensure it is public.', 404);
    }
    throw new AppError(err.message || 'Failed to fetch repository files', 500);
  }
};