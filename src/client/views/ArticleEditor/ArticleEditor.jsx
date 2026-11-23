import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import RoleNotice from '../../components/RoleNotice/RoleNotice.jsx';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import FieldError from '../../components/FieldError/FieldError.jsx';
import NotFound from '../NotFound/NotFound.jsx';
import { getArticle } from '../../data/mockData.js';
import { CATEGORIES, coverProps, getFormErrors, getInitialValues } from './articleForm.js';
import useRichTextEditor from './useRichTextEditor.js';
import EditorToolbar from './EditorToolbar.jsx';
import EditorStatus from './EditorStatus.jsx';
import PublishBox from './PublishBox.jsx';
import TagsField from './TagsField.jsx';
import RelatedField from './RelatedField.jsx';
import CoverBox from './CoverBox.jsx';
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

export default function ArticleEditor() {
  const { articleId } = useParams();
  const article = articleId ? getArticle(articleId) : null;
  if (articleId && !article) return <NotFound />;

  // «key»: al pasar de un artículo a otro, el formulario empieza de cero
  return <EditorForm key={articleId ?? 'nuevo'} initial={getInitialValues(article)} isNew={!article} />;
}

function EditorForm({ initial, isNew }) {
  const [form, setForm] = useState(initial);
  const [saveState, setSaveState] = useState(isNew ? 'new' : 'saved-before');
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState(null);

  // Editor de texto: al escribir se marca «Guardando…» y se borra el aviso anterior
  const { editorRef, words, formats, textHandlers, commands } = useRichTextEditor({
    initialHtml: initial.bodyHtml,
    onEdit: () => {
      setSaveState('saving');
      setNotice(null);
    },
  });

  // «Guardando…» pasa a «Guardado automáticamente» al poco de dejar de escribir
  useEffect(() => {
    if (saveState !== 'saving') return undefined;
    const timer = setTimeout(() => setSaveState('saved'), 800);
    return () => clearTimeout(timer);
  }, [saveState]);

  const errors = getFormErrors(form, words);
  const shown = (field) => (submitted ? errors[field] : null);

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setNotice(null);
  }

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
        : { tone: 'win', text: 'Artículo publicado.' },
    );
    if (form.status === 'draft') setForm((current) => ({ ...current, status: 'published' }));
  }

  return (
    <section className="page article-editor">
      <RoleNotice role="editor" />
      <Breadcrumbs
        items={[{ label: 'Panel de editor', to: '/editor' }, { label: isNew ? 'Nuevo artículo' : 'Editar artículo' }]}
      />

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
            <EditorToolbar formats={formats} commands={commands} />

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
              {...textHandlers}
            />
            <FieldError id="article-editor-body-error">{shown('body')}</FieldError>

            <EditorStatus saveState={saveState} words={words} />
          </div>
        </div>

        {/* Columna lateral */}
        <aside className="article-editor__side">
          <PublishBox
            form={form}
            onChange={change}
            publishAtError={shown('publishAt')}
            notice={notice}
            onSaveDraft={saveDraft}
            onPublish={publish}
          />

          <div className="article-editor__box">
            <h2 className="article-editor__box-title">Clasificación</h2>
            <Select
              label="Categoría"
              options={CATEGORIES}
              value={form.category}
              onChange={(e) => change('category', e.target.value)}
            />
            <TagsField tags={form.tags} onChange={(tags) => change('tags', tags)} />
            <RelatedField related={form.related} onChange={(related) => change('related', related)} />
          </div>

          <CoverBox category={form.category} illustration={coverProps(form)} />
        </aside>
      </div>
    </section>
  );
}

function currentTime() {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
