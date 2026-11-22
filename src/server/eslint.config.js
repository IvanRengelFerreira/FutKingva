// Reglas de ESLint del servidor: `npm run lint`. El formato (espacios, comillas…) lo lleva Prettier
// (`npm run format`, configuración en src/.prettierrc.json); eslint-config-prettier apaga las reglas que chocan.

import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['generated/**', 'scripts/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node },
    rules: {
      // Express pide (req, res, next) aunque no se usen todos: se permiten sin usar los argumentos
      'no-unused-vars': ['error', { args: 'none' }],
    },
  },
  prettier,
];
