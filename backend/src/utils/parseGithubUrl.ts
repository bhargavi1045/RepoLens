import { ParsedGithubUrl } from '../types';

export const parseGithubUrl = (url: string): ParsedGithubUrl => {
  const clean = url.trim().replace(/\.git$/, '');
  const match = clean.match(/github\.com\/([^/]+)\/([^/]+)/);

  if (!match) {
    throw new Error(`Invalid GitHub URL: ${url}`);
  }

  return {
    owner: match[1],
    repo: match[2],
  };
};