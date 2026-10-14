import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración de Vite: traduce el JSX de React y sirve la web en local.
export default defineConfig({
  plugins: [react()],
  base: './',
});
