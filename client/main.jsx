import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/colors.css'; // Colores globales: disponibles en toda la web
import './styles/global.css';  // Estilos compartidos (se completan poco a poco)
import App from './App.jsx';

// Punto de entrada: React monta la aplicación dentro de <div id="root"> del index.html.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
