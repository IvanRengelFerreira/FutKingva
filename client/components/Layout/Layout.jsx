import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Navbar from '../Navbar/Navbar.jsx';
import Footer from '../Footer/Footer.jsx';

// Estructura común de todas las páginas: navbar arriba, la página en medio y el pie abajo.
// <Outlet /> es el hueco donde React Router pinta la vista de la ruta actual.
export default function Layout() {
  const { pathname } = useLocation();

  // Al cambiar de página, volver arriba (si no, se mantiene el scroll de la anterior).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Navbar />
      <main className="content">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
