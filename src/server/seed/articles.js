// Crea (o deja como nuevos) los 10 artículos de ejemplo de Análisis: `node seed/articles.js` en src/server.
// Son los de mockData.js (ARTICLES) con los textos de Figma (08 · Análisis, 09 · Artículo y 18 · Editor de artículo).
// Responsable: Carlota. Lo usan 08 · Análisis, 09 · Artículo, 17 · Panel de editor y 18 · Editor de artículo.
//
// Antes hay que crear las cuentas de demostración (`npm run seed:demo`): el autor de todos es el editor de prueba.
// Se puede repetir sin duplicar: cada artículo se busca por su título y, si ya existe, se le vuelven a poner
// los datos de aquí (se pierden los cambios hechos desde el Editor de artículo). Las visitas solo se crean
// la primera vez, para no pisar las de verdad.
//
// Formato del cuerpo (articles.body): lista de bloques, sin HTML
//   { type: 'paragraph', spans: [{ text, bold?, italic?, href? }] }
//   { type: 'heading', text } · { type: 'quote', text }
//   { type: 'list', items: [{ spans: [...] }] }
//   { type: 'stats', items: [{ value, label }] }                     → recuadro «Dato destacado»
//   { type: 'mentions', items: [{ type: 'player' | 'team', id }] }   → jugadores y equipos mencionados
//   { type: 'chart', title, playerId, source }                       → acierto en el pase por jornada
//   { type: 'player', playerId }                                     → ficha de jugador insertada
//   { type: 'image', caption } · { type: 'figure', caption }          → huecos de imagen o gráfico del editor
// Portada (articles.cover): el dibujo de su categoría; null = el dibujo sin datos
//   { type: 'stat', value }                                  → Táctica: cifra en el hexágono
//   { type: 'match', score, caption?, homeTeamId?, awayTeamId? } → Crónica: marcador
//   { type: 'teams', homeTeamId, awayTeamId }                → Previa: escudos enfrentados
//   { type: 'bars', values: [números] }                      → Datos: barras
// Los ids de equipos y jugadores se buscan por nombre en la BD; si alguno no está, se deja fuera.

import { Prisma } from '../generated/prisma/client.ts';
import { prisma, findUserByEmail } from '../db.js';
import { DEMO_ACCOUNTS } from '../../shared/demoAccounts.js';

const EDITOR_EMAIL = DEMO_ACCOUNTS.find((account) => account.role === 'editor').email;
const EDITOR_TITLE = 'Editora'; // Lo que sale bajo el autor en 09 · Artículo (como en Figma)
const SCHEDULED_IN_DAYS = 7; // El Clásico sale programado para dentro de una semana, a las 18:00

const FEATURED_TAG = 'Destacado';

// Referencias por nombre (se cambian por el id de la BD al ejecutar)
const player = (name) => ({ ref: 'player', name });
const team = (name) => ({ ref: 'team', name });

const paragraph = (text) => ({ type: 'paragraph', spans: [{ text }] });

const ARTICLES = [
  {
    title: 'Pedri y el arte de no perder el balón',
    category: 'Táctica',
    status: 'published',
    date: '2026-10-15T10:00',
    visits: 4812,
    tags: [FEATURED_TAG],
    summary:
      'Cinco partidos seguidos por encima del 90 % de acierto en el pase. Analizamos qué ha cambiado en su posición desde el inicio de la temporada y por qué el Barça depende de él para salir jugando.',
    cover: { type: 'stat', value: '91 %' },
    body: [
      paragraph(
        'Hay jugadores que se miden en goles y otros que se miden en lo que no pasa. Con Pedri sobre el césped, el Barça pierde menos balones que nadie en LaLiga: 6,1 pérdidas por partido, la cifra más baja de los centrocampistas con más de 600 minutos.',
      ),
      paragraph(
        'La clave está en su nueva posición. Hansi Flick le ha retrasado unos metros, casi a la altura de los centrales en la salida, y desde ahí recibe de cara. Ya no tiene que girarse con un rival encima: ve todo el campo antes de recibir.',
      ),
      {
        type: 'stats',
        items: [
          { value: '91 %', label: 'Acierto en el pase' },
          { value: '6,1', label: 'Pérdidas por partido' },
          { value: '2,8', label: 'Pases clave por 90' },
        ],
      },
      paragraph(
        'El efecto se nota en los números. En las cinco últimas jornadas ha superado siempre el 90 % de acierto en el pase y ha dado tres de sus cuatro asistencias. Solo Lamine Yamal ha generado más ocasiones en el equipo.',
      ),
      { type: 'mentions', items: [player('Pedri'), player('Lamine Yamal'), team('FC Barcelona')] },
      {
        type: 'chart',
        title: 'Acierto en el pase de Pedri por jornada (%)',
        playerId: player('Pedri'),
        source: 'Fuente: FutKingva con datos de football-data.org',
      },
      { type: 'quote', text: 'Ya no tiene que girarse con un rival encima: ve todo el campo antes de recibir.' },
      paragraph(
        'La pregunta ahora es cuánto puede sostenerlo. Con Champions entre semana y un calendario sin descanso hasta diciembre, la gestión de sus minutos será tan importante como su talento.',
      ),
    ],
  },
  {
    title: 'Barça: ocho de ocho y 34 goles a favor',
    category: 'Crónica',
    status: 'published',
    date: '2026-10-11T10:00',
    visits: 3205,
    summary: 'El 3 – 0 al Getafe completa un pleno de victorias en LaLiga.',
    cover: {
      type: 'match',
      score: '3 – 0',
      caption: "FINAL · 90+2'",
      homeTeamId: team('FC Barcelona'),
      awayTeamId: team('Getafe CF'),
    },
  },
  {
    title: 'Previa: Barcelona – Real Madrid, el Clásico del liderato',
    category: 'Previa',
    status: 'scheduled',
    tags: ['LaLiga', 'Camp Nou', 'Real Madrid'],
    summary: 'Lo que dicen los datos antes del Clásico del Camp Nou.',
    cover: { type: 'teams', homeTeamId: team('FC Barcelona'), awayTeamId: team('Real Madrid') },
    body: [
      paragraph(
        'El Camp Nou recibe al Madrid de Mourinho con el Barça de Flick líder y con pleno de victorias. El Madrid llega cuarto y con Mbappé como amenaza principal: 7 goles en 8 jornadas.',
      ),
      { type: 'heading', text: 'Las claves del partido' },
      paragraph(
        'El Barça presiona alto y obliga a salir en largo. Si Valverde y Bellingham encuentran tiempo entre líneas, el Madrid tendrá espacios a la espalda de los laterales.',
      ),
      { type: 'player', playerId: player('Kylian Mbappé') },
      paragraph('Para Hansi Flick, la duda es si arriesgar'),
      { type: 'mentions', items: [player('Kylian Mbappé'), player('Jude Bellingham'), team('FC Barcelona')] },
    ],
  },
  {
    title: 'El Madrid de Mourinho: orden atrás y Mbappé arriba',
    category: 'Táctica',
    status: 'published',
    date: '2026-10-14T10:00',
    visits: 2954,
    summary: 'Qué ha cambiado en el Madrid en sus primeras ocho jornadas con Mourinho.',
  },
  {
    title: 'Celta y Athletic, las defensas menos goleadas',
    category: 'Datos',
    status: 'published',
    date: '2026-10-13T10:00',
    visits: 3610,
    summary: 'Seis goles encajados cada uno: nadie concede menos en LaLiga.',
  },
  {
    title: 'Los porteros que más paran de LaLiga',
    category: 'Datos',
    status: 'draft',
  },
  {
    title: 'El Atlético encadena cinco victorias y ya es segundo',
    category: 'Datos',
    status: 'published',
    date: '2026-10-17T10:00',
    visits: 1877,
    summary: 'Desde el 0 – 3 en el Reale Arena, pleno: 15 de 15 puntos.',
  },
  {
    title: 'Cómo leer el xG sin volverse loco',
    category: 'Datos',
    status: 'draft',
  },
  {
    title: 'Previa: Real Madrid – Sevilla, el Bernabéu aprieta',
    category: 'Previa',
    status: 'published',
    date: '2026-10-17T10:00',
    visits: 1240,
    summary: 'Lo que dicen los datos antes del partido del domingo.',
    cover: { type: 'teams', homeTeamId: team('Real Madrid'), awayTeamId: team('Sevilla FC') },
  },
  {
    title: 'Gil Manzano y la tarjeta fácil',
    category: 'Datos',
    status: 'published',
    date: '2026-10-14T10:00',
    visits: 2105,
    summary: '5,8 tarjetas por partido, la media más alta del campeonato.',
  },
];

try {
  const editor = await findUserByEmail(EDITOR_EMAIL);
  if (!editor) throw new Error(`No existe ${EDITOR_EMAIL}: ejecuta antes \`npm run seed:demo\`.`);
  if (!editor.title) await prisma.users.update({ where: { id: editor.id }, data: { title: EDITOR_TITLE } });

  const ids = await loadIds();
  const missing = new Set();

  for (const article of ARTICLES) {
    const data = {
      author_id: editor.id,
      title: article.title,
      summary: article.summary ?? null,
      category: article.category,
      body: resolveRefs(article.body ?? [], ids, missing),
      cover: article.cover ? resolveRefs(article.cover, ids, missing) : Prisma.DbNull, // NULL de SQL, no el null de JSON
      tags: article.tags ?? [],
      ...publication(article),
    };
    const existing = await prisma.articles.findFirst({ where: { title: article.title }, select: { id: true } });
    const saved = existing
      ? await prisma.articles.update({ where: { id: existing.id }, data })
      : await prisma.articles.create({ data });
    const visits = article.visits ? await seedVisits(saved, article.visits) : 0;

    console.log(
      `${existing ? 'Actualizado' : 'Creado     '}: ${saved.id} · ${article.title}${visits ? ` (${visits} visitas)` : ''}`,
    );
  }
  if (missing.size) console.warn(`No están en la BD (se han dejado fuera): ${[...missing].join(', ')}`);
} finally {
  await prisma.$disconnect();
}

// Estado y fecha: publicado (fecha del mockup), programado (publicado con fecha futura) o borrador (sin fecha)
function publication(article) {
  if (article.status === 'draft') return { status: 'DRAFT', published_at: null };
  if (article.status === 'scheduled') {
    const date = new Date();
    date.setDate(date.getDate() + SCHEDULED_IN_DAYS);
    date.setHours(18, 0, 0, 0);
    return { status: 'PUBLISHED', published_at: date };
  }
  return { status: 'PUBLISHED', published_at: new Date(article.date) };
}

// Ids de la BD de los equipos y jugadores que salen en los artículos, por su nombre
async function loadIds() {
  const names = { player: new Set(), team: new Set() };
  JSON.stringify(ARTICLES, (key, value) => {
    if (value?.ref) names[value.ref].add(value.name);
    return value;
  });
  const [players, teams] = await Promise.all([
    prisma.players.findMany({ where: { name: { in: [...names.player] } }, select: { id: true, name: true } }),
    prisma.teams.findMany({ where: { name: { in: [...names.team] } }, select: { id: true, name: true } }),
  ]);
  return {
    player: new Map(players.map((row) => [row.name, Number(row.id)])),
    team: new Map(teams.map((row) => [row.name, Number(row.id)])),
  };
}

// Cambia cada referencia { ref, name } por su id. En «mencionados» queda { type, id }; si no está en la BD,
// el elemento (o la ficha de jugador) se quita y el campo de la portada se deja sin poner.
function resolveRefs(value, ids, missing) {
  const idOf = (ref) => {
    const id = ids[ref.ref].get(ref.name);
    if (id == null) missing.add(ref.name);
    return id;
  };
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item?.ref) {
          const id = idOf(item);
          return id == null ? null : { type: item.ref, id };
        }
        if (item?.type === 'player' && item.playerId?.ref) {
          const id = idOf(item.playerId);
          return id == null ? null : { ...item, playerId: id };
        }
        return resolveRefs(item, ids, missing);
      })
      .filter((item) => item != null);
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, item?.ref ? idOf(item) : resolveRefs(item, ids, missing)])
      .filter(([, item]) => item !== undefined);
    return Object.fromEntries(entries);
  }
  return value;
}

// Reparte las visitas del mockup entre los días desde que se publicó hasta hoy (solo si aún no tiene ninguna)
async function seedVisits(article, total) {
  const already = await prisma.article_daily_views.count({ where: { article_id: article.id } });
  if (already > 0) return 0;

  const days = [];
  const today = startOfDay(new Date());
  for (let day = startOfDay(article.published_at); day <= today; day.setDate(day.getDate() + 1)) {
    days.push(new Date(day));
  }
  if (days.length === 0) return 0;

  const perDay = Math.floor(total / days.length);
  const rest = total - perDay * days.length; // Lo que sobra va al día en que se publicó
  await prisma.article_daily_views.createMany({
    data: days.map((day, index) => ({
      article_id: article.id,
      day: utcDate(day),
      views: perDay + (index === 0 ? rest : 0),
    })),
  });
  return total;
}

function startOfDay(date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

// Columna `date` de Postgres: el día local como fecha UTC a medianoche (Prisma no lo desplaza)
function utcDate(day) {
  return new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()));
}
