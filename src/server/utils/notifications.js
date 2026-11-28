// Formato de los avisos (tabla notifications) en las respuestas de la API y de Socket.IO.
//
// La tabla solo tiene una columna de texto: se guarda «título\ndetalle» (p. ej.
// «¡Gol de Baena! · 89'\nEspanyol 0 – 1 Atlético») y aquí se separa en las dos líneas que pinta la web.

/** Une título y detalle en el texto que se guarda en la BD */
export function notificationText(title, detail) {
  return detail ? `${title}\n${detail}` : title;
}

/** Aviso tal como se envía al front: { id, type, title, detail, link, matchId, unread, createdAt } */
export function notificationRow(row) {
  const [title, ...rest] = row.text.split('\n');
  return {
    id: row.id,
    type: row.type.toLowerCase(), // 'goal', 'card', 'match_start', 'match_end', 'standings'…
    title,
    detail: rest.join(' '),
    link: row.link,
    matchId: row.match_id,
    unread: !row.is_read,
    createdAt: row.created_at,
  };
}
