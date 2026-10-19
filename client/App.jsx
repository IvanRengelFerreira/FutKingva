import { HashRouter, Routes, Route } from 'react-router';
import Layout from './components/Layout/Layout.jsx';
import { SessionProvider } from './context/SessionContext.jsx';
import RequireRole from './components/RequireRole/RequireRole.jsx';
import Home from './views/Home/Home.jsx';
import PlayerProfile from './views/PlayerProfile/PlayerProfile.jsx';
import Comparator from './views/Comparator/Comparator.jsx';
import IdealTeam from './views/IdealTeam/IdealTeam.jsx';
import Access from './views/Access/Access.jsx';
import AdminDashboard from './views/AdminDashboard/AdminDashboard.jsx';
import NotFound from './views/NotFound/NotFound.jsx';
import ComponentGallery from './views/ComponentGallery/ComponentGallery.jsx'; // TEMPORAL

// Componente principal: define las rutas de la web (las páginas del sitemap).
// HashRouter usa direcciones con # (index.html#/clasificaciones), así funciona sin servidor.
// Las rutas con «:» (p. ej. :playerId) son páginas de detalle: el valor se lee con useParams().
// Para añadir una página: importar su vista y añadir su <Route> con la ruta acordada (README, apartado 6).
// SessionProvider: la sesión simulada (useSession) está disponible en todas las páginas.
// RequireRole: páginas privadas; sin sesión o sin el rol necesario llevan a Acceso.
// Las rutas fuera de <Layout> (Acceso) se ven sin navbar ni pie.
export default function App() {
  return (
    <SessionProvider>
      <HashRouter>
        <Routes>
          {/* Páginas propias, sin navbar ni pie */}
          <Route path="acceso" element={<Access />} />                        {/* 14 */}

          <Route element={<Layout />}>
            {/* Públicas */}
            <Route index element={<Home />} />                                {/* 01 */}
            <Route path="jugadores/:playerId" element={<PlayerProfile />} />  {/* 04 */}

            {/* Usuario registrado */}
            <Route path="comparador" element={<RequireRole><Comparator /></RequireRole>} />    {/* 10 */}
            <Route path="equipo-ideal" element={<RequireRole><IdealTeam /></RequireRole>} />   {/* 11 */}

            {/* Administrador */}
            <Route path="admin" element={<RequireRole roles={['admin']}><AdminDashboard /></RequireRole>} />  {/* 20 */}

            {/* TEMPORAL: escaparate de componentes; se borra antes de la entrega */}
            <Route path="componentes" element={<ComponentGallery />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </SessionProvider>
  );
}
