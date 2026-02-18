export interface ParsedGithubUrl {
  owner: string;
  repo: string;
}

export interface GithubFile {
  path: string;
  content: string;
}

export interface GithubTreeItem {
  path: string;
  type: string;
  sha: string;
  url: string;
}

export interface GithubTree {
  tree: GithubTreeItem[];
  truncated: boolean;
}