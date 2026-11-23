import { HashRouter, Routes, Route } from 'react-router';
import Layout from './components/Layout/Layout.jsx';
import { SessionProvider } from './context/SessionContext.jsx';
import { NotificationsProvider } from './context/NotificationsContext.jsx';
import { UserDataProvider } from './context/UserDataContext.jsx';
import RequireRole from './components/RequireRole/RequireRole.jsx';
import Home from './views/Home/Home.jsx';
import PlayerProfile from './views/PlayerProfile/PlayerProfile.jsx';
import Comparator from './views/Comparator/Comparator.jsx';
import IdealTeam from './views/IdealTeam/IdealTeam.jsx';
import Access from './views/Access/Access.jsx';
import AdminDashboard from './views/AdminDashboard/AdminDashboard.jsx';
import Teams from './views/Teams/Teams.jsx';
import TeamProfile from './views/TeamProfile/TeamProfile.jsx';
import Standings from './views/Standings/Standings.jsx';
import Referees from './views/Referees/Referees.jsx';
import RefereeProfile from './views/RefereeProfile/RefereeProfile.jsx';
import Profile from './views/Profile/Profile.jsx';
import SearchResults from './views/SearchResults/SearchResults.jsx';
import Analysis from './views/Analysis/Analysis.jsx';
import Article from './views/Article/Article.jsx';
import Contact from './views/Contact/Contact.jsx';
import About from './views/About/About.jsx';
import EditorDashboard from './views/EditorDashboard/EditorDashboard.jsx';
import ArticleEditor from './views/ArticleEditor/ArticleEditor.jsx';
import PlayerDataEditor from './views/PlayerDataEditor/PlayerDataEditor.jsx';
import NotFound from './views/NotFound/NotFound.jsx';

// Componente principal: define las rutas de la web (las páginas del sitemap).
// HashRouter usa direcciones con # (index.html#/clasificaciones), así funciona sin servidor.
// Las rutas con «:» (p. ej. :playerId) son páginas de detalle: el valor se lee con useParams().
// Para añadir una página: importar su vista y añadir su <Route> con la ruta acordada (README, apartado 6).
// Las rutas fuera de <Layout> (Acceso) se ven sin navbar ni pie.
//
// Proveedores (envuelven toda la web, de fuera adentro):
//   SessionProvider       → la sesión del usuario (useSession), guardada en el servidor.
//   NotificationsProvider → los avisos del usuario (useNotifications); va dentro de la sesión.
//   UserDataProvider      → favoritos, comparativas, equipo ideal y correcciones (useUserData), en el navegador.

const EDITORS = ['editor'];
const ADMINS = ['admin'];

/** Página privada: sin sesión (o sin uno de los `roles`, si se indican) lleva a Acceso */
function privatePage(view, roles) {
  return <RequireRole roles={roles}>{view}</RequireRole>;
}

export default function App() {
  return (
    <SessionProvider>
      <NotificationsProvider>
        <UserDataProvider>
          <HashRouter>
            <Routes>
              {/* 14 · Página propia, sin navbar ni pie */}
              <Route path="acceso" element={<Access />} />

              <Route element={<Layout />}>
                {/* Públicas */}
                <Route index element={<Home />} /> {/* 01 */}
                <Route path="equipos" element={<Teams />} /> {/* 02 */}
                <Route path="equipos/:teamId" element={<TeamProfile />} /> {/* 03 */}
                <Route path="jugadores/:playerId" element={<PlayerProfile />} /> {/* 04 */}
                <Route path="clasificaciones" element={<Standings />} /> {/* 05 */}
                <Route path="arbitros" element={<Referees />} /> {/* 06 */}
                <Route path="arbitros/:refereeId" element={<RefereeProfile />} /> {/* 07 */}
                <Route path="analisis" element={<Analysis />} /> {/* 08 */}
                <Route path="analisis/:articleId" element={<Article />} /> {/* 09 */}
                <Route path="buscar" element={<SearchResults />} /> {/* 13 (texto buscado en ?q=) */}
                <Route path="sobre-nosotros" element={<About />} /> {/* 15 */}
                <Route path="contacto" element={<Contact />} /> {/* 16 */}
                {/* Usuario registrado (cualquier rol) */}
                <Route path="comparador" element={privatePage(<Comparator />)} /> {/* 10 */}
                <Route path="equipo-ideal" element={privatePage(<IdealTeam />)} /> {/* 11 */}
                <Route path="perfil" element={privatePage(<Profile />)} /> {/* 12 */}
                {/* Editor */}
                <Route path="editor" element={privatePage(<EditorDashboard />, EDITORS)} /> {/* 17 */}
                <Route path="editor/articulo" element={privatePage(<ArticleEditor />, EDITORS)} /> {/* 18 nuevo */}
                {/* 18 editar */}
                <Route path="editor/articulo/:articleId" element={privatePage(<ArticleEditor />, EDITORS)} />
                <Route path="editor/datos" element={privatePage(<PlayerDataEditor />, EDITORS)} /> {/* 19 */}
                {/* Administrador */}
                <Route path="admin" element={privatePage(<AdminDashboard />, ADMINS)} /> {/* 20 */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </HashRouter>
        </UserDataProvider>
      </NotificationsProvider>
    </SessionProvider>
  );
}
