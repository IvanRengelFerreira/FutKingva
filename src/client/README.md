# FutKingva · Front-end (Parte 3)

Guía para el equipo: qué hay en esta carpeta, cómo ponerla en marcha y cómo vamos a trabajar.

| Versión | Fecha | Autor | Cambio |
|---------|-------|-------|--------|
| 0.1 | 14/10/2026 | Ivan Rengel | Primera versión de la guía |
| 0.2 | 14/10/2026 | Ivan Rengel | Reparto de páginas y componentes, y calendario |
| 0.3 | 14/10/2026 | Ivan Rengel | Colores globales en `styles/colores.css`; el resto del CSS se hace de forma progresiva |
| 0.4 | 14/10/2026 | Ivan Rengel | `styles/global.css` creado vacío para completarlo entre todos |
| 0.5 | 14/10/2026 | Ivan Rengel | Ajuste del reparto de páginas |
| 0.6 | 14/10/2026 | Ivan Rengel | Enlaces a Figma de cada página y de cada componente |
| 0.7 | 14/10/2026 | Ivan Rengel | El componente `Cabecera` pasa a llamarse `Navbar` (en Figma sigue siendo «Cabecera») |
| 0.8 | 16/10/2026 | Ivan Rengel | El código se escribe en inglés (archivos, componentes, clases, variables); comentarios e interfaz siguen en español. `colores.css` → `colors.css`, `Pie` → `Footer` |
| 0.9 | 16/10/2026 | Ivan Rengel | Rutas entre páginas con React Router (`HashRouter`) y `Layout`; tabla de rutas acordadas en el apartado 6. Cada uno crea sus vistas y añade sus rutas |
| 1.0 | 17/10/2026 | Ivan Rengel | Base común terminada: Navbar y Footer móviles, menú ☰ (`MobileMenu`), sesión simulada (`useSession`), páginas privadas (`RequireRole`), aviso de rol (`RoleNotice`) y datos de ejemplo (`data/mockData.js`). Apartado 6 ampliado con cómo usarlos |
| 1.1 | 18/10/2026 | Ivan Rengel | `mockData.js` pasa a **datos reales de la temporada 2026/27** congelados el sábado 17/10 a las 17:00 (Racing, Deportivo y Málaga en Primera; Mourinho en el Madrid). Los mockups de Figma ya están actualizados con los mismos datos. Nuevos `TODAY` y `UPCOMING_MATCHES` |
| 1.2 | 18/10/2026 | Ivan Rengel | Componentes compartidos `Button`, `Tabs` y `LiveBadge` hechos (cómo usarlos en el apartado 9) |
| 1.3 | 18/10/2026 | Ivan Rengel | Página **temporal** `#/componentes` (`views/ComponentGallery`) con todos los componentes compartidos y cómo se usan. Cuando hagáis uno, añadid ahí su bloque. Se borra antes de la entrega |
| 1.4 | 18/10/2026 | Ivan Rengel | Componentes `BarChart`, `Radar` y `Notifications` hechos (campana con desplegable y aviso emergente de gol). Nuevo color `--card-yellow` (tarjetas amarillas). `useSession()` da también `notifications`, `unreadCount` y `markAllRead()`. Cuarto color del comparador `--series-4` (coral) |
| 1.5 | 18/10/2026 | Ivan Rengel | La versión final (`npm run build`) se abre con doble clic en `dist/index.html` (file://), sin servidor |
| 1.6 | 18/10/2026 | Ivan Rengel | Página 14 · Acceso hecha, como página propia sin navbar ni pie. `Tabs` tiene la opción `fill` (pestañas a todo el ancho). Al entrar desde una página privada, Acceso vuelve a ella |

---

## 1. Qué hay que entregar

Enunciado: `SW1_proyecto_p3.pdf` (prof. Álvaro Sánchez Picot).

- **Desarrollar el front-end** de la aplicación a partir del diseño (wireframes + mockups), con **HTML, CSS y JS**.
- La página principal es **`index.html`**.
- Se puede **navegar** entre las páginas.
- **No hay servidor** todavía: los datos que vendrían del servidor se **escriben a mano** (hardcodeados).
- Tiene que **funcionar como un mockup**: se ve y se navega como la web real, pero sin backend.
- Se pueden usar frameworks CSS y bibliotecas JS, pero **se valora el CSS y el JS propios**.
- **Fecha límite: martes 3 de noviembre de 2026.** La entrega es tenerlo subido al repositorio (nada en Blackboard).

> ⚠️ La diapositiva de entrega dice «en la carpeta docs». Hemos decidido que `docs/` es solo para documentos y que el código va en `client/`. Si hay dudas, se lo preguntamos al profesor.

---

## 2. Tecnología

| Pieza | Qué es | Para qué la usamos |
|-------|--------|--------------------|
| **React 19** (`react` + `react-dom`) | Biblioteca de JavaScript | Construir la interfaz con componentes reutilizables |
| **React Router 7** (`react-router`) | Biblioteca de rutas para React | Navegar entre las 20 páginas sin recargar (`HashRouter`: direcciones con `#`, funciona sin servidor) |
| **Vite** | Herramienta de desarrollo (no es framework ni biblioteca, no aparece en la web final) | Traducir el JSX, servir la web en local y generar la versión final |
| **CSS propio** | — | Todos los estilos los escribimos nosotros, sin frameworks |

**Por qué React es una biblioteca:** nosotros decidimos la estructura y lo llamamos cuando lo necesitamos; React solo se encarga de pintar la interfaz y actualizarla cuando cambian los datos. No impone rutas, ni carpetas, ni cómo se piden los datos (eso sería un framework, como Angular o Next.js).

Ideas básicas de React:

- **Componente:** una función que devuelve lo que se ve. Lo que parece HTML dentro del JS se llama **JSX**.
  ```jsx
  function Crest({ initials }) {
    return <span className="crest">{initials}</span>;
  }
  ```
- **Props:** datos que un componente recibe de otro → `<Crest initials="RMA" />`.
- **Estado (`useState`):** datos que cambian con el uso (pestaña activa, favoritos…). Cuando cambian, React vuelve a pintar el componente.
- En JSX se escribe `className` en lugar de `class`.

---

## 3. Primeros pasos (una sola vez)

1. Instalar **Node.js 22 LTS** (incluye `npm`): <https://nodejs.org>. Comprobar en una terminal:
   ```bash
   node -v
   npm -v
   ```
2. Clonar el repositorio (o hacer `git pull` si ya lo tenéis):
   ```bash
   git clone https://github.com/IvanRengelFerreira/FutKingva.git
   ```
3. Entrar en `client/` e instalar las dependencias:
   ```bash
   cd FutKingva/client
   npm install
   ```
   Esto crea la carpeta `node_modules/`. **No se sube a GitHub** (está en `.gitignore`); cada uno la genera en su ordenador.

---

## 4. Comandos del día a día

Siempre desde la carpeta `client/`:

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Arranca la web en <http://localhost:5173>. Se recarga sola al guardar. **Es el que usaréis siempre.** |
| `npm run build` | Genera la versión final en `client/dist/` (no se sube a GitHub). Se abre con **doble clic en `dist/index.html`**, sin servidor (así lo pide el enunciado); `vite.config.js` ya está preparado para ello. |
| `npm run preview` | Sirve la versión de `dist/` para comprobar que el build funciona. |

Para parar el servidor: `Ctrl + C` en la terminal.

---

## 5. Qué hay ahora mismo

```
client/
├── index.html        # Página principal: solo tiene <div id="root"> donde React lo pinta todo
├── main.jsx          # Arranca React y monta <App /> dentro de #root
├── App.jsx           # Rutas de la web: qué vista se ve en cada dirección (apartado 6)
├── assets/           # Logos e iconos sacados de Figma (logo-*.svg, icon-*.svg)
├── components/
│   ├── Layout/       # Navbar + página actual + Footer (común a todas las páginas)
│   ├── Navbar/       # Navbar con y sin sesión, escritorio y móvil (en Figma: «Cabecera»)
│   ├── MobileMenu/   # Menú lateral que se abre con ☰ en móvil
│   ├── Footer/       # Pie, escritorio y móvil (en Figma: «Pie»)
│   ├── RequireRole/  # Protege las páginas privadas (apartado 6)
│   └── RoleNotice/   # Aviso «Zona de editor» / «Zona de administración»
├── context/
│   └── SessionContext.jsx  # Sesión simulada: useSession() (apartado 6)
├── data/
│   └── mockData.js   # Datos de ejemplo de toda la web (apartado 6)
├── views/            # Una carpeta por página: de momento las de Ivan (vacías) + NotFound
├── styles/
│   ├── colors.css    # Colores globales de la web (ver apartado 7)
│   └── global.css    # Estilos compartidos: se completa entre todos
├── vite.config.js    # Configuración de Vite (plugin de React, rutas relativas)
├── package.json      # Dependencias y comandos
└── package-lock.json # Versiones exactas instaladas (sí se sube)
```

Para añadir una página tuya:
1. Crea `views/<Vista>/<Vista>.jsx` (y su `.css` al lado) con el nombre de la tabla del apartado 6.
2. En `App.jsx`, impórtala y añade su `<Route>` con la ruta de la tabla, en el grupo que toque (públicas, usuario registrado, editor, administrador). Si es privada, envuélvela con `RequireRole` (apartado 6).

Mientras una página no tenga ruta, su enlace lleva a «Página no encontrada».

---

## 6. Estructura y rutas

```
client/
├── views/            # Una carpeta por página del sitemap (las 20): Home/, PlayerProfile/, …
│   └── Home/
│       ├── Home.jsx
│       └── Home.css
├── components/       # Piezas reutilizables: Navbar/, Footer/, Crest/, Rating/, FormGuide/, …
├── styles/
│   ├── colors.css    # Colores globales (ya creado y completo)
│   └── global.css    # Estilos compartidos (creado vacío; se completa entre todos)
└── data/
    └── mockData.js   # Datos de ejemplo escritos a mano
```

### Rutas

Rutas **acordadas**: cada uno añade las suyas en `App.jsx` con exactamente estas direcciones (la Navbar, el Footer y los enlaces entre páginas ya las usan). Las direcciones llevan `#` delante (`index.html#/clasificaciones`) para que funcionen sin servidor.

| # | Página | Vista (`views/…`) | Ruta |
|---|--------|-------------------|------|
| 01 | Inicio | `Home` | `/` |
| 02 | Equipos y jugadores | `TeamsAndPlayers` | `/equipos` |
| 03 | Ficha de equipo | `TeamProfile` | `/equipos/:teamId` |
| 04 | Ficha de jugador | `PlayerProfile` | `/jugadores/:playerId` |
| 05 | Clasificaciones | `Standings` | `/clasificaciones` |
| 06 | Árbitros | `Referees` | `/arbitros` |
| 07 | Ficha de árbitro | `RefereeProfile` | `/arbitros/:refereeId` |
| 08 | Análisis | `Analysis` | `/analisis` |
| 09 | Artículo | `Article` | `/analisis/:articleId` |
| 10 | Comparador | `Comparator` | `/comparador` |
| 11 | Mi equipo ideal | `IdealTeam` | `/equipo-ideal` |
| 12 | Mi perfil | `Profile` | `/perfil` |
| 13 | Resultados de búsqueda | `SearchResults` | `/buscar?q=texto` |
| 14 | Acceso | `Access` | `/acceso` (`/acceso?registro` abre la pestaña de registro). Página propia **sin navbar ni pie** (ruta fuera de `Layout`) |
| 15 | Sobre nosotros | `About` | `/sobre-nosotros` |
| 16 | Contacto | `Contact` | `/contacto` |
| 17 | Panel de editor | `EditorDashboard` | `/editor` |
| 18 | Editor de artículo | `ArticleEditor` | `/editor/articulo` |
| 19 | Actualizar datos de jugadores | `UpdatePlayerData` | `/editor/datos` |
| 20 | Panel de administración | `AdminDashboard` | `/admin` |
| — | Página no encontrada | `NotFound` | cualquier otra |

Cómo se usan:

```jsx
import { Link, useParams, useSearchParams } from 'react-router';

// Enlazar a otra página: siempre con <Link to="…">, nunca con <a href="…">
<Link to="/equipos/real-madrid">Real Madrid</Link>

// En una ficha, leer el identificador de la dirección (/equipos/real-madrid → "real-madrid")
const { teamId } = useParams();

// En Resultados de búsqueda, leer el texto buscado (/buscar?q=pedri → "pedri")
const [searchParams] = useSearchParams();
const query = searchParams.get('q');
```

Los identificadores de las fichas (`real-madrid`, `pedri`…) son los de `data/mockData.js`.

**Idioma del código:** todo lo que es código va **en inglés** (nombres de archivos y carpetas, componentes, clases CSS, variables CSS y JS, funciones). Los **comentarios** y los **textos que ve el usuario** (menú, botones, títulos…) van **en español**, como en los mockups. Ejemplo: `<a className="footer__link">Sobre nosotros</a>`.

Reglas para el CSS:

- **Nadie hace la hoja de estilos de antemano.** Los archivos ya existen y **cada uno va añadiendo el CSS que necesita mientras construye sus páginas y componentes**.
- `styles/colors.css` es lo único que ya está completo (apartado 7). **Nunca escribir un color a mano** (`#F5C542`, `white`…): usar siempre la variable (`var(--accent-gold)`).
- `styles/global.css` empieza vacío. Ahí va lo que compartan varias páginas (estilos base, contenedor, tarjetas, tablas, botones, móvil…). Antes de añadir, mira si ya hay una clase que te sirva; si cambias algo que ya existe, avisa al grupo porque afecta a todas las páginas.
- Lo que es solo de una página o componente va en su propio `.css`, con un prefijo de clase para no pisar a otros (`.home …`).
- Si ves que algo de tu `.css` lo necesita otra página, muévelo a `global.css` y avisa.

### Datos de ejemplo (`data/mockData.js`)

Todos los datos de la web están en **un solo archivo**, los mismos que en los mockups. Son **datos reales de la temporada 2026/27** congelados el sábado 17/10 a las 17:00 (jornada 9 a medias); lo que no se pudo consultar está marcado en el archivo como «estimado» o «simulado». Así todas las páginas cuentan la misma historia.

| Qué | Nombre |
|-----|--------|
| Temporada y momento congelado (jornada, fecha y hora) | `SEASON`, `TODAY` |
| Equipos (27, con siglas y color del escudo) | `TEAMS`, `getTeam(id)` |
| Clasificación de LaLiga y zonas de color | `STANDINGS_LALIGA`, `STANDINGS_ZONES`, `getStandingsZone(posición)` |
| Partidos en directo, próximos y últimos resultados | `LIVE_MATCHES`, `UPCOMING_MATCHES`, `LATEST_RESULTS` |
| Jugadores | `PLAYERS`, `getPlayer(id)`, `getPlayersByTeam(teamId)`, `PLAYER_OF_THE_ROUND` |
| Comparador y equipo ideal de ejemplo | `COMPARISON_EXAMPLE`, `IDEAL_TEAM_EXAMPLE` |
| Árbitros | `REFEREES`, `getReferee(id)`, `LEAGUE_CARDS_PER_MATCH` |
| Artículos y panel de editor | `ARTICLES`, `getArticle(id)`, `EDITOR_STATS` |
| Notificaciones | `NOTIFICATIONS` |
| Panel de administración | `ADMIN_STATS`, `USERS`, `REPORTS` |

```jsx
import { useParams } from 'react-router';
import { getTeam, getPlayersByTeam } from '../../data/mockData.js';

// En la ficha de equipo (/equipos/real-madrid)
const { teamId } = useParams();
const team = getTeam(teamId);          // { id, code: 'RMA', name: 'Real Madrid', color: '#D9D9D9', … }
const players = getPlayersByTeam(teamId);
```

- Los datos se enlazan por **id** (`teamId: 'barcelona'`); el id es el mismo que va en la dirección.
- Si necesitas un dato que no está, añádelo ahí (no en tu página) y comprueba que cuadra con el resto. Si cambias algo que ya existe, avisa.

### Sesión simulada (`useSession`)

No hay servidor, así que «iniciar sesión» solo guarda en el navegador con qué rol has entrado: **Usuario**, **Editor** o **Admin**. Para probar, entra en `#/acceso` y pulsa uno de los botones de acceso rápido. «Cerrar sesión» está en el desplegable del usuario (escritorio) y en el menú ☰ (móvil).

```jsx
import { useSession } from '../../context/SessionContext.jsx';

const { user, login, logout } = useSession();
// user → null si es un invitado; si no: { role: 'user' | 'editor' | 'admin', name, initials, notifications }

{user ? <p>Hola, {user.name}</p> : <Link to="/acceso">Inicia sesión</Link>}
{user?.role === 'editor' && <button>Editar</button>}
```

**Páginas privadas (`RequireRole`):** si no hay sesión, o el rol no es el adecuado, la página lleva a Acceso. Se pone en `App.jsx`, alrededor de la vista:

```jsx
// Solo con sesión (cualquier rol): Mi perfil
<Route path="perfil" element={<RequireRole><Profile /></RequireRole>} />

// Solo editores: páginas 17, 18 y 19
<Route path="editor" element={<RequireRole roles={['editor']}><EditorDashboard /></RequireRole>} />
```

Ya están protegidas Comparador, Mi equipo ideal y Panel de administración.

**Aviso de rol (`RoleNotice`):** la barra azul «Zona de editor» (páginas 17–19) o roja «Zona de administración» (20) que va al principio de la página, como en los mockups:

```jsx
import RoleNotice from '../../components/RoleNotice/RoleNotice.jsx';

<RoleNotice role="editor" />
```

---

## 7. Diseño: de dónde sacar cada página

Todo está en el archivo de Figma del proyecto: <https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP> (pedid acceso a Ivan si no lo tenéis).

| Página de Figma | Qué contiene |
|-----------------|--------------|
| **Guía de estilo** | Colores (también como variables de Figma), tipografías y componentes con sus estados |
| **Mockups** | Las **20 páginas** en escritorio (1440 px) y móvil (390 px), numeradas igual que el sitemap, + menú móvil y panel de notificaciones |
| Escritorio / Móvil | Wireframes de la Parte 2 (solo estructura) |

### Colores globales

Están definidos **una sola vez** en [`styles/colors.css`](styles/colors.css) como variables CSS. Los nombres son la traducción al inglés de las variables de Figma (`fondo/base` → `--bg-base`, `acento/oro` → `--accent-gold`). Se cargan en `main.jsx`, así que están disponibles en cualquier componente o vista sin importar nada más.

| Grupo | Variable | Color | Uso |
|-------|----------|-------|-----|
| Fondos | `--bg-base` | `#07120E` | Fondo general de la página |
| | `--bg-surface` | `#0D1C16` | Tarjetas, tablas, navbar, pie |
| | `--bg-elevated` | `#132820` | Elementos sobre tarjetas, menús, cabeceras de tabla |
| | `--bg-hover` | `#1A3329` | Fila o tarjeta al pasar el ratón |
| | `--border` | `#213D31` | Bordes y separadores |
| Marca | `--brand-green-900` | `#0B3D2E` | Verde del logo |
| | `--brand-green-700` | `#0E5A40` | Verde claro |
| | `--accent-gold` | `#F5C542` | Acción principal, líder, destacados, enlace activo |
| | `--accent-amber` | `#F2A000` | Hover del oro |
| | `--accent-gold-soft` | `#2B2814` | Fondo de chips y etiquetas doradas |
| Texto | `--text-primary` | `#F3F6F4` | Títulos y texto principal |
| | `--text-secondary` | `#A3B8AD` | Texto de apoyo, etiquetas |
| | `--text-tertiary` | `#66806F` | Metadatos, placeholders, deshabilitado |
| Estados | `--status-win` | `#3DDC97` | Victoria, subida, correcto |
| | `--status-draw` | `#9AA8A1` | Empate, sin cambios |
| | `--status-loss` | `#FF5C5C` | Derrota, bajada, error, eliminar |
| | `--status-live` | `#FF3D57` | En directo, avisos nuevos |
| | `--status-info` | `#5CB8FF` | Información, zona Champions, rol editor |
| | `--card-yellow` | `#FFD43B` | Tarjetas amarillas (las rojas usan `--status-loss`) |
| Velo | `--overlay` | negro al 60 % | Detrás del menú móvil y de las ventanas emergentes |
| Comparador | `--series-1` / `--series-2` / `--series-3` / `--series-4` | `#F5C542` / `#5CB8FF` / `#C08CFF` / `#FF8F5C` | Jugador A, B, C y D |
| Degradados | `--gradient-brand` | verde 900 → 700 | Logo, cabeceras de ficha |
| | `--gradient-gold` | oro → ámbar | Botón principal |

Ejemplo:

```css
.standings .leader {
  color: var(--accent-gold);
  border-left: 3px solid var(--accent-gold);
  background: var(--bg-surface);
}
```

¿Hace falta un color que no está? Se añade primero en `colors.css` (y en Figma), se avisa al grupo y luego se usa.

### Resto de la guía de estilo

- **Tipografías** (Google Fonts): **Big Shoulders Display** para títulos y cifras, **Schibsted Grotesk** para el texto y la interfaz, **Instrument Serif** solo para titulares de Análisis.
- **Sin fotos ni escudos reales**: los escudos son círculos con las siglas y el color del club; las valoraciones van en un hexágono.

Los datos de los mockups son coherentes entre sí (clasificación, jugadores, partidos). Usad **los mismos números** que aparecen en Figma: salen de `data/mockData.js`, así que si algo no coincide, manda el archivo de datos.

---

## 8. Cómo trabajamos con Git

1. **Antes de empezar**, traer lo último:
   ```bash
   git pull
   ```
2. Trabajar en vuestra parte y comprobarla con `npm run dev`.
3. Subir los cambios:
   ```bash
   git add .
   git commit -m "Añade la vista de Clasificaciones"
   git push
   ```

Normas:

- Mensajes de commit **en español** y describiendo qué se ha hecho.
- **No subir** `node_modules/` ni `dist/` (ya están en `.gitignore`).
- Si dos personas tocan el mismo archivo compartido (`global.css`, `App.jsx`…), avisad por el grupo antes.

---

## 9. Reparto

Los números de página son los del sitemap y de Figma. En la columna **Diseño** está el enlace directo a la sección de la página «Mockups» de Figma (escritorio y móvil, uno al lado del otro).

### Ivan

| # | Página | Notas | Diseño |
|---|--------|-------|--------|
| — | **Base común** | Estructura de carpetas, `Navbar`, `Footer`, menú móvil, rutas entre páginas (una vista vacía por página), sesión simulada, `mockData.js`. Los colores globales ya están hechos (`styles/colors.css`). | [Componentes de mockup](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=38-154) · [00 · Componentes interactivos](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=67-1464) |
| 01 | Inicio | Partidos en directo, últimos resultados, clasificación rápida, destacados | [Mockup 01](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=40-20) |
| 04 | Ficha de jugador | Indicadores, gráfico de rendimiento por jornada, últimos partidos | [Mockup 04](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=45-221) |
| 10 | Comparador | Tabla lado a lado y gráfico radar (RF4) | [Mockup 10](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=54-623) |
| 11 | Mi equipo ideal | Campo con el once y buscador de jugadores (RF5) | [Mockup 11](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=55-702) |
| 14 | Acceso | Hecha. Pestañas iniciar sesión / registrarse, botones de acceso rápido por rol (RF1). Sin navbar ni pie | [Mockup 14](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=58-1144) |
| 20 | Panel de administración | Pestañas usuarios / moderación (RF8) | [Mockup 20](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=64-1365) |

### Angel

| # | Página | Notas | Diseño |
|---|--------|-------|--------|
| 02 | Equipos y jugadores | Buscador, filtros y rejilla de equipos | [Mockup 02](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=43-87) |
| 03 | Ficha de equipo | Cabecera del equipo, indicadores, plantilla, próximos partidos | [Mockup 03](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-154) |
| 05 | Clasificaciones | Tabla completa con zonas de color (RF6) | [Mockup 05](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=48-288) |
| 06 | Árbitros | Listado con tarjetas por partido (RF11) | [Mockup 06](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=51-355) |
| 07 | Ficha de árbitro | Indicadores y gráfico de tarjetas por jornada | [Mockup 07](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=51-743) |
| 12 | Mi perfil | Favoritos, comparativas guardadas, equipo ideal (RF3) | [Mockup 12](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=56-781) |
| 13 | Resultados de búsqueda | Equipos y jugadores que coinciden, con el texto resaltado (RF10) | [Mockup 13](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=58-860) |

### Carlota

| # | Página | Notas | Diseño |
|---|--------|-------|--------|
| 08 | Análisis | Artículo destacado y rejilla de artículos | [Mockup 08](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=52-489) |
| 09 | Artículo | Columna de lectura, dato destacado, jugadores mencionados | [Mockup 09](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=53-556) |
| 15 | Sobre nosotros | Presentación, qué ofrecemos, el equipo | [Mockup 15](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=59-994) |
| 16 | Contacto | Formulario con validación y mensaje de enviado | [Mockup 16](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=59-1254) |
| 17 | Panel de editor | Indicadores y tabla de mis artículos (RF7) | [Mockup 17](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=61-1128) |
| 18 | Editor de artículo | Editor de texto, publicación, clasificación, portada | [Mockup 18](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=61-1565) |
| 19 | Actualizar datos de jugadores | Formulario de corrección e historial de cambios | [Mockup 19](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=62-1286) |

Cada uno hace **escritorio y móvil** de sus páginas (los dos mockups de Figma).

### Componentes compartidos

Para no hacer dos veces lo mismo, cada componente tiene un responsable. Quien lo necesite antes de que esté hecho, que avise o ponga un texto provisional.

En **Dónde está el diseño**, el primer enlace es donde mejor se ve el componente; los números son las páginas de «Mockups» en las que aparece. La [Guía de estilo › 3. Componentes](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=30-20) tiene además los botones, campos, pestañas, chips e indicadores con sus estados.

| Componente | Responsable | Qué es | Dónde está el diseño |
|------------|-------------|--------|----------------------|
| `Navbar` | Ivan | Logo, menú, buscador; versión sin sesión y con sesión (campana + usuario) | [Componentes de mockup](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=38-154) · todas las páginas |
| `Footer` | Ivan | Logo, copyright, Sobre nosotros y Contacto | [Componentes de mockup](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=38-154) · todas las páginas |
| `MobileMenu` | Ivan | Cajón lateral que se abre con ☰ en móvil | [00 · Componentes interactivos](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=67-1464) |
| `RequireRole` | Ivan | Hecho. Página privada: sin sesión o sin el rol necesario lleva a Acceso | — |
| `RoleNotice` | Ivan | Hecho. Aviso «Zona de editor» (azul) / «Zona de administración» (roja) | [17](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=61-1128), [20](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=64-1365) |
| `Notifications` | Ivan | Hecho. Panel de la campana y aviso emergente de gol (RF9). Va solo en la Navbar con sesión; los avisos salen de `useSession()` (`notifications`, `unreadCount`, `markAllRead()`) | [00 · Componentes interactivos](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=67-1464) · [12](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=56-781) |
| `Button` | Ivan | Hecho. Primario (oro), secundario (borde oro), terciario, peligro y deshabilitado. `<Button variant="secondary" onClick={…}>★ Seguir</Button>`; con `to="/acceso"` es un enlace con aspecto de botón | [Guía de estilo › Botones](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=30-20) · todas las páginas |
| `Tabs` | Ivan | Hecho. Pestañas con subrayado oro; la página guarda la activa con `useState`: `<Tabs tabs={[{ id: 'summary', label: 'Resumen' }, …]} active={tab} onChange={setTab} />` | [Guía de estilo › Pestañas](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=30-20) · [02](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=43-87), [03](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-154), [12](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=56-781), [13](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=58-860), [14](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=58-1144), [20](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=64-1365) |
| `MatchCard` | Ivan | Partido en directo: escudos, marcador, minuto, barra de progreso | [01](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=40-20) |
| `LiveBadge` | Ivan | Hecho. Etiqueta roja con punto «EN DIRECTO»: `<LiveBadge minute={67} />` → «EN DIRECTO · 67'» | [Guía de estilo › Indicadores](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=30-20) · [01](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=40-20), [05](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=48-288) |
| `Radar` | Ivan | Hecho. Gráfico radar hexagonal: `<Radar axes={[{ id: 'goals', label: 'Goles', max: 6 }, …]} series={[{ name: 'Pedri', values: {…} }, …]} />` (hasta 4 jugadores) | [10](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=54-623) |
| `Pitch` | Ivan | Campo con los jugadores colocados por posición | [11](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=55-702), [12](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=56-781) |
| `BarChart` | Ivan | Hecho. Barras por jornada con línea de media, también apiladas (tarjetas amarillas + rojas). Ejemplos de 04, 07 y 09 en `#/componentes` | [04](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=45-221), [07](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=51-743), [09](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=53-556) |
| `Crest` | Angel | Círculo con siglas y color del club | [01](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=40-20), [02](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=43-87), [03](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-154), [05](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=48-288) · y casi todas las tablas |
| `Avatar` | Angel | Círculo con iniciales del jugador o usuario | [03](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-154), [04](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=45-221), [10](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=54-623), [12](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=56-781), [20](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=64-1365) |
| `FormGuide` | Angel | Últimos resultados V / E / D en colores | [Guía de estilo › Indicadores](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=30-20) · [01](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=40-20), [02](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=43-87), [03](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-154), [05](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=48-288) |
| `Rating` | Angel | Nota dentro de un hexágono (oro ≥ 8, verde 7–8, gris 6–7, rojo < 6) | [Guía de estilo › Indicadores](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=30-20) · [03](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-154), [04](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=45-221), [11](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=55-702) |
| `StandingsTable` | Angel | Tabla de liga con zonas de color y líder en oro | [05](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=48-288), [01](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=40-20) |
| `StatCard` | Angel | Cifra grande con su etiqueta debajo | [03](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-154), [04](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=45-221), [07](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=51-743), [17](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=61-1128), [20](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=64-1365) |
| `Pagination` | Angel | Botones ‹ 1 2 3 › | [02](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=43-87), [06](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=51-355), [08](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=52-489), [17](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=61-1128), [20](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=64-1365) |
| `Breadcrumbs` | Angel | Ruta «Equipos y jugadores / LaLiga / Real Madrid» | [03](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-154), [04](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=45-221), [07](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=51-743), [09](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=53-556), [18](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=61-1565), [19](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=62-1286) |
| `Tag` | Carlota | Categoría de artículo: Táctica, Datos, Crónica, Previa | [08](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=52-489), [09](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=53-556), [17](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=61-1128) |
| `ArticleCard` | Carlota | Ilustración + etiqueta + titular en serif | [08](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=52-489), [09](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=53-556), [01](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=40-20) |
| `Illustration` | Carlota | Imagen generada sin foto (campo, barras, escudos, marcador) | [08](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=52-489), [09](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=53-556), [01](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=40-20), [18](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=61-1565) |
| `TextField` | Carlota | Campo de formulario con etiqueta, foco y error | [Guía de estilo › Campos](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=30-20) · [14](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=58-1144), [16](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=59-1254), [18](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=61-1565), [19](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=62-1286) |
| `Select` | Carlota | Desplegable con flecha | [02](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=43-87), [05](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=48-288), [16](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=59-1254), [18](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=61-1565), [19](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=62-1286), [20](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=64-1365) |
| `Checkbox` | Carlota | Casilla de verificación | [14](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=58-1144), [16](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=59-1254) |
| `StatusBadge` | Carlota | Publicado / Borrador / Programado · Activo / Bloqueado | [17](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=61-1128), [20](https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=64-1365) |

### Calendario

| Fechas | Qué |
|--------|-----|
| 14 – 18 oct | Ivan sube la **base común**. Angel y Carlota empiezan sus componentes compartidos. |
| 19 – 27 oct | Cada uno maqueta sus páginas en **escritorio**. |
| 28 oct – 31 oct | Versión **móvil** de cada página y revisión cruzada (cada uno revisa las páginas de otro). |
| 1 – 2 nov | Repaso final: navegación completa entre las 20 páginas, `npm run build` sin errores. |
| **3 nov** | **Entrega** (todo subido al repositorio). |

> Es una propuesta: si alguien prefiere cambiar páginas, se habla en el grupo y se actualiza esta tabla.

---

## 10. Pendiente de decidir

- [x] Estructura de carpetas y rutas (apartado 6).
- [ ] Cómo simular la sesión (invitado / usuario / editor / admin).
