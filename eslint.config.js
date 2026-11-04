import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/cdk.out/**', '**/node_modules/**', '**/.local/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    files: ['**/test/**/*.ts', '**/prueba/**/*.{ts,tsx}', '**/*.test.ts', '**/*.test.tsx'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  {
    // Regla de arquitectura: el dominio no conoce adaptadores ni aplicación.
    files: ['api/src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '**/adapters/**',
            '**/application/**',
            '**/bootstrap/**',
            '@aws-sdk/*',
            'hono*',
          ],
        },
      ],
    },
  },
  {
    // La aplicación depende de puertos, nunca de adaptadores concretos.
    files: ['api/src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['**/adapters/**', '**/bootstrap/**', '@aws-sdk/*', 'hono*'] },
      ],
    },
  },
);
