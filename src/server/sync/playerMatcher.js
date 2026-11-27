// Emparejado de clubes y jugadores de FotMob y FBref con las tablas `teams` y `players` de la BD.
// Nunca usa ids internos fijos: enlaza clubes por `fm_id`, `fd_id` o `tm_id`, y jugadores por `fm_id`,
// club + nombre normalizado/alias, solapamiento de palabras y año de nacimiento cuando hay homónimos.

const PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'da', 'do', 'dos', 'van', 'von', 'der', 'y', 'el', 'al']);

// los 31 clubes de LaLiga entre 2017/18 y 2026/27 en FotMob → su fd_id o tm_id en nuestra BD
const FOTMOB_TEAM_REFS = {
  7732: { tmId: 12321n }, // Girona FC
  7854: { tmId: 1244n }, // CD Leganés
  7878: { tmId: 16795n }, // Granada CF
  8302: { fdId: 559n }, // Sevilla FC
  8305: { fdId: 82n }, // Getafe CF
  8306: { tmId: 472n }, // UD Las Palmas
  8315: { fdId: 77n }, // Athletic Club
  8370: { fdId: 87n }, // Rayo Vallecano
  8371: { fdId: 79n }, // CA Osasuna
  8372: { tmId: 1533n }, // SD Eibar
  8385: { tmId: 2687n }, // Cádiz CF
  8558: { fdId: 80n }, // RCD Espanyol
  8560: { fdId: 92n }, // Real Sociedad
  8581: { fdId: 88n }, // Levante UD
  8603: { fdId: 90n }, // Real Betis
  8633: { fdId: 86n }, // Real Madrid
  8634: { fdId: 81n }, // FC Barcelona
  8661: { tmId: 237n }, // RCD Mallorca
  8670: { tmId: 2497n }, // Real Oviedo
  8696: { fdId: 5335n }, // Real Racing Club
  9783: { fdId: 560n }, // RC Deportivo
  9864: { fdId: 84n }, // Málaga CF
  9865: { tmId: 3302n }, // UD Almería
  9866: { fdId: 263n }, // Deportivo Alavés
  9906: { fdId: 78n }, // Atlético de Madrid
  9910: { fdId: 558n }, // RC Celta
  10205: { fdId: 94n }, // Villarreal CF
  10267: { fdId: 95n }, // Valencia CF
  10268: { fdId: 285n }, // Elche CF
  10281: { tmId: 366n }, // Real Valladolid CF
  96925: { tmId: 5358n }, // SD Huesca
};

// Nombre del club en los CSV de FBref → fd_id o tm_id en nuestra BD
const FBREF_SQUAD_REFS = {
  Alaves: { fdId: 263n },
  Almeria: { tmId: 3302n },
  'Athletic Club': { fdId: 77n },
  'Atletico Madrid': { fdId: 78n },
  Barcelona: { fdId: 81n },
  Cadiz: { tmId: 2687n },
  'Celta Vigo': { fdId: 558n },
  'Dep A Coruna': { fdId: 560n },
  Eibar: { tmId: 1533n },
  Elche: { fdId: 285n },
  Espanyol: { fdId: 80n },
  Getafe: { fdId: 82n },
  Girona: { tmId: 12321n },
  Granada: { tmId: 16795n },
  Huesca: { tmId: 5358n },
  'Las Palmas': { tmId: 472n },
  Leganes: { tmId: 1244n },
  Levante: { fdId: 88n },
  Malaga: { fdId: 84n },
  Mallorca: { tmId: 237n },
  Osasuna: { fdId: 79n },
  Oviedo: { tmId: 2497n },
  'Racing Sant': { fdId: 5335n },
  'Rayo Vallecano': { fdId: 87n },
  'Real Betis': { fdId: 90n },
  'Real Madrid': { fdId: 86n },
  'Real Sociedad': { fdId: 92n },
  Sevilla: { fdId: 559n },
  Valencia: { fdId: 95n },
  Valladolid: { tmId: 366n },
  Villarreal: { fdId: 94n },
};

// Apodos antiguos que conserva football-data.org frente al nombre deportivo actual en FotMob/FBref
const PLAYER_NAME_ALIASES = {
  'yeremay hernandez': 'peke',
  'alejandro santiago': 'muneco',
  yusi: 'youssef enriquez',
};

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function significantTokens(name) {
  return normalizeText(name)
    .split(' ')
    .filter((token) => token.length > 2 && !PARTICLES.has(token));
}

function sameToken(a, b) {
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (short.length >= 4 && long.includes(short)) return true;
  return short.length >= 5 && a.slice(0, 5) === b.slice(0, 5);
}

export function buildTeamMaps(dbTeams) {
  const byFd = new Map(dbTeams.filter((t) => t.fd_id != null).map((t) => [t.fd_id, t]));
  const byTm = new Map(dbTeams.filter((t) => t.tm_id != null).map((t) => [t.tm_id, t]));
  const byFm = new Map(dbTeams.filter((t) => t.fm_id != null).map((t) => [Number(t.fm_id), t.id]));
  const fmIdByTeamId = new Map();

  for (const [fmIdRaw, ref] of Object.entries(FOTMOB_TEAM_REFS)) {
    const fmId = Number(fmIdRaw);
    if (byFm.has(fmId)) continue;
    const matched = (ref.fdId && byFd.get(ref.fdId)) || (ref.tmId && byTm.get(ref.tmId));
    if (matched) {
      byFm.set(fmId, matched.id);
      fmIdByTeamId.set(matched.id, BigInt(fmId));
    }
  }

  const byFbrefSquad = new Map();
  for (const [squad, ref] of Object.entries(FBREF_SQUAD_REFS)) {
    const matched = (ref.fdId && byFd.get(ref.fdId)) || (ref.tmId && byTm.get(ref.tmId));
    if (matched) byFbrefSquad.set(normalizeText(squad), matched.id);
  }

  return { teamIdByFmId: byFm, teamIdByFbrefSquad: byFbrefSquad, fmIdByTeamId };
}

function birthYearOf(dateOfBirth) {
  return dateOfBirth ? new Date(dateOfBirth).getUTCFullYear() : null;
}

function indexPlayer(player, clubHistoryByPlayer) {
  const fullName = [player.first_name, player.last_name].filter(Boolean).join(' ');
  const variants = new Set([player.name, fullName, player.last_name].filter(Boolean).map(normalizeText));
  const clubIds = new Set(clubHistoryByPlayer.get(player.id) ?? []);
  if (player.team_id != null) clubIds.add(player.team_id);

  return {
    id: player.id,
    fmId: player.fm_id != null ? Number(player.fm_id) : null,
    bornYear: birthYearOf(player.date_of_birth),
    displayNorm: normalizeText(player.name),
    variants,
    tokens: [...new Set(significantTokens(`${player.name} ${fullName}`))],
    clubIds,
  };
}

// Pondera más coincidir con el nombre deportivo corto («Puga») o el último apellido que solo con el nombre de pila
function candidateScore(queryNorm, queryTokens, candidate) {
  if (candidate.variants.has(queryNorm)) return 100;
  let score = 0;
  for (const qt of queryTokens) {
    if (candidate.tokens.some((ct) => sameToken(qt, ct))) score += 10;
  }
  const lastToken = queryTokens.at(-1);
  if (lastToken && (candidate.displayNorm === lastToken || candidate.variants.has(lastToken))) {
    score += 5;
  }
  return score;
}

function pickUniqueBest(candidates, queryNorm, queryTokens, bornYear = null) {
  let pool = candidates;
  if (bornYear != null) {
    const byYear = candidates.filter((c) => c.bornYear === bornYear);
    if (byYear.length > 0) pool = byYear;
  }

  const scored = pool
    .map((c) => ({ candidate: c, score: candidateScore(queryNorm, queryTokens, c) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;
  if (scored.length === 1 || scored[0].score > scored[1].score) return scored[0].candidate.id;
  return null;
}

export function createPlayerMatcher(dbPlayers, clubHistoryByPlayer = new Map()) {
  const indexed = dbPlayers.map((p) => indexPlayer(p, clubHistoryByPlayer));
  const byFmId = new Map(indexed.filter((p) => p.fmId != null).map((p) => [p.fmId, p.id]));
  const byClub = new Map();

  for (const item of indexed) {
    for (const clubId of item.clubIds) {
      const list = byClub.get(clubId) ?? [];
      list.push(item);
      byClub.set(clubId, list);
    }
  }

  function match({ fmPlayerId = null, name, teamId, bornYear = null }) {
    if (fmPlayerId != null && byFmId.has(fmPlayerId)) return byFmId.get(fmPlayerId);

    const rawNorm = normalizeText(name);
    const queryNorm = PLAYER_NAME_ALIASES[rawNorm] ?? rawNorm;
    const queryTokens = significantTokens(queryNorm);

    const clubPool = byClub.get(teamId) ?? [];
    const inClub = pickUniqueBest(clubPool, queryNorm, queryTokens, bornYear);
    if (inClub != null) return inClub;

    // Respaldo global solo si el nombre completo normalizado es único en toda la BD
    const globalExact = indexed.filter((p) => p.variants.has(queryNorm));
    if (globalExact.length === 1) return globalExact[0].id;
    if (bornYear != null) {
      const globalByYear = globalExact.filter((p) => p.bornYear === bornYear);
      if (globalByYear.length === 1) return globalByYear[0].id;
    }
    return null;
  }

  return { match };
}
