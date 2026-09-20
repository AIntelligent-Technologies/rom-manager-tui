// Flat config (ESLint 9+). Replaces .eslintrc.cjs, which ESLint 10 does not read:
// "From ESLint v9.0.0, the default configuration file is now eslint.config.*".
// The React plugins the old config extended were never installed and this project
// has no React dependency and no JSX in src/, so they are not carried over.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    // Replaces .eslintignore, which ESLint 10 no longer supports.
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.bun/**',
      '**/*.lock',
      'pnpm-lock.yaml',
      'yarn.lock',
      'package-lock.json',
      '.github/**',
      'docs/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  prettier
);
