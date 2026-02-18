import { ESLint } from 'eslint';
import { ESLintIssue } from '../types';
import { logger } from '../utils/logger';

// JS/JSX linter — no parser needed
const jsLinter = new ESLint({
  useEslintrc: false,
  overrideConfig: {
    env: { browser: true, es2020: true, node: true },
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'no-console': 'warn',
      eqeqeq: 'error',
      'no-var': 'warn',
      'prefer-const': 'warn',
      'no-duplicate-case': 'error',
      'no-empty': 'warn',
      'no-unreachable': 'error',
      'no-constant-condition': 'warn',
    },
  },
} as any);

export const lintFiles = async (
  files: { path: string; content: string }[]
): Promise<ESLintIssue[]> => {
  const allIssues: ESLintIssue[] = [];

  for (const file of files) {
    const isTS = file.path.endsWith('.ts') || file.path.endsWith('.tsx');

    // TypeScript files are skipped — @typescript-eslint parser not installed
    // To enable: npm install @typescript-eslint/parser @typescript-eslint/eslint-plugin
    // and configure a separate tsLinter instance
    if (isTS) {
      logger.info(`Skipping TypeScript ESLint for ${file.path} — TS parser not configured`);
      continue;
    }

    try {
      const results = await jsLinter.lintText(file.content, {
        filePath: file.path,
      });

      for (const result of results) {
        for (const msg of result.messages) {
          allIssues.push({
            filePath: file.path,
            line: msg.line,
            column: msg.column,
            severity: msg.severity === 2 ? 'error' : 'warning',
            message: msg.message,
            ruleId: msg.ruleId || null,
          });
        }
      }
    } catch (err) {
      logger.warn(`ESLint failed on ${file.path} — skipping`);
    }
  }

  return allIssues;
};