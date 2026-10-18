import { useState } from 'react';
import './ComponentGallery.css';
import { useSession } from '../../context/SessionContext.jsx';
import Button from '../../components/Button/Button.jsx';
import Tabs from '../../components/Tabs/Tabs.jsx';
import LiveBadge from '../../components/LiveBadge/LiveBadge.jsx';
import RoleNotice from '../../components/RoleNotice/RoleNotice.jsx';

// TEMPORAL · Escaparate de componentes compartidos (no está en el sitemap ni en el menú).
// Dirección: #/componentes. Sirve para ver cómo queda cada componente y copiar cómo se usa.
// Cuando hagas un componente compartido, añade aquí su bloque (con el mismo formato).
// Se borra antes de la entrega, junto con su ruta en App.jsx.

const TABS_EXAMPLE = [
  { id: 'summary', label: 'Resumen' },
  { id: 'stats', label: 'Estadísticas' },
  { id: 'matches', label: 'Partidos' },
];

// Un bloque del escaparate: nombre, responsable, ejemplo en vivo y cómo se usa
function GalleryItem({ name, owner, usage, children }) {
  return (
    <article className="gallery__item">
      <header className="gallery__item-header">
        <h2>{name}</h2>
        <span>{owner}</span>
      </header>
      <div className="gallery__preview">{children}</div>
      <pre className="gallery__usage"><code>{usage}</code></pre>
    </article>
  );
}

export default function ComponentGallery() {
  const { user, login, logout } = useSession();
  const [tab, setTab] = useState('summary');

  return (
    <section className="gallery">
      <h1>Componentes</h1>
      <p className="gallery__intro">
        Página temporal para ver los componentes compartidos. Se borra antes de la entrega.
      </p>

      <GalleryItem
        name="Navbar · Footer · MobileMenu"
        owner="Ivan"
        usage={'Van en Layout: salen solos en todas las páginas.\nMenú ☰: estrecha la ventana por debajo de 1440 px.'}
      >
        <p className="gallery__note">
          Sesión actual: <strong>{user ? user.name : 'sin sesión'}</strong>. Cambia de rol para ver la navbar con sesión.
        </p>
        <div className="gallery__row">
          <Button variant="tertiary" onClick={() => login('user')}>Usuario</Button>
          <Button variant="tertiary" onClick={() => login('editor')}>Editor</Button>
          <Button variant="tertiary" onClick={() => login('admin')}>Admin</Button>
          <Button variant="danger" onClick={logout} disabled={!user}>Cerrar sesión</Button>
        </div>
      </GalleryItem>

      <GalleryItem
        name="Button"
        owner="Ivan"
        usage={'<Button onClick={guardar}>Crear cuenta</Button>\n<Button variant="secondary">★ Seguir</Button>\n<Button variant="tertiary">Comparar</Button>\n<Button variant="danger">Eliminar usuario</Button>\n<Button disabled>Guardar</Button>\n<Button to="/acceso">Ir a Acceso</Button>   // enlace con aspecto de botón'}
      >
        <div className="gallery__row">
          <Button>Crear cuenta</Button>
          <Button variant="secondary">★ Seguir</Button>
          <Button variant="tertiary">Comparar</Button>
          <Button variant="danger">Eliminar usuario</Button>
          <Button disabled>Guardar</Button>
          <Button to="/acceso" variant="secondary">Ir a Acceso</Button>
        </div>
      </GalleryItem>

      <GalleryItem
        name="Tabs"
        owner="Ivan"
        usage={"const [tab, setTab] = useState('summary');\n<Tabs label=\"Secciones\" tabs={[{ id: 'summary', label: 'Resumen' }, …]} active={tab} onChange={setTab} />\n{tab === 'summary' && <Resumen />}"}
      >
        <Tabs label="Ejemplo de pestañas" tabs={TABS_EXAMPLE} active={tab} onChange={setTab} />
        <p className="gallery__note">
          Pestaña activa: <strong>{TABS_EXAMPLE.find((t) => t.id === tab).label}</strong> (prueba también con las flechas del teclado).
        </p>
      </GalleryItem>

      <GalleryItem
        name="LiveBadge"
        owner="Ivan"
        usage={'<LiveBadge minute={67} />\n<LiveBadge />'}
      >
        <div className="gallery__row">
          <LiveBadge minute={67} />
          <LiveBadge />
        </div>
      </GalleryItem>

      <GalleryItem
        name="RoleNotice"
        owner="Ivan"
        usage={'<RoleNotice role="editor" />\n<RoleNotice role="admin" />'}
      >
        <div className="gallery__stack">
          <RoleNotice role="editor" />
          <RoleNotice role="admin" />
        </div>
      </GalleryItem>

      <GalleryItem
        name="RequireRole"
        owner="Ivan"
        usage={"<RequireRole><Comparator /></RequireRole>                    // cualquier usuario con sesión\n<RequireRole roles={['admin']}><AdminDashboard /></RequireRole>"}
      >
        <p className="gallery__note">
          No se ve: protege páginas privadas. Sin sesión o sin el rol necesario lleva a Acceso.
        </p>
      </GalleryItem>
    </section>
  );
}
