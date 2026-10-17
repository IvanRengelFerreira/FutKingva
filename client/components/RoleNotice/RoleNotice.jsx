import './RoleNotice.css';
import editIcon from '../../assets/icon-edit.svg';
import shieldIcon from '../../assets/icon-shield.svg';

// Texto largo en escritorio y corto en móvil, como en los mockups.
const NOTICES = {
  editor: {
    icon: editIcon,
    text: 'Zona de editor',
    detail: ' · solo visible para usuarios con rol editor (RF7)',
  },
  admin: {
    icon: shieldIcon,
    text: 'Zona de administración',
    detail: ' · solo visible para el rol administrador (RF8)',
  },
};

// Aviso de rol: barra al principio de las páginas de editor (17–19, azul) y de administración (20, roja).
// Diseño: Figma › Mockups › 17 · Panel de editor y 20 · Panel de administración › Aviso de rol
// Uso: <RoleNotice role="editor" />  o  <RoleNotice role="admin" />
export default function RoleNotice({ role }) {
  const notice = NOTICES[role];
  if (!notice) return null; // Solo hay aviso para editor y admin

  return (
    <div className={`role-notice role-notice--${role}`}>
      <img src={notice.icon} alt="" width="16" height="16" />
      <span>
        {notice.text}
        <span className="role-notice__detail">{notice.detail}</span>
      </span>
    </div>
  );
}
