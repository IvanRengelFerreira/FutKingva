import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import RoleNotice from '../../components/RoleNotice/RoleNotice.jsx';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Button from '../../components/Button/Button.jsx';
import Illustration from '../../components/Illustration/Illustration.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Crest from '../../components/Crest/Crest.jsx';
import FieldError from '../../components/FieldError/FieldError.jsx';
import NotFound from '../NotFound/NotFound.jsx';
import { PLAYERS, TEAMS, getArticle, getPlayer, getTeam } from '../../data/mockData.js';
import { getArticleExtras } from '../Analysis/articleExtras.js';
import { getArticleContent } from '../Article/articleContent.js';
import { getArticleDraft } from './editorDrafts.js';
import listIcon from '../../assets/icon-list.svg';
import quoteIcon from '../../assets/icon-quote.svg';
import linkIcon from '../../assets/icon-link.svg';
import imageIcon from '../../assets/icon-image.svg';
import chartIcon from '../../assets/icon-chart-small.svg';
import userIcon from '../../assets/icon-user-small.svg';
import calendarIcon from '../../assets/icon-calendar.svg';
import searchIcon from '../../assets/icon-search-small.svg';
import uploadIcon from '../../assets/icon-upload.svg';
import './ArticleEditor.css';

// 18 · Editor de artículo (RF7): escribir o editar un análisis. Solo para el rol editor.
//   /editor/articulo             → artículo nuevo (vacío)
//   /editor/articulo/<id>        → artículo de ARTICLES con sus datos (el Clásico, como en Figma)
// El editor de texto usa contentEditable y las órdenes del navegador (negrita, cursiva, título, lista,
// cita, enlace), sin bibliotecas. «Jugador» inserta la ficha del jugador elegido; «Imagen» y «Gráfico»,
// un bloque de ejemplo. Sin servidor: «Guardar borrador» y «Publicar» solo enseñan el aviso.
// Para publicar hace falta título, entradilla y texto; si está programado, la fecha en formato dd/mm/aaaa · hh:mm.
// Diseño: Figma › Mockups › 18 · Editor de artículo
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=61-1565

const CATEGORIES = ['Táctica', 'Crónica', 'Previa', 'Datos'];

const STATUSES = [
  { value: 'draft', label: 'Borrador' },
  { value: 'scheduled', label: 'Programado' },
  { value: 'published', label: 'Publicado' },
];

const WORDS_PER_MINUTE = 200;

// Fecha de publicación: «24/10/2026 · 18:00» (la hora es opcional)
const DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}( · \d{2}:\d{2})?$/;

export default function ArticleEditor() {
  const { articleId } = useParams();
  const article = articleId ? getArticle(articleId) : null;
  if (articleId && !article) return <NotFound />;

  // «key»: al pasar de un artículo a otro, el formulario empieza de cero
  return <EditorForm key={articleId ?? 'nuevo'} initial={getInitialValues(article)} isNew={!article} />;
}

function EditorForm({ initial, isNew }) {
  const editorRef = useRef(null);
  const rangeRef = useRef(null); // Última posición del cursor dentro del texto
  const fileRef = useRef(null);

  const [form, setForm] = useState(initial);
  const [words, setWords] = useState(0);
  const [saveState, setSaveState] = useState(isNew ? 'new' : 'saved-before');
  const [formats, setFormats] = useState({ bold: false, italic: false, heading: false });
  const [playerPicker, setPlayerPicker] = useState(false);
  const [newTag, setNewTag] = useState(null); // null = no se está escribiendo una etiqueta
  const tagCancelled = useRef(false); // Esc al escribir una etiqueta: no se añade al perder el foco
  const [relatedQuery, setRelatedQuery] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState(null);

  // El texto inicial se pone una sola vez: después lo maneja el navegador (contentEditable)
  useEffect(() => {
    editorRef.current.innerHTML = initial.bodyHtml;
    countWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al escribir: «Guardando…» y, al poco, «Guardado automáticamente»
  useEffect(() => {
    if (saveState !== 'saving') return undefined;
    const timer = setTimeout(() => setSaveState('saved'), 800);
    return () => clearTimeout(timer);
  }, [saveState]);

  // Botones B, I y H2 encendidos según dónde esté el cursor
  useEffect(() => {
    function update() {
      if (!isInsideEditor()) return;
      setFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        heading: document.queryCommandValue('formatBlock').toLowerCase() === 'h2',
      });
    }
    document.addEventListener('selectionchange', update);
    return () => document.removeEventListener('selectionchange', update);
  }, []);

  const errors = {
    title: !form.title.trim() ? 'Escribe el título' : null,
    excerpt: !form.excerpt.trim() ? 'Escribe la entradilla' : null,
    publishAt: form.status !== 'scheduled' ? null
      : !form.publishAt.trim() ? 'Indica cuándo se publica'
        : !DATE_PATTERN.test(form.publishAt.trim()) ? 'Usa el formato dd/mm/aaaa · hh:mm'
          : null,
    body: words === 0 ? 'Escribe el texto del artículo' : null,
  };
  const shown = (field) => (submitted ? errors[field] : null);

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setNotice(null);
  }

  // ---- Editor de texto ----

  function isInsideEditor() {
    const selection = window.getSelection();
    return selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode);
  }

  function rememberCursor() {
    if (isInsideEditor()) rangeRef.current = window.getSelection().getRangeAt(0).cloneRange();
  }

  // Vuelve a poner el cursor donde estaba (al pulsar un botón o un desplegable se pierde)
  function restoreCursor() {
    const editor = editorRef.current;
    editor.focus();
    const selection = window.getSelection();
    selection.removeAllRanges();
    if (rangeRef.current) {
      selection.addRange(rangeRef.current);
    } else {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false); // Al final del texto
      selection.addRange(range);
    }
  }

  function command(name, value) {
    restoreCursor();
    document.execCommand(name, false, value);
    edited();
  }

  function toggleHeading() {
    command('formatBlock', formats.heading ? 'p' : 'h2');
  }

  function toggleQuote() {
    const inQuote = document.queryCommandValue('formatBlock').toLowerCase() === 'blockquote';
    command('formatBlock', inQuote ? 'p' : 'blockquote');
  }

  function addLink() {
    restoreCursor();
    const url = window.prompt('Dirección del enlace', 'https://');
    if (url && url !== 'https://') command('createLink', url);
  }

  function insertBlock(html) {
    command('insertHTML', `${html}<p><br></p>`);
  }

  function insertPlayer(event) {
    const player = getPlayer(event.target.value);
    setPlayerPicker(false);
    if (player) insertBlock(playerBlockHtml(player));
  }

  // La × de un bloque insertado lo quita
  function handleEditorClick(event) {
    const remove = event.target.closest('[data-remove-block]');
    if (!remove) return;
    remove.closest('[data-block]')?.remove();
    edited();
  }

  function edited() {
    rememberCursor();
    countWords();
    setSaveState('saving');
    setNotice(null);
  }

  // Solo cuenta el texto escrito: las fichas de jugador, imágenes y gráficos insertados no son palabras
  function countWords() {
    const copy = editorRef.current?.cloneNode(true);
    copy?.querySelectorAll('[data-block]').forEach((block) => block.remove());
    const text = copy?.textContent ?? '';
    setWords(text.trim() ? text.trim().split(/\s+/).length : 0);
  }

  // ---- Clasificación ----

  function addTag(event) {
    event.preventDefault();
    if (tagCancelled.current) {
      tagCancelled.current = false;
      return;
    }
    const tag = newTag?.trim();
    if (tag && !form.tags.includes(tag)) change('tags', [...form.tags, tag]);
    setNewTag(null);
  }

  function addRelated(item) {
    change('related', [...form.related, item]);
    setRelatedQuery('');
  }

  const suggestions = getSuggestions(relatedQuery, form.related);

  // ---- Publicación ----

  function saveDraft() {
    change('status', 'draft');
    setNotice({ tone: 'info', text: `Borrador guardado a las ${currentTime()}.` });
    setSaveState('saved');
  }

  function publish() {
    if (Object.values(errors).some(Boolean)) {
      setSubmitted(true);
      setNotice({ tone: 'error', text: 'Revisa los campos marcados antes de publicar.' });
      return;
    }
    setSubmitted(false);
    setSaveState('saved');
    setNotice(
      form.status === 'scheduled'
        ? { tone: 'win', text: `Programado para el ${form.publishAt}.` }
        : { tone: 'win', text: 'Artículo publicado.' }
    );
    if (form.status === 'draft') setForm((current) => ({ ...current, status: 'published' }));
  }

  function uploadCover(event) {
    const file = event.target.files?.[0];
    if (file) setCoverImage(URL.createObjectURL(file)); // Solo se ve aquí: no se sube a ningún sitio
    event.target.value = '';
  }

  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  const saveText = {
    new: 'Artículo nuevo sin guardar',
    'saved-before': 'Guardado automáticamente hace 1 min',
    saving: 'Guardando…',
    saved: 'Guardado automáticamente',
  }[saveState];

  return (
    <section className="page article-editor">
      <RoleNotice role="editor" />
      <Breadcrumbs items={[{ label: 'Panel de editor', to: '/editor' }, { label: isNew ? 'Nuevo artículo' : 'Editar artículo' }]} />

      <div className="article-editor__layout">
        {/* Columna principal: título, entradilla y texto */}
        <div className="article-editor__main">
          <TextField
            className="article-editor__title-field"
            label="Título"
            placeholder="Escribe el título del análisis"
            value={form.title}
            onChange={(e) => change('title', e.target.value)}
            error={shown('title')}
          />
          <TextField
            label={<>Subtítulo / entradilla</>}
            placeholder="Resume en una frase de qué trata"
            value={form.excerpt}
            onChange={(e) => change('excerpt', e.target.value)}
            error={shown('excerpt')}
          />

          <div className="article-editor__editor">
            <div className="article-editor__toolbar" role="toolbar" aria-label="Formato del texto">
              <ToolButton label="Negrita" active={formats.bold} onClick={() => command('bold')} className="article-editor__tool--bold">B</ToolButton>
              <ToolButton label="Cursiva" active={formats.italic} onClick={() => command('italic')} className="article-editor__tool--italic">I</ToolButton>
              <ToolButton label="Título de sección" active={formats.heading} onClick={toggleHeading}>H2</ToolButton>
              <span className="article-editor__separator" aria-hidden="true" />
              <ToolButton label="Lista" icon={listIcon} onClick={() => command('insertUnorderedList')} />
              <ToolButton label="Cita" icon={quoteIcon} onClick={toggleQuote} />
              <ToolButton label="Enlace" icon={linkIcon} onClick={addLink} />
              <ToolButton label="Imagen" icon={imageIcon} onClick={() => insertBlock(simpleBlockHtml('image', 'Imagen', 'Ilustración del artículo'))} />
              <ToolButton label="Gráfico" icon={chartIcon} onClick={() => insertBlock(simpleBlockHtml('chart', 'Gráfico', 'Barras por jornada'))} />
              <ToolButton label="Jugador" icon={userIcon} active={playerPicker} onClick={() => setPlayerPicker((open) => !open)} />
            </div>

            {playerPicker && (
              <div className="article-editor__picker">
                <Select
                  size="sm"
                  label="Jugador que quieres insertar"
                  hideLabel
                  placeholder="Elige un jugador…"
                  options={Object.values(PLAYERS).map((player) => ({ value: player.id, label: `${player.name} · ${getTeam(player.teamId)?.name ?? ''}` }))}
                  value=""
                  onChange={insertPlayer}
                />
              </div>
            )}

            <div
              ref={editorRef}
              className="article-editor__text"
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              aria-label="Texto del artículo"
              aria-invalid={shown('body') ? true : undefined}
              aria-describedby={shown('body') ? 'article-editor-body-error' : undefined}
              data-placeholder="Empieza a escribir el análisis…"
              onInput={edited}
              onKeyUp={rememberCursor}
              onMouseUp={rememberCursor}
              onClick={handleEditorClick}
            />
            <FieldError id="article-editor-body-error">{shown('body')}</FieldError>

            <div className="article-editor__status">
              <span className={`article-editor__saved${saveState === 'new' ? ' article-editor__saved--new' : ''}`}>
                {saveState !== 'new' && saveState !== 'saving' && <span className="article-editor__check" aria-hidden="true" />}
                {saveText}
              </span>
              <span className="article-editor__count">
                {words} {words === 1 ? 'palabra' : 'palabras'} · {minutes} min
              </span>
            </div>
          </div>
        </div>

        {/* Columna lateral */}
        <aside className="article-editor__side">
          <div className="article-editor__box">
            <h2 className="article-editor__box-title">Publicación</h2>
            <Select
              label="Estado"
              options={STATUSES}
              value={form.status}
              onChange={(e) => change('status', e.target.value)}
            />
            <TextField
              label="Fecha de publicación"
              placeholder="dd/mm/aaaa · hh:mm"
              icon={calendarIcon}
              value={form.publishAt}
              onChange={(e) => change('publishAt', e.target.value)}
              error={shown('publishAt')}
            />
            <div className="article-editor__buttons">
              <Button variant="tertiary" className="article-editor__button article-editor__button--draft" onClick={saveDraft}>
                Guardar borrador
              </Button>
              <Button className="article-editor__button" onClick={publish}>Publicar</Button>
            </div>
            {notice && (
              <p className={`article-editor__notice article-editor__notice--${notice.tone}`} role="status">
                {notice.text}
                {notice.tone === 'win' && <> <Link to="/editor">Volver al panel</Link></>}
              </p>
            )}
          </div>

          <div className="article-editor__box">
            <h2 className="article-editor__box-title">Clasificación</h2>
            <Select
              label="Categoría"
              options={CATEGORIES}
              value={form.category}
              onChange={(e) => change('category', e.target.value)}
            />

            <div className="article-editor__group">
              <span className="article-editor__label" id="tags-label">Etiquetas</span>
              <ul className="article-editor__chips" aria-labelledby="tags-label">
                {form.tags.map((tag) => (
                  <li key={tag} className="article-editor__chip">
                    {tag}
                    <button
                      type="button"
                      className="article-editor__chip-remove"
                      aria-label={`Quitar la etiqueta ${tag}`}
                      onClick={() => change('tags', form.tags.filter((item) => item !== tag))}
                    />
                  </li>
                ))}
                <li>
                  {newTag === null ? (
                    <button type="button" className="article-editor__add" onClick={() => setNewTag('')}>+ Añadir</button>
                  ) : (
                    <form className="article-editor__add-form" onSubmit={addTag}>
                      <input
                        className="article-editor__add-input"
                        aria-label="Nueva etiqueta"
                        placeholder="Etiqueta + Enter"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onBlur={addTag}
                        onKeyDown={(e) => {
                          if (e.key !== 'Escape') return;
                          tagCancelled.current = true;
                          setNewTag(null);
                        }}
                        autoFocus
                      />
                    </form>
                  )}
                </li>
              </ul>
            </div>

            <div className="article-editor__group">
              <TextField
                label="Jugadores / equipos relacionados"
                placeholder="Buscar y enlazar…"
                icon={searchIcon}
                value={relatedQuery}
                onChange={(e) => setRelatedQuery(e.target.value)}
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <ul className="article-editor__suggestions">
                  {suggestions.map((item) => (
                    <li key={`${item.type}-${item.id}`}>
                      <button type="button" className="article-editor__suggestion" onClick={() => addRelated(item)}>
                        <RelatedBadge item={item} />
                        {relatedName(item, true)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {form.related.length > 0 && (
                <ul className="article-editor__chips">
                  {form.related.map((item) => (
                    <li key={`${item.type}-${item.id}`} className="article-editor__chip article-editor__chip--related">
                      <RelatedBadge item={item} />
                      {relatedName(item)}
                      <button
                        type="button"
                        className="article-editor__chip-remove"
                        aria-label={`Quitar ${relatedName(item)}`}
                        onClick={() => change('related', form.related.filter((other) => other !== item))}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="article-editor__box">
            <h2 className="article-editor__box-title">Imagen de portada</h2>
            {coverImage ? (
              <img className="article-editor__cover" src={coverImage} alt="Imagen de portada elegida" />
            ) : (
              <Illustration className="article-editor__cover" type={form.category} {...coverProps(form)} />
            )}
            <div className="article-editor__buttons">
              <Button variant="secondary" className="article-editor__button" onClick={() => fileRef.current.click()}>
                <img src={uploadIcon} alt="" width="16" height="16" />
                Subir imagen
              </Button>
              <Button variant="tertiary" className="article-editor__button article-editor__button--draft" onClick={() => setCoverImage(null)}>
                Ilustración auto
              </Button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadCover} />
          </div>
        </aside>
      </div>
    </section>
  );
}

// Botón de la barra de herramientas. onMouseDown con preventDefault: así no se pierde el texto seleccionado.
function ToolButton({ label, icon, active = false, onClick, className = '', children }) {
  return (
    <button
      type="button"
      className={`article-editor__tool${active ? ' article-editor__tool--active' : ''} ${className}`.trim()}
      aria-label={label}
      aria-pressed={active}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {icon ? (
        <>
          <img src={icon} alt="" width="16" height="16" />
          <span className="article-editor__tool-text">{label}</span>
        </>
      ) : children}
    </button>
  );
}

// Círculo del jugador (iniciales) o escudo del equipo
function RelatedBadge({ item }) {
  if (item.type === 'team') return <Crest teamId={item.id} size={22} />;
  return <Avatar name={getPlayer(item.id)?.name} size={22} />;
}

function relatedName(item, full = false) {
  if (item.type === 'team') return getTeam(item.id)?.name ?? item.id;
  const player = getPlayer(item.id);
  return full ? player?.name : player?.shortName ?? player?.name;
}

// Jugadores y equipos que coinciden con lo buscado (máximo 5, sin los ya elegidos)
function getSuggestions(query, chosen) {
  const text = normalize(query);
  if (!text) return [];
  const isChosen = (type, id) => chosen.some((item) => item.type === type && item.id === id);
  const players = Object.values(PLAYERS)
    .filter((player) => !isChosen('player', player.id) && normalize(player.name).includes(text))
    .map((player) => ({ type: 'player', id: player.id }));
  const teams = Object.values(TEAMS)
    .filter((team) => !isChosen('team', team.id) && normalize(team.name).includes(text))
    .map((team) => ({ type: 'team', id: team.id }));
  return [...players, ...teams].slice(0, 5);
}

// Portada automática: en las previas, los dos primeros equipos relacionados (o los del borrador)
function coverProps(form) {
  const teams = form.related.filter((item) => item.type === 'team').map((item) => item.id);
  if (form.category === 'Previa') {
    return {
      home: form.cover.home ?? teams[0] ?? 'real-madrid',
      away: form.cover.away ?? teams[1] ?? 'barcelona',
    };
  }
  return form.cover;
}

// Valores iniciales: vacío (nuevo) o los datos del artículo
function getInitialValues(article) {
  if (!article) {
    return {
      title: '', excerpt: '', status: 'draft', publishAt: '', category: 'Táctica',
      tags: [], related: [], cover: {}, bodyHtml: '',
    };
  }
  const extras = getArticleExtras(article.id);
  const content = getArticleContent(article.id);
  const draft = getArticleDraft(article.id);
  const mentions = content.body?.find((block) => block.type === 'mentions')?.items ?? [];

  return {
    title: article.title,
    excerpt: draft.excerpt ?? content.lead ?? extras.excerpt ?? '',
    status: article.status,
    publishAt: draft.publishAt ?? article.date ?? '',
    category: article.category,
    tags: draft.tags ?? [],
    related: draft.related ?? mentions.map(({ type, id }) => ({ type, id })),
    cover: draft.cover ?? extras.illustration ?? {},
    // Si el artículo no tiene más texto que la entradilla (como en su página pública), el texto empieza con ella
    bodyHtml: blocksToHtml(draft.body ?? content.body ?? [{ type: 'paragraph', text: content.lead ?? extras.excerpt ?? '' }]),
  };
}

// Bloques de datos → HTML del editor
function blocksToHtml(blocks) {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'paragraph': return `<p>${escape(block.text)}</p>`;
        case 'heading': return `<h2>${escape(block.text)}</h2>`;
        case 'quote': return `<blockquote>${escape(block.text)}</blockquote>`;
        case 'stats': return simpleBlockHtml('chart', 'Dato destacado', (block.items ?? []).map((item) => `${item.value} ${item.label}`).join(' · '));
        case 'player': {
          const player = getPlayer(block.id);
          return player ? playerBlockHtml(player) : '';
        }
        case 'chart': return simpleBlockHtml('chart', 'Gráfico', block.title ?? block.text ?? '');
        case 'image': return simpleBlockHtml('image', 'Imagen', block.text ?? '');
        default: return '';
      }
    })
    .join('');
}

// Ficha de jugador insertada (no se edita por dentro; se quita con la ×)
function playerBlockHtml(player) {
  const team = getTeam(player.teamId)?.name ?? '';
  const rating = player.rating?.toLocaleString('es-ES', { minimumFractionDigits: 1 }) ?? '—';
  const initials = player.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  return `<div class="article-editor__block" data-block="player" contenteditable="false">`
    + `<span class="article-editor__block-avatar">${escape(initials)}</span>`
    + `<span class="article-editor__block-text"><strong>${escape(player.name)} · ${escape(team)}</strong>`
    + `<small>Jugador enlazado · ${player.goals} G · ${player.assists} A · ${rating}</small></span>`
    + `<button type="button" class="article-editor__block-remove" data-remove-block aria-label="Quitar bloque"></button></div>`;
}

// Bloque de ejemplo (imagen o gráfico)
function simpleBlockHtml(kind, title, detail) {
  return `<div class="article-editor__block article-editor__block--${kind}" data-block="${kind}" contenteditable="false">`
    + `<span class="article-editor__block-icon article-editor__block-icon--${kind}"></span>`
    + `<span class="article-editor__block-text"><strong>${escape(title)}</strong><small>${escape(detail)}</small></span>`
    + `<button type="button" class="article-editor__block-remove" data-remove-block aria-label="Quitar bloque"></button></div>`;
}

function escape(text = '') {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function normalize(text = '') {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function currentTime() {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
