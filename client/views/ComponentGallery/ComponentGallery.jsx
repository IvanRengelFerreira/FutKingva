import { useState } from 'react';
import './ComponentGallery.css';
import { useSession } from '../../context/SessionContext.jsx';
import Button from '../../components/Button/Button.jsx';
import Tabs from '../../components/Tabs/Tabs.jsx';
import LiveBadge from '../../components/LiveBadge/LiveBadge.jsx';
import RoleNotice from '../../components/RoleNotice/RoleNotice.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Checkbox from '../../components/Checkbox/Checkbox.jsx';
import searchIcon from '../../assets/icon-search.svg';

// TEMPORAL · Escaparate de componentes compartidos (no está en el sitemap ni en el menú).
// Dirección: #/componentes. Sirve para ver cómo queda cada componente y copiar cómo se usa.
// Cuando hagas un componente compartido, añade aquí su bloque (con el mismo formato).
// Se borra antes de la entrega, junto con su ruta en App.jsx.

const SUBJECTS_EXAMPLE = [
  { value: 'datos', label: 'Error en los datos' },
  { value: 'sugerencia', label: 'Sugerencia' },
  { value: 'cuenta', label: 'Problema con mi cuenta' },
  { value: 'otro', label: 'Otro' },
];

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
  const [name, setName] = useState('Carlota');
  const [message, setMessage] = useState(
    'En la ficha de Pedri aparecen 2 tarjetas, pero en el último partido vio otra amarilla. ¿Podéis revisarlo?'
  );
  const [password, setPassword] = useState('futking');
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('datos');
  const [subjectRequired, setSubjectRequired] = useState('');
  const [league, setLeague] = useState('LaLiga');
  const [accepted, setAccepted] = useState(true);
  const [remember, setRemember] = useState(false);
  const [terms, setTerms] = useState(false);

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
        name="TextField"
        owner="Carlota"
        usage={"const [name, setName] = useState('');\n<TextField label=\"Nombre\" value={name} onChange={(e) => setName(e.target.value)} />\n<TextField label=\"Contraseña\" type=\"password\" error=\"Las contraseñas no coinciden\" … />   // con botón de ojo\n<TextField label=\"Mensaje\" multiline maxLength={1000} … />                 // con contador\n<TextField size=\"sm\" label=\"Buscar\" hideLabel icon={searchIcon} placeholder=\"Buscar por nombre…\" … />\n<TextField label=\"Correo\" hint=\"No lo compartimos con nadie\" disabled … />"}
      >
        <div className="gallery__row gallery__row--fields">
          <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            size="sm"
            label="Buscar"
            hideLabel
            icon={searchIcon}
            placeholder="Buscar por nombre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="gallery__row gallery__row--fields">
          <TextField
            label="Repetir contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="Pista: la contraseña buena es «futkingva»"
            error={password === 'futkingva' ? '' : 'Las contraseñas no coinciden'}
          />
          <TextField
            label="Correo electrónico"
            value="carlota.r@ejemplo.com"
            hint="Deshabilitado"
            disabled
            readOnly
          />
        </div>
        <TextField
          label="Mensaje"
          multiline
          maxLength={1000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </GalleryItem>

      <GalleryItem
        name="Select"
        owner="Carlota"
        usage={"const [subject, setSubject] = useState('datos');\n<Select label=\"Asunto\" options={[{ value: 'datos', label: 'Error en los datos' }, …]} value={subject} onChange={(e) => setSubject(e.target.value)} />\n<Select size=\"sm\" label=\"Liga\" hideLabel options={['LaLiga', 'Premier League', …]} … />   // filtros\n<Select label=\"Asunto\" placeholder=\"Elige un asunto\" error=\"Elige un asunto\" … />"}
      >
        <div className="gallery__row gallery__row--fields">
          <Select
            label="Asunto"
            options={SUBJECTS_EXAMPLE}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Select
            label="Asunto (con error)"
            options={SUBJECTS_EXAMPLE}
            placeholder="Elige un asunto"
            value={subjectRequired}
            onChange={(e) => setSubjectRequired(e.target.value)}
            error={subjectRequired ? '' : 'Elige un asunto'}
          />
        </div>
        <div className="gallery__row">
          <Select
            className="gallery__filter"
            size="sm"
            label="Liga"
            hideLabel
            options={['LaLiga', 'Premier League', 'Serie A', 'Bundesliga', 'Ligue 1'].map((l) => ({ value: l, label: `Liga: ${l}` }))}
            value={league}
            onChange={(e) => setLeague(e.target.value)}
          />
          <Select
            className="gallery__filter"
            size="sm"
            label="Temporada"
            hideLabel
            options={['Temporada 2026/27', 'Temporada 2025/26']}
          />
          <Select className="gallery__filter" size="sm" label="Ordenar" hideLabel options={['Ordenar: Clasificación']} disabled />
        </div>
      </GalleryItem>

      <GalleryItem
        name="Checkbox"
        owner="Carlota"
        usage={"const [accepted, setAccepted] = useState(false);\n<Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)}>Acepto la política de privacidad</Checkbox>\n<Checkbox error=\"Tienes que aceptar la política\" …>…</Checkbox>"}
      >
        <div className="gallery__row">
          <Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)}>
            Acepto la política de privacidad
          </Checkbox>
          <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)}>
            Recordarme
          </Checkbox>
          <Checkbox disabled>Deshabilitada</Checkbox>
        </div>
        <Checkbox
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          error={terms ? '' : 'Tienes que aceptar la política de privacidad'}
        >
          Acepto las condiciones de uso y la política de privacidad
        </Checkbox>
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
