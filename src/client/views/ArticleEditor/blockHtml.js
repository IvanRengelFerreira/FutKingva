import { getPlayer, getTeam } from '../../data/mockData.js';

// HTML de los bloques insertados en el texto del editor (fichas de jugador, imágenes y gráficos)

export function escapeHtml(text = '') {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Ficha de jugador insertada (no se edita por dentro; se quita con la ×)
export function playerBlockHtml(player) {
  const team = getTeam(player.teamId)?.name ?? '';
  const rating = player.rating?.toLocaleString('es-ES', { minimumFractionDigits: 1 }) ?? '—';
  const initials = player.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  return (
    `<div class="article-editor__block" data-block="player" contenteditable="false">` +
    `<span class="article-editor__block-avatar">${escapeHtml(initials)}</span>` +
    `<span class="article-editor__block-text"><strong>${escapeHtml(player.name)} · ${escapeHtml(team)}</strong>` +
    `<small>Jugador enlazado · ${player.goals} G · ${player.assists} A · ${rating}</small></span>` +
    `<button type="button" class="article-editor__block-remove" data-remove-block aria-label="Quitar bloque"></button></div>`
  );
}

// Bloque de ejemplo (imagen o gráfico)
export function simpleBlockHtml(kind, title, detail) {
  return (
    `<div class="article-editor__block article-editor__block--${kind}" data-block="${kind}" contenteditable="false">` +
    `<span class="article-editor__block-icon article-editor__block-icon--${kind}"></span>` +
    `<span class="article-editor__block-text"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(detail)}</small></span>` +
    `<button type="button" class="article-editor__block-remove" data-remove-block aria-label="Quitar bloque"></button></div>`
  );
}

// Un bloque de datos → su HTML
function blockToHtml(block) {
  switch (block.type) {
    case 'paragraph':
      return `<p>${escapeHtml(block.text)}</p>`;
    case 'heading':
      return `<h2>${escapeHtml(block.text)}</h2>`;
    case 'quote':
      return `<blockquote>${escapeHtml(block.text)}</blockquote>`;
    case 'stats':
      return simpleBlockHtml(
        'chart',
        'Dato destacado',
        (block.items ?? []).map((item) => `${item.value} ${item.label}`).join(' · '),
      );
    case 'player': {
      const player = getPlayer(block.id);
      return player ? playerBlockHtml(player) : '';
    }
    case 'chart':
      return simpleBlockHtml('chart', 'Gráfico', block.title ?? block.text ?? '');
    case 'image':
      return simpleBlockHtml('image', 'Imagen', block.text ?? '');
    default:
      return '';
  }
}

// Bloques de datos → HTML del editor
export function blocksToHtml(blocks) {
  return blocks.map(blockToHtml).join('');
}
