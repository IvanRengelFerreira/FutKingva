import { useNavigate } from 'react-router';
import { useSession } from '../../context/SessionContext.jsx';
import Button from '../../components/Button/Button.jsx';
import './Access.css';

// 14 · Acceso
// Diseño: Figma › Mockups › 14 · Acceso
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=58-1144
// Provisional: de momento solo los botones de acceso rápido (sesión simulada) para poder probar
// las páginas con sesión. Se sustituye cuando se maquete la página.
export default function Access() {
  const { login } = useSession();
  const navigate = useNavigate();

  function handleQuickAccess(role) {
    login(role);
    navigate('/');
  }

  return (
    <section className="placeholder">
      <h1>Acceso</h1>
      <p>Página 14 · pendiente de maquetar. Acceso rápido (provisional):</p>
      <p className="access__quick">
        <Button variant="tertiary" onClick={() => handleQuickAccess('user')}>Usuario</Button>
        <Button variant="tertiary" onClick={() => handleQuickAccess('editor')}>Editor</Button>
        <Button variant="tertiary" onClick={() => handleQuickAccess('admin')}>Admin</Button>
      </p>
    </section>
  );
}
