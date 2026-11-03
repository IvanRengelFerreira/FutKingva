import { Link, Navigate, useLocation } from 'react-router';
import { ROLE_PANELS, useSession } from '../../context/SessionContext.jsx';

// Página solo para usuarios con sesión (y, si se indica, con ciertos roles).
// Sin sesión lleva a Acceso; al entrar, Acceso vuelve a esta página.
// Con sesión pero sin el rol necesario (p. ej. un usuario en el panel de editor) se avisa de que no tiene
// permiso, con enlaces a Inicio, a su propio panel y a Acceso para entrar con otra cuenta.
// Uso en App.jsx:
//   <Route path="comparador" element={<RequireRole><Comparator /></RequireRole>} />
//   <Route path="admin" element={<RequireRole roles={['admin']}><AdminDashboard /></RequireRole>} />
export default function RequireRole({ roles, children }) {
  const { user } = useSession();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/acceso" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    const ownPanel = ROLE_PANELS[user.role];
    return (
      <section className="placeholder">
        <h1>No tienes permiso para ver esta página</h1>
        <p>
          Esta zona es solo para {roles.map((role) => ROLE_NAMES[role].plural).join(' y ')}.
          Has entrado como {ROLE_NAMES[user.role].singular}.
        </p>
        <p>
          <Link to="/">Volver a Inicio</Link>
          {ownPanel && <> · <Link to={ownPanel.path}>Ir a tu {ownPanel.label.toLowerCase()}</Link></>}
          {' · '}
          <Link to="/acceso" state={{ from: location.pathname }}>Entrar con otra cuenta</Link>
        </p>
      </section>
    );
  }

  return children;
}

const ROLE_NAMES = {
  user: { singular: 'usuario registrado', plural: 'usuarios registrados' },
  editor: { singular: 'editor', plural: 'editores' },
  admin: { singular: 'administrador', plural: 'administradores' },
};
