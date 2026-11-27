// Crea (o deja como nuevos) los 10 artículos de ejemplo de Análisis: `node seed/articles.js` en src/server.
// Son los de mockData.js (ARTICLES) con los textos de Figma (08 · Análisis, 09 · Artículo y 18 · Editor de artículo).
// En Figma solo tienen cuerpo el de Pedri y el Clásico; el de los demás publicados está escrito aparte con los
// datos de mockData.js (para publicar hace falta texto). Los dos borradores se quedan vacíos.
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
    body: [
      paragraph(
        'El Barça de Hansi Flick ha cerrado la octava jornada como la empezó: ganando. El 3 – 0 al Getafe es la octava victoria en ocho partidos, un pleno que deja al equipo líder con 24 puntos.',
      ),
      {
        type: 'stats',
        items: [
          { value: '8 / 8', label: 'Victorias' },
          { value: '34', label: 'Goles a favor' },
          { value: '7', label: 'Goles en contra' },
        ],
      },
      paragraph(
        'Los números explican la diferencia: 34 goles a favor, más de cuatro por partido, y solo 7 en contra. El Getafe, que había encajado 7 goles en siete jornadas, apenas pudo salir de su campo en la primera parte.',
      ),
      paragraph(
        'Pedri volvió a ser el que ordena: marcó, dio una asistencia y terminó por encima del 90 % de acierto en el pase. Con el Betis en el horizonte y el Clásico después, el reto ya no es ganar, sino llegar con piernas.',
      ),
      { type: 'mentions', items: [team('FC Barcelona'), player('Pedri'), team('Getafe CF')] },
    ],
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
    body: [
      paragraph(
        'José Mourinho ha tardado poco en dejar su firma en el Real Madrid. Tras ocho jornadas, el equipo es cuarto con 18 puntos, seis victorias y dos derrotas, y lo que más ha cambiado no está arriba, sino atrás: solo 8 goles encajados, los mismos que el Atlético.',
      ),
      { type: 'heading', text: 'Un bloque más bajo' },
      paragraph(
        'El Madrid defiende ahora con las líneas más juntas y espera más cerca de su área. Pierde metros de presión, pero gana espacio a la espalda del rival para correr, que es justo lo que necesita su delantero.',
      ),
      {
        type: 'stats',
        items: [
          { value: '18', label: 'Puntos (4.º)' },
          { value: '19', label: 'Goles a favor' },
          { value: '7', label: 'Goles de Mbappé' },
        ],
      },
      paragraph(
        'Kylian Mbappé ha marcado 7 de los 19 goles del equipo. Las dos derrotas, ante el Betis y en el derbi del Metropolitano, llegaron en partidos en los que el Madrid tuvo que llevar la iniciativa. Ahí está su tarea pendiente.',
      ),
      { type: 'mentions', items: [team('Real Madrid'), player('Kylian Mbappé'), player('Jude Bellingham')] },
    ],
  },
  {
    title: 'Celta y Athletic, las defensas menos goleadas',
    category: 'Datos',
    status: 'published',
    date: '2026-10-13T10:00',
    visits: 3610,
    summary: 'Seis goles encajados cada uno: nadie concede menos en LaLiga.',
    body: [
      paragraph(
        'Si se ordena LaLiga por goles encajados, arriba no aparecen ni el líder ni sus perseguidores. Aparecen el Celta y el Athletic, con 6 goles en contra cada uno, la cifra más baja del campeonato.',
      ),
      {
        type: 'stats',
        items: [
          { value: '6', label: 'Encajados del Celta' },
          { value: '6', label: 'Encajados del Athletic' },
          { value: '1,0', label: 'Por partido del Athletic' },
        ],
      },
      paragraph(
        'El Celta lo ha hecho a su manera: cinco empates en ocho jornadas, muchos partidos cerrados y pocas concesiones. Le falta gol, con solo 8 a favor, pero es el equipo al que más cuesta hacerle daño.',
      ),
      paragraph(
        'El Athletic ha jugado dos partidos menos y tiene la misma cifra, así que su media es todavía más baja: un gol encajado por partido. Cuando se iguale el calendario, su defensa puede ser la mejor de la primera vuelta.',
      ),
      { type: 'mentions', items: [team('RC Celta de Vigo'), team('Athletic Club')] },
    ],
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
    date: '2026-10-17T21:00', // Después del Espanyol – Atlético de ese día
    visits: 1877,
    summary: 'Desde el 0 – 3 en el Reale Arena, pleno: 15 de 15 puntos.',
    body: [
      {
        type: 'paragraph',
        spans: [
          { text: 'El Atlético de Simeone ha encontrado su ritmo. Con el 0 – 1 en el campo del Espanyol suma ' },
          { text: 'cinco victorias seguidas', bold: true },
          { text: ' y ya es segundo en la ' },
          { text: 'clasificación', href: '#/clasificaciones' },
          { text: ', con 22 puntos, a dos del Barça, que tiene un partido menos.' },
        ],
      },
      {
        type: 'stats',
        items: [
          { value: '15 / 15', label: 'Puntos en las cinco últimas' },
          { value: '19', label: 'Goles a favor' },
          { value: '8', label: 'Goles en contra' },
        ],
      },
      paragraph(
        'La racha empezó con el 0 – 3 en el Reale Arena y pasó por el derbi ante el Real Madrid (2 – 1). En ese tramo el equipo ha ganado de todas las formas: goleando, remontando y aguantando un 0 – 1 lejos de casa.',
      ),
      paragraph(
        'Solo el Barça ha marcado más, y solo el Celta y el Athletic han encajado menos. Si mantiene este ritmo, la pelea por el título será cosa de dos.',
      ),
      { type: 'mentions', items: [team('Atlético de Madrid')] },
    ],
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
    body: [
      paragraph(
        'El Bernabéu recibe el domingo a las 21:00 a un Sevilla que llega quinto, con 14 puntos, y con la sensación de que le cuesta cerrar los partidos: viene de empatar 3 – 3 en el campo del Levante.',
      ),
      { type: 'heading', text: 'Las claves del partido' },
      paragraph(
        'El Madrid ha encajado 8 goles en ocho jornadas y el Sevilla, 12. Si el partido se rompe, Mbappé tendrá espacios; si el Sevilla consigue juntar líneas, el Madrid tendrá que encontrar otra vía, como en sus dos derrotas.',
      ),
      {
        type: 'stats',
        items: [
          { value: '18', label: 'Puntos del Madrid (4.º)' },
          { value: '14', label: 'Puntos del Sevilla (5.º)' },
          { value: '7', label: 'Goles de Mbappé' },
        ],
      },
      paragraph(
        'Con el Leipzig en la Champions el miércoles y el Clásico el domingo siguiente, la semana más exigente del Madrid empieza aquí.',
      ),
      { type: 'mentions', items: [team('Real Madrid'), team('Sevilla FC'), player('Kylian Mbappé')] },
    ],
  },
  {
    title: 'Gil Manzano y la tarjeta fácil',
    category: 'Datos',
    status: 'published',
    date: '2026-10-14T10:00',
    visits: 2105,
    summary: '5,8 tarjetas por partido, la media más alta del campeonato.',
    body: [
      paragraph(
        'Jesús Gil Manzano es el árbitro que más tarjetas enseña en lo que va de LaLiga: 5,8 por partido. En sus cinco encuentros ha sacado 27 amarillas y 2 rojas, y ha señalado 3 penaltis.',
      ),
      {
        type: 'stats',
        items: [
          { value: '5,8', label: 'Tarjetas por partido' },
          { value: '27', label: 'Amarillas' },
          { value: '2', label: 'Rojas' },
        ],
      },
      paragraph(
        'No es solo cosa de partidos calientes. En el Betis – Osasuna (5 – 2) mostró cinco amarillas y una roja, y en el derbi entre el Atlético y el Real Madrid (2 – 1), otras cinco amarillas.',
      ),
      { type: 'quote', text: 'Su criterio es el mismo en un partido grande que en uno de media tabla.' },
      paragraph(
        'Para los equipos que le tienen el fin de semana, el dato importa: con él en el campo, los jugadores apercibidos corren más riesgo de perderse el siguiente partido.',
      ),
    ],
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
