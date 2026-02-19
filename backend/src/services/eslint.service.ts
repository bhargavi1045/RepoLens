import { ESLint } from 'eslint';
import { ESLintIssue } from '../types';
import { logger } from '../utils/logger';

let jsLinter: ESLint;
let tsLinter: ESLint;

try {
  jsLinter = new ESLint({
    useEslintrc: false,
    overrideConfig: {
      env: { browser: true, es2020: true, node: true },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'script',
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

  tsLinter = new ESLint({
    useEslintrc: false,
    overrideConfig: {
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'warn',
      },
    },
  } as ESLint.Options);
} catch (err: any) {
  logger.warn(`ESLint initialization failed — linting will be skipped. Error: ${err.message}`);
}

export const lintFiles = async (
  files: { path: string; content: string }[]
): Promise<ESLintIssue[]> => {
  const allIssues: ESLintIssue[] = [];

  if (!jsLinter || !tsLinter) {
    logger.warn('ESLint not initialized — skipping linting');
    return allIssues;
  }

  for (const file of files) {
    const isTS = file.path.endsWith('.ts') || file.path.endsWith('.tsx');
    const isJS = file.path.endsWith('.js') || file.path.endsWith('.jsx');

    if (!isTS && !isJS) {
      logger.warn(`Skipping non-JS/TS file: ${file.path}`);
      continue;
    }

    try {
      const linter = isTS ? tsLinter : jsLinter;

      const results = await linter.lintText(file.content, {
        filePath: file.path,
        warnIgnored: false,
      });

      for (const result of results) {
        for (const msg of result.messages) {
          if (msg.fatal) continue;
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
    } catch (err: any) {
      logger.warn(`ESLint failed on ${file.path} — skipping. Error: ${err.message}`);
      continue;
    }
  }

  return allIssues;
};