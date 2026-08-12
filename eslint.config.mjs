import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

/**
 * Config de ESLint (flat) alineada con las convenciones del scaffold
 * "AI-Assisted Test Automation": cero `any`, sin esperas fijas, sin XPath.
 *
 * Desviación documentada respecto del scaffold: `playwright/no-wait-for-timeout`
 * está en "warn" y no en "error". PORTE tiene guardado optimista y pantallas
 * sin señales de carga deterministas (ver OBS-12/13), por lo que algunas
 * esperas fijas son legítimas hoy. El warn las mantiene visibles para ir
 * reemplazándolas por aserciones web-first a medida que la app lo permita.
 */
export default tseslint.config(
  {
    ignores: [
      'node_modules',
      'playwright-report',
      'test-results',
      'scripts',
      '**/*.config.*',
      '**/*_files/**',
      '**/*.min.js',
      'Playwright-Scaffold-AI-Assisted-Development-Public/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      // Guardrails del scaffold (hard stops → acá como error salvo la nota de arriba)
      '@typescript-eslint/no-explicit-any': 'error',
      // Esperas y networkidle: la app no expone señales de carga deterministas,
      // así que se toleran como warning (no error) — ver nota del encabezado.
      'playwright/no-wait-for-timeout': 'warn',
      'playwright/no-networkidle': 'warn',
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='locator'] Literal[value=/^\\/\\//]",
          message: 'Sin XPath: usá selectores semánticos o CSS (convención del scaffold).',
        },
      ],
    },
  },
  prettier,
);
