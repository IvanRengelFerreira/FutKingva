import { useState } from 'react';
import './ComponentGallery.css';
import { useSession } from '../../context/SessionContext.jsx';
import Button from '../../components/Button/Button.jsx';
import Tabs from '../../components/Tabs/Tabs.jsx';
import LiveBadge from '../../components/LiveBadge/LiveBadge.jsx';
import RoleNotice from '../../components/RoleNotice/RoleNotice.jsx';
import BarChart from '../../components/BarChart/BarChart.jsx';
import Radar from '../../components/Radar/Radar.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Checkbox from '../../components/Checkbox/Checkbox.jsx';
import Tag from '../../components/Tag/Tag.jsx';
import StatusBadge from '../../components/StatusBadge/StatusBadge.jsx';
import Illustration from '../../components/Illustration/Illustration.jsx';
import ArticleCard from '../../components/ArticleCard/ArticleCard.jsx';
import { getPlayer, getReferee, getArticle, LEAGUE_CARDS_PER_MATCH, COMPARISON_EXAMPLE } from '../../data/mockData.js';
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

// Datos de ejemplo para BarChart (los mismos que en los mockups 04, 07 y 09)
const pedri = getPlayer('pedri');
const lastRound = pedri.ratingsByRound.length;
const PEDRI_RATINGS = pedri.ratingsByRound.map((value, i) => ({
  label: `J${i + 1}`,
  value,
  tone: i + 1 === lastRound ? 'gold' : value >= 8 ? 'gold-soft' : 'win', // última jornada en oro fuerte
}));
const REFEREE_CARDS = [...getReferee('gil-manzano').cardsByMatch]
  .sort((a, b) => a.round - b.round)
  .map((match) => ({
    label: `J${match.round}`,
    segments: [{ value: match.yellow, tone: 'yellow-card' }, { value: match.red, tone: 'red-card' }],
  }));
const PEDRI_PASSES = pedri.passAccuracyByRound.map((value, i) => ({
  label: `J${i + 1}`,
  value,
  tone: value >= 90 ? 'gold' : 'win',
}));

// Datos de ejemplo para Radar (comparativa del mockup 10)
const RADAR_AXES = [
  { id: 'goals', label: 'Goles', max: 8 },
  { id: 'assists', label: 'Asistencias', max: 6 },
  { id: 'xg', label: 'xG', max: 8 },
  { id: 'shotsOnTarget', label: 'Tiros', max: 20 },
  { id: 'passAccuracy', label: 'Pase %', min: 50, max: 100 },
  { id: 'rating', label: 'Valoración', min: 5, max: 9 },
];
const RADAR_SERIES = COMPARISON_EXAMPLE.map((id) => {
  const player = getPlayer(id);
  return { name: player.name.split(' ').at(-1), values: player };
});

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
        name="Notifications"
        owner="Ivan"
        usage={`Va en la Navbar cuando hay sesión: campana arriba a la derecha (entra con un rol arriba).
Los avisos salen de useSession(): notifications, unreadCount, markAllRead().
El aviso emergente de gol sale una vez por visita; para verlo otra vez, pulsa el botón de abajo.`}
      >
        <div className="gallery__row">
          <Button
            variant="tertiary"
            onClick={() => {
              sessionStorage.removeItem('futkingva-toast-shown');
              window.location.reload();
            }}
            disabled={!user}
          >
            Ver otra vez el aviso emergente
          </Button>
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
        name="BarChart"
        owner="Ivan"
        usage={`// 04 · Valoración por jornada (oro ≥ 8, verde < 8, última jornada en oro fuerte)
<BarChart label="Valoración de Pedri" data={[{ label: 'J1', value: 7.4, tone: 'win' }, …]} min={6} max={9} gridSteps={3} average={8.1} decimals={1} />

// 07 · Tarjetas por partido: barras apiladas amarillas + rojas, media de la liga en gris
<BarChart data={[{ label: 'J3', segments: [{ value: 4, tone: 'yellow-card' }, { value: 1, tone: 'red-card' }] }, …]} max={8} gridSteps={4} average={4.9} averageTone="neutral" height={230} barWidth={72} />

// 09 · Pase por jornada, sin líneas
<BarChart data={[{ label: 'J1', value: 90, tone: 'gold' }, …]} min={80} max={95} height={170} />`}
      >
        <p className="gallery__note">04 · Valoración de Pedri por jornada</p>
        <BarChart label="Valoración de Pedri por jornada" data={PEDRI_RATINGS} min={6} max={9} gridSteps={3} average={pedri.rating} decimals={1} />
        <p className="gallery__note">07 · Tarjetas de Gil Manzano por partido</p>
        <BarChart label="Tarjetas por partido de Gil Manzano" data={REFEREE_CARDS} max={8} gridSteps={4} average={LEAGUE_CARDS_PER_MATCH} averageTone="neutral" height={230} barWidth={72} />
        <p className="gallery__note">09 · Precisión de pase de Pedri (%)</p>
        <BarChart label="Precisión de pase de Pedri por jornada" data={PEDRI_PASSES} min={80} max={95} height={170} />
      </GalleryItem>

      <GalleryItem
        name="Radar"
        owner="Ivan"
        usage={`<Radar
  label="Comparativa de jugadores"
  axes={[{ id: 'goals', label: 'Goles', max: 6 }, …, { id: 'rating', label: 'Valoración', min: 5, max: 9 }]}
  series={[{ name: 'Pedri', values: { goals: 2, assists: 4, … } }, …]}   // hasta 4 jugadores (colores serie 1–4)
/>`}
      >
        <Radar label="Comparativa de Pedri, Bellingham y Yamal" axes={RADAR_AXES} series={RADAR_SERIES} />
        <p className="gallery__note">Con 4 jugadores (el cuarto en coral):</p>
        <Radar label="Comparativa con Mbappé" axes={RADAR_AXES} series={[...RADAR_SERIES, { name: 'Mbappé', values: getPlayer('mbappe') }]} />
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
        name="Tag"
        owner="Carlota"
        usage={'<Tag category="Táctica" />\n<Tag category={article.category} />   // Táctica, Crónica, Previa o Datos (ARTICLES)\n<Tag featured>Destacado</Tag>'}
      >
        <div className="gallery__row">
          <Tag category="Táctica" />
          <Tag category="Crónica" />
          <Tag category="Previa" />
          <Tag category="Datos" />
          <Tag featured>Destacado</Tag>
        </div>
      </GalleryItem>

      <GalleryItem
        name="StatusBadge"
        owner="Carlota"
        usage={"<StatusBadge status={article.status} />   // 'published' | 'scheduled' | 'draft'\n<StatusBadge status={user.status} />      // 'active' | 'blocked'"}
      >
        <div className="gallery__row">
          <StatusBadge status="published" />
          <StatusBadge status="scheduled" />
          <StatusBadge status="draft" />
          <StatusBadge status="active" />
          <StatusBadge status="blocked" />
        </div>
      </GalleryItem>

      <GalleryItem
        name="Illustration"
        owner="Carlota"
        usage={"<Illustration type=\"Táctica\" />\n<Illustration type=\"Táctica\" stat=\"91 %\" />                 // con hexágono (destacado)\n<Illustration type=\"Crónica\" score=\"3 – 0\" caption=\"FINAL · 90+2'\" />\n<Illustration type=\"Previa\" home=\"real-madrid\" away=\"sevilla\" />   // ids de TEAMS\n<Illustration type=\"Datos\" />\n<Illustration type=\"Datos\" size=\"thumb\" />                  // miniatura de móvil (96 × 84)\nEl alto lo pone quien la usa: className con height (por defecto 200 px)."}
      >
        <div className="gallery__grid">
          <Illustration type="Táctica" stat="91 %" />
          <Illustration type="Crónica" score="3 – 0" caption="FINAL · 90+2'" />
          <Illustration type="Previa" home="real-madrid" away="sevilla" />
          <Illustration type="Datos" />
        </div>
        <div className="gallery__row">
          <Illustration className="gallery__thumb" type="Táctica" size="thumb" />
          <Illustration className="gallery__thumb" type="Crónica" size="thumb" score="3 – 0" caption="FINAL · 90+2'" />
          <Illustration className="gallery__thumb" type="Previa" size="thumb" home="real-madrid" away="sevilla" />
          <Illustration className="gallery__thumb" type="Datos" size="thumb" />
        </div>
      </GalleryItem>

      <GalleryItem
        name="ArticleCard"
        owner="Carlota"
        usage={"<ArticleCard article={getArticle('barca-ocho-de-ocho')} excerpt=\"El 3 – 0 al Getafe…\" illustration={{ score: '3 – 0', caption: \"FINAL · 90+2'\" }} />\n<ArticleCard article={article} layout=\"compact\" />   // lista de móvil\nillustration: lo que necesita <Illustration> según la categoría. Lleva a /analisis/<id> (o a «to»)."}
      >
        <div className="gallery__grid">
          <ArticleCard
            article={getArticle('madrid-de-mourinho')}
            excerpt="Qué ha cambiado en el Madrid en sus primeras ocho jornadas con Mourinho."
          />
          <ArticleCard
            article={getArticle('barca-ocho-de-ocho')}
            excerpt="El 3 – 0 al Getafe completa un pleno de victorias en LaLiga."
            illustration={{ score: '3 – 0', caption: "FINAL · 90+2'" }}
          />
          <ArticleCard
            article={getArticle('previa-real-madrid-sevilla')}
            excerpt="Lo que dicen los datos antes del partido del domingo."
            illustration={{ home: 'real-madrid', away: 'sevilla' }}
          />
        </div>
        <div className="gallery__stack gallery__stack--narrow">
          <ArticleCard article={getArticle('madrid-de-mourinho')} layout="compact" />
          <ArticleCard
            article={getArticle('celta-athletic-defensas')}
            layout="compact"
          />
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
