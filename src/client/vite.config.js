import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// La entrega se abre con doble clic en index.html (file://, sin servidor). Chrome bloquea ahí los
// scripts de tipo «module» y los archivos pedidos con «crossorigin», que es lo que genera Vite por
// defecto, y la página sale en blanco. Este plugin cambia el index.html final para que funcione:
// <script type="module" crossorigin> → <script defer> y quita «crossorigin» del CSS.
// Solo afecta a «npm run build»; con «npm run dev» todo sigue igual.
function openFromFile() {
  return {
    name: 'futkingva-open-from-file',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html) =>
        html
          .replace(/<script type="module" crossorigin/g, '<script defer')
          .replace(/ crossorigin(?=[ >])/g, ''),
    },
  };
}

// Configuración de Vite: traduce el JSX de React y sirve la web en local.
export default defineConfig({
  plugins: [react(), openFromFile()],
  base: './', // Rutas relativas (./assets/…) para poder abrir dist/index.html desde cualquier carpeta
  build: {
    // Un solo JS normal (no módulo) para que funcione con <script defer> en file://
    rolldownOptions: {
      output: { format: 'iife' },
      // Aviso sin importancia en ese formato: viene de código de React Router y Vite para cargar
      // archivos bajo demanda, que esta web no usa
      onLog(level, log, handler) {
        if (log.code === 'EMPTY_IMPORT_META') return;
        handler(level, log);
      },
    },
    // Los SVG van siempre dentro del código: en file:// las máscaras CSS (iconos del menú móvil,
    // notificaciones…) no pueden cargar archivos sueltos
    assetsInlineLimit: (file) => (file.endsWith('.svg') ? true : undefined),
  },
});
