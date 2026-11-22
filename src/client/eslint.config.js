// Reglas de ESLint del cliente: `npm run lint`. El formato (espacios, comillas…) lo lleva Prettier
// (`npm run format`, configuración en src/.prettierrc.json); eslint-config-prettier apaga las reglas que chocan.

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist/**'] },
  js.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Variables sin usar: error, salvo las que empiezan por _ (argumentos que hay que recibir pero no se usan)
      // ignoreRestSiblings: quitar una clave copiando el resto ({ [slot]: _removed, ...rest })
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  { files: ['vite.config.js'], languageOptions: { globals: globals.node } },
  // Cada contexto exporta su Provider junto a su hook (useSession…), que es el patrón de React.
  // Al editarlos, Vite recarga la página en vez de refrescar en caliente; no compensa partirlos.
  { files: ['context/**/*.jsx'], rules: { 'react-refresh/only-export-components': 'off' } },
  prettier,
];
