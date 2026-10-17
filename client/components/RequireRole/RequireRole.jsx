import { Navigate } from 'react-router';
import { useSession } from '../../context/SessionContext.jsx';

// Página solo para usuarios con sesión (y, si se indica, con ciertos roles).
// Si no hay sesión o el rol no vale, lleva a Acceso.
// Uso en App.jsx:
//   <Route path="comparador" element={<RequireRole><Comparator /></RequireRole>} />
//   <Route path="admin" element={<RequireRole roles={['admin']}><AdminDashboard /></RequireRole>} />
export default function RequireRole({ roles, children }) {
  const { user } = useSession();

  if (!user || (roles && !roles.includes(user.role))) {
    return <Navigate to="/acceso" replace />;
  }

  return children;
}
