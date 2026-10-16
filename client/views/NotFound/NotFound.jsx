import { Link } from 'react-router';

// Página para rutas que no existen (no está en el sitemap).
export default function NotFound() {
  return (
    <section className="placeholder">
      <h1>Página no encontrada</h1>
      <p>
        La dirección no existe. <Link to="/">Volver a Inicio</Link>
      </p>
    </section>
  );
}
