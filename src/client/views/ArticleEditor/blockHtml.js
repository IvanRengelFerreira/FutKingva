import { isSafeHref } from '../../../shared/validation/article.js';

// Paso del texto del artículo entre los bloques de la API (articles.body, ver shared/validation/article.js)
// y el HTML del editor (contentEditable):
//   blocksToHtml(blocks, players) → HTML para empezar a editar
//   htmlToBlocks(editor)          → bloques para guardar (sin HTML: solo texto, negrita, cursiva y enlaces seguros)
// Los bloques que no son texto (ficha de jugador, imagen, gráfico, dato destacado y «mencionados») se ven como
// una caja que no se edita por dentro y guardan su bloque tal cual en data-json; al guardar se recupera de ahí.

export function escapeHtml(text = '') {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase();
}

function blockBox({ kind, block, icon, title, detail }) {
  return (
    `<div class="article-editor__block article-editor__block--${kind}" data-block="${kind}" ` +
    `data-json="${escapeHtml(JSON.stringify(block))}" contenteditable="false">` +
    icon +
    `<span class="article-editor__block-text"><strong>${escapeHtml(title)}</strong>` +
    `<small>${escapeHtml(detail)}</small></span>` +
    `<button type="button" class="article-editor__block-remove" data-remove-block aria-label="Quitar bloque"></button></div>`
  );
}

/** Ficha de jugador insertada (jugador de la API: { id, name, team, position, rating }) */
export function playerBlockHtml(player) {
  const rating = player.rating?.toLocaleString('es-ES', { minimumFractionDigits: 1 }) ?? '—';
  const detail = ['Jugador enlazado', player.position, rating].filter(Boolean).join(' · ');
  return blockBox({
    kind: 'player',
    block: { type: 'player', playerId: player.id },
    icon: `<span class="article-editor__block-avatar">${escapeHtml(initials(player.name))}</span>`,
    title: [player.name, player.team?.name].filter(Boolean).join(' · '),
    detail,
  });
}

/** Caja de un bloque que no es texto: kind = 'image' | 'chart' | 'user' (el icono) */
export function simpleBlockHtml(kind, title, detail, block) {
  return blockBox({
    kind,
    block,
    icon: `<span class="article-editor__block-icon article-editor__block-icon--${kind}"></span>`,
    title,
    detail,
  });
}

/** Hueco de imagen o de gráfico que inserta la barra de herramientas */
export const imageBlockHtml = () =>
  simpleBlockHtml('image', 'Imagen', 'Ilustración del artículo', {
    type: 'image',
    caption: 'Ilustración del artículo',
  });
export const figureBlockHtml = () =>
  simpleBlockHtml('chart', 'Gráfico', 'Barras por jornada', { type: 'figure', caption: 'Barras por jornada' });

// --- Bloques → HTML ----------------------------------------------------------

function spansToHtml(spans = []) {
  return spans
    .map((span) => {
      let html = escapeHtml(span.text);
      if (span.bold) html = `<b>${html}</b>`;
      if (span.italic) html = `<i>${html}</i>`;
      if (span.href && isSafeHref(span.href)) html = `<a href="${escapeHtml(span.href)}">${html}</a>`;
      return html;
    })
    .join('');
}

function blockToHtml(block, players) {
  switch (block.type) {
    case 'paragraph':
      return `<p>${spansToHtml(block.spans)}</p>`;
    case 'heading':
      return `<h2>${escapeHtml(block.text)}</h2>`;
    case 'quote':
      return `<blockquote>${escapeHtml(block.text)}</blockquote>`;
    case 'list':
      return `<ul>${block.items.map((item) => `<li>${spansToHtml(item.spans)}</li>`).join('')}</ul>`;
    case 'stats':
      return simpleBlockHtml(
        'chart',
        'Dato destacado',
        block.items.map((item) => `${item.value} ${item.label}`).join(' · '),
        block,
      );
    case 'chart':
      return simpleBlockHtml('chart', 'Gráfico', block.title, block);
    case 'image':
      return simpleBlockHtml('image', 'Imagen', block.caption ?? '', block);
    case 'figure':
      return simpleBlockHtml('chart', 'Gráfico', block.caption ?? '', block);
    case 'player': {
      const player = players.get(block.playerId);
      return player ? playerBlockHtml(player) : '';
    }
    case 'mentions':
      // Marca dónde va la lista: se rellena al guardar con «Jugadores / equipos relacionados»
      return simpleBlockHtml('user', 'Jugadores y equipos mencionados', 'Los de «Jugadores / equipos relacionados»', {
        type: 'mentions',
      });
    default:
      return '';
  }
}

/** Bloques de la API → HTML del editor. players: Map(id → jugador) para las fichas */
export function blocksToHtml(blocks, players = new Map()) {
  return blocks.map((block) => blockToHtml(block, players)).join('');
}

// --- HTML → bloques ----------------------------------------------------------

const INLINE = new Set([
  '#text',
  'B',
  'STRONG',
  'I',
  'EM',
  'A',
  'SPAN',
  'BR',
  'U',
  'FONT',
  'CODE',
  'SMALL',
  'SUB',
  'SUP',
]);

// Trozos de texto con sus marcas (negrita, cursiva, enlace), juntando los vecinos iguales
function inlineSpans(nodes, marks = {}) {
  const spans = [];
  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      spans.push({ text: node.textContent, ...marks });
    } else if (node.nodeName === 'BR') {
      spans.push({ text: ' ', ...marks });
    } else if (node.nodeType === Node.ELEMENT_NODE && !node.dataset.block) {
      const next = { ...marks };
      if (node.nodeName === 'B' || node.nodeName === 'STRONG') next.bold = true;
      if (node.nodeName === 'I' || node.nodeName === 'EM') next.italic = true;
      if (node.nodeName === 'A' && isSafeHref(node.getAttribute('href'))) next.href = node.getAttribute('href');
      spans.push(...inlineSpans(node.childNodes, next));
    }
  }
  return spans;
}

function cleanSpans(spans) {
  const merged = [];
  for (const span of spans) {
    const text = span.text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ');
    const last = merged.at(-1);
    const same = last && last.bold === span.bold && last.italic === span.italic && last.href === span.href;
    if (same) last.text += text;
    else merged.push({ ...span, text });
  }
  if (merged.length) {
    merged[0].text = merged[0].text.trimStart();
    merged.at(-1).text = merged.at(-1).text.trimEnd();
  }
  // Solo las marcas que están puestas (sin bold: undefined…)
  return merged
    .filter((span) => span.text)
    .map(({ text, bold, italic, href }) => ({
      text,
      ...(bold ? { bold } : {}),
      ...(italic ? { italic } : {}),
      ...(href ? { href } : {}),
    }));
}

const hasText = (spans) => spans.some((span) => span.text.trim());
const plainText = (node) =>
  node.textContent
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** HTML del editor (el elemento contentEditable) → bloques para la API */
export function htmlToBlocks(root) {
  const blocks = [];
  let loose = []; // Texto suelto entre bloques: va en un párrafo

  function flush() {
    const spans = cleanSpans(inlineSpans(loose));
    if (hasText(spans)) blocks.push({ type: 'paragraph', spans });
    loose = [];
  }

  for (const node of root.childNodes) {
    if (INLINE.has(node.nodeName) && !node.dataset?.block) {
      loose.push(node);
      continue;
    }
    flush();
    if (node.nodeType !== Node.ELEMENT_NODE) continue;

    if (node.dataset.json) {
      try {
        blocks.push(JSON.parse(node.dataset.json));
      } catch {
        // Un bloque roto no se guarda
      }
      continue;
    }

    switch (node.nodeName) {
      case 'H1':
      case 'H2':
      case 'H3':
        if (plainText(node)) blocks.push({ type: 'heading', text: plainText(node) });
        break;
      case 'BLOCKQUOTE':
        if (plainText(node)) blocks.push({ type: 'quote', text: plainText(node) });
        break;
      case 'UL':
      case 'OL': {
        const items = [...node.children]
          .map((item) => ({ spans: cleanSpans(inlineSpans(item.childNodes)) }))
          .filter((item) => hasText(item.spans));
        if (items.length) blocks.push({ type: 'list', items });
        break;
      }
      default:
        // P, DIV…: si dentro hay más bloques (texto pegado), se recorre por dentro
        if ([...node.children].some((child) => !INLINE.has(child.nodeName) || child.dataset.block)) {
          blocks.push(...htmlToBlocks(node));
        } else {
          const spans = cleanSpans(inlineSpans(node.childNodes));
          if (hasText(spans)) blocks.push({ type: 'paragraph', spans });
        }
    }
  }
  flush();
  return blocks;
}
