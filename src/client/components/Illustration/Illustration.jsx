import './Illustration.css';
import { getTeam } from '../../data/mockData.js';

// Imagen «dibujada» para los artículos (la web no usa fotos). Hay una por categoría:
//   Táctica → medio campo con una jugada en oro (y, si se quiere, una cifra en un hexágono)
//   Crónica → marcador grande con una línea debajo («FINAL · 90+2'»)
//   Previa  → los dos escudos enfrentados con «VS»
//   Datos   → gráfico de barras con la última en oro
// Se dibuja con SVG, así que se adapta al tamaño que le dé quien la usa (con className).
// Diseño: Figma › Mockups › 08 · Análisis › «Ilustración TÁCTICA / CRÓNICA / PREVIA / DATOS (sin foto)»
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=52-573
// Uso:
//   <Illustration type="Táctica" />
//   <Illustration type="Táctica" stat="91 %" />                       → con hexágono (destacado)
//   <Illustration type="Crónica" score="3 – 0" caption="FINAL · 90+2'" />
//   <Illustration type="Previa" home="real-madrid" away="sevilla" />  → ids de TEAMS (mockData.js)
//   <Illustration type="Datos" values={[3, 4.5, 4, 6, 5.5, 7.5, 9]} />
//   <Illustration type="Datos" size="thumb" />                         → miniatura de móvil (96 × 84)
// type admite la categoría tal cual viene en ARTICLES: 'Táctica', 'Crónica', 'Previa' o 'Datos'.

// Dos tamaños con su propio dibujo, como en Figma:
//   size="card"  (por defecto) → 436 × 200: tarjeta, destacado, portada del editor…
//   size="thumb"               → 96 × 84: miniatura de la lista de Análisis en móvil
// Las coordenadas son las de Figma; el SVG las escala al tamaño real.
const GEOMETRY = {
  card: {
    width: 436, height: 200,
    pitch: { x: 21.85, y: 16, w: 393.3, h: 168, r: 36 },
    play: 'M87.4 140C131.1 86.67 182.08 66.67 240.35 80L327.75 50',
    dots: [[87.4, 140], [240.35, 80], [327.75, 50]], dotR: 7,
    score: { y: 100, size: 84 }, caption: { y: 158, size: 12 },
    crests: { left: 131.1, right: 305.9, r: 40.5, size: 32, vs: 28 },
    bars: { x: 52.44, step: 48.07, w: 30.59, base: 170, max: 117, r: 4 },
  },
  thumb: {
    width: 96, height: 84,
    pitch: { x: 4.8, y: 6.72, w: 86.4, h: 70.56, r: 15.12 },
    play: 'M19.2 58.8C28.8 36.4 40 28 52.8 33.6L72 21',
    dots: [[19.2, 58.8], [52.8, 33.6], [72, 21]], dotR: 2.94,
    score: { y: 40, size: 36 }, caption: { y: 69, size: 9 },
    crests: { left: 28.8, right: 67.2, r: 16, size: 13, vs: 11 },
    bars: { x: 11.52, step: 10.56, w: 6.72, base: 71.4, max: 49.14, r: 3.36 },
  },
};

export default function Illustration({ type, size = 'card', className = '', ...props }) {
  const key = toKey(type);
  const Drawing = DRAWINGS[key] ?? TacticsDrawing;
  const geo = GEOMETRY[size] ?? GEOMETRY.card;

  return (
    <div className={`illustration illustration--${size} ${className}`.trim()} role="img" aria-label={label(key, props)}>
      <svg
        className="illustration__svg"
        viewBox={`0 0 ${geo.width} ${geo.height}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <Drawing geo={geo} {...props} />
      </svg>
    </div>
  );
}

/* Táctica: campo con círculo central y una jugada discontinua en oro */
function TacticsDrawing({ geo, stat }) {
  const { pitch, play, dots, dotR, width } = geo;
  const centerX = pitch.x + pitch.w / 2;
  const centerY = pitch.y + pitch.h / 2;
  return (
    <>
      <rect className="illustration__line" x={pitch.x} y={pitch.y} width={pitch.w} height={pitch.h} />
      <path className="illustration__line" d={`M${centerX} ${pitch.y}V${pitch.y + pitch.h}`} />
      <circle className="illustration__line" cx={centerX} cy={centerY} r={pitch.r} />
      <path className="illustration__play" d={play} />
      {dots.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} className="illustration__dot" cx={cx} cy={cy} r={dotR} />
      ))}
      {/* Cifra en un hexágono (artículo destacado); solo en el tamaño grande */}
      {stat && width === 436 && (
        <g>
          <polygon className="illustration__hexagon" points="363,50 402,72.5 402,117.5 363,140 324,117.5 324,72.5" />
          <text className="illustration__hexagon-text" x="363" y="96">{stat}</text>
        </g>
      )}
    </>
  );
}

/* Crónica: marcador final */
function ChronicleDrawing({ geo, score = '2 – 1', caption = 'FINAL' }) {
  const x = geo.width / 2;
  return (
    <>
      <text className="illustration__score" x={x} y={geo.score.y} fontSize={geo.score.size}>{score}</text>
      <text className="illustration__caption" x={x} y={geo.caption.y} fontSize={geo.caption.size}>{caption}</text>
    </>
  );
}

/* Previa: dos escudos enfrentados (círculo con las siglas y el color del club) */
function PreviewDrawing({ geo, home = 'real-madrid', away = 'barcelona' }) {
  const { crests, width, height } = geo;
  const cy = height / 2;
  return (
    <>
      <Crest team={getTeam(home)} cx={crests.left} cy={cy} r={crests.r} size={crests.size} />
      <text className="illustration__vs" x={width / 2} y={cy} fontSize={crests.vs}>VS</text>
      <Crest team={getTeam(away)} cx={crests.right} cy={cy} r={crests.r} size={crests.size} />
    </>
  );
}

function Crest({ team, cx, cy, r, size }) {
  // El color es un dato del club (mockData.js), no un color de la web: va en línea
  return (
    <g>
      <circle className="illustration__crest" cx={cx} cy={cy} r={r} style={{ '--crest-color': team?.color }} />
      <text className="illustration__crest-text" x={cx} y={cy} fontSize={size}>{team?.code ?? '?'}</text>
    </g>
  );
}

/* Datos: barras que crecen; la última, en oro */
const DEFAULT_BARS = [39, 58.5, 52, 78, 71.5, 97.5, 117];

function DataDrawing({ geo, values = DEFAULT_BARS }) {
  const { bars } = geo;
  const max = Math.max(...values);
  return (
    <>
      {values.map((value, index) => {
        const height = (value / max) * bars.max;
        const last = index === values.length - 1;
        return (
          <rect
            key={index}
            className={`illustration__bar${last ? ' illustration__bar--highlight' : ''}`}
            x={bars.x + index * bars.step}
            y={bars.base - height}
            width={bars.w}
            height={height}
            rx={bars.r}
          />
        );
      })}
    </>
  );
}

const DRAWINGS = {
  tactica: TacticsDrawing,
  cronica: ChronicleDrawing,
  previa: PreviewDrawing,
  datos: DataDrawing,
};

// Texto alternativo para lectores de pantalla
function label(key, { score, home, away }) {
  if (key === 'cronica') return `Ilustración: marcador ${score ?? ''}`.trim();
  if (key === 'previa') return `Ilustración: ${getTeam(home ?? 'real-madrid')?.name} contra ${getTeam(away ?? 'barcelona')?.name}`;
  if (key === 'datos') return 'Ilustración: gráfico de barras';
  return 'Ilustración: jugada dibujada sobre el campo';
}

// «Crónica» → «cronica»
function toKey(text = '') {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
