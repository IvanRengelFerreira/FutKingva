// Título de cada bloque de 12 · Mi perfil, con un enlace o botón opcional a la derecha
export default function SectionHeader({ id, title, children }) {
  return (
    <div className="profile__section-header">
      <h2 id={id} className="profile__section-title">
        {title}
      </h2>
      {children}
    </div>
  );
}
