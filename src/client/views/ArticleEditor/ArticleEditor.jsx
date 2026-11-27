import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import RoleNotice from '../../components/RoleNotice/RoleNotice.jsx';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import FieldError from '../../components/FieldError/FieldError.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import NotFound from '../NotFound/NotFound.jsx';
import { useApi } from '../../services/useApi.js';
import { createArticle, getArticleForEdit, updateArticle } from '../../services/articles.js';
import { shortTime } from '../../services/format.js';
import { CATEGORIES, buildPayload, coverPreview, getFormErrors, getInitialValues } from './articleForm.js';
import { htmlToBlocks } from './blockHtml.js';
import useRichTextEditor from './useRichTextEditor.js';
import EditorToolbar from './EditorToolbar.jsx';
import EditorStatus from './EditorStatus.jsx';
import PublishBox from './PublishBox.jsx';
import TagsField from './TagsField.jsx';
import RelatedField from './RelatedField.jsx';
import CoverBox from './CoverBox.jsx';
import './ArticleEditor.css';

// 18 · Editor de artículo (RF7): escribir o editar un análisis. Solo para el rol editor (y solo sus artículos).
//   /editor/articulo             → artículo nuevo (vacío); al guardarlo por primera vez pasa a /editor/articulo/<id>
//   /editor/articulo/<id>        → artículo propio de la BD (GET /api/articles/:id/edit), en cualquier estado
// El editor de texto usa contentEditable y las órdenes del navegador (negrita, cursiva, título, lista,
// cita, enlace), sin bibliotecas. Al guardar, el HTML se pasa a bloques (blockHtml.js): la BD no guarda HTML.
// «Jugador» inserta la ficha del jugador elegido; «Imagen» y «Gráfico», un hueco con su pie.
// «Guardar borrador» lo guarda como borrador; «Publicar», con el estado elegido (un borrador pasa a publicado).
// Para publicar o programar hacen falta título, entradilla y texto; si está programado, una fecha futura
// (dd/mm/aaaa · hh:mm). Las reglas son las del servidor (shared/validation/article.js).
// Diseño: Figma › Mockups › 18 · Editor de artículo
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=61-1565

export default function ArticleEditor() {
  const { articleId } = useParams();
  if (!articleId) return <EditorForm key="nuevo" article={null} />;
  // «key»: al pasar de un artículo a otro, el formulario empieza de cero
  return <ExistingArticle key={articleId} articleId={articleId} />;
}

function ExistingArticle({ articleId }) {
  const { data, error, loading, reload } = useApi((signal) => getArticleForEdit(articleId, { signal }), [articleId]);

  if (error?.status === 404 || error?.status === 400) return <NotFound />;
  if (error || loading || !data) {
    return (
      <section className="page article-editor">
        <RoleNotice role="editor" />
        {error ? (
          <ErrorState error={error} title="No se ha podido abrir el artículo" onRetry={reload} />
        ) : (
          <LoadingState label="Abriendo el artículo…" />
        )}
      </section>
    );
  }
  return <EditorForm article={data} />;
}

function EditorForm({ article }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [initial] = useState(() => getInitialValues(article));
  const [form, setForm] = useState(initial);
  const [saveState, setSaveState] = useState(article ? 'saved' : 'new');
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(location.state?.notice ?? null); // Aviso al crear (viene de la dirección)

  const { editorRef, words, formats, textHandlers, commands } = useRichTextEditor({
    initialHtml: initial.bodyHtml,
    onEdit: () => {
      setSaveState('changed');
      setNotice(null);
      setErrors((current) => ({ ...current, body: null }));
    },
  });

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setSaveState((current) => (current === 'new' ? current : 'changed'));
    setNotice(null);
    setErrors((current) => ({ ...current, [field]: null }));
  }

  async function save(status) {
    const payload = buildPayload(form, htmlToBlocks(editorRef.current), status);
    const formErrors = getFormErrors(form, payload);
    if (Object.keys(formErrors).length) {
      setErrors(formErrors);
      setNotice({ tone: 'error', text: otherErrors(formErrors) ?? 'Revisa los campos marcados.' });
      return;
    }

    setSaveState('saving');
    setNotice(null);
    try {
      const saved = article ? await updateArticle(article.id, payload) : await createArticle(payload);
      const done = savedNotice(saved, form);
      if (!article) {
        // Artículo nuevo: a partir de ahora se edita en su dirección (/editor/articulo/<id>)
        navigate(`/editor/articulo/${saved.id}`, { replace: true, state: { notice: done } });
        return;
      }
      setForm((current) => ({
        ...current,
        status: saved.status,
        updatedAt: saved.updatedAt,
        cover: saved.cover,
        coverTeams: saved.coverTeams,
      }));
      setErrors({});
      setNotice(done);
      setSaveState('saved');
    } catch (error) {
      setErrors(error.fields ?? {});
      setNotice({ tone: 'error', text: otherErrors(error.fields ?? {}) ?? error.message });
      setSaveState(article ? 'changed' : 'new');
    }
  }

  const shown = (field) => errors[field] ?? null;

  return (
    <section className="page article-editor">
      <RoleNotice role="editor" />
      <Breadcrumbs
        items={[{ label: 'Panel de editor', to: '/editor' }, { label: article ? 'Editar artículo' : 'Nuevo artículo' }]}
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
            value={form.summary}
            onChange={(e) => change('summary', e.target.value)}
            error={shown('summary')}
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

            <EditorStatus saveState={saveState} savedAt={form.updatedAt} words={words} />
          </div>
        </div>

        {/* Columna lateral */}
        <aside className="article-editor__side">
          <PublishBox
            form={form}
            onChange={change}
            publishAtError={shown('publishAt')}
            notice={notice}
            saving={saveState === 'saving'}
            onSaveDraft={() => save('draft')}
            onPublish={() => save(form.status === 'draft' ? 'published' : form.status)}
          />

          <div className="article-editor__box">
            <h2 className="article-editor__box-title">Clasificación</h2>
            <Select
              label="Categoría"
              options={CATEGORIES}
              value={form.category}
              onChange={(e) => change('category', e.target.value)}
              error={shown('category')}
            />
            <TagsField tags={form.tags} onChange={(tags) => change('tags', tags)} />
            <RelatedField related={form.related} onChange={(related) => change('related', related)} />
          </div>

          <CoverBox preview={coverPreview(form)} />
        </aside>
      </div>
    </section>
  );
}

// Errores que no tienen campo propio en el formulario (etiquetas, portada, estado): van en el aviso
function otherErrors(errors) {
  const message = errors.tags ?? errors.cover ?? errors.status;
  return message ? `${message}.` : null;
}

function savedNotice(saved, form) {
  if (saved.status === 'draft') return { tone: 'info', text: `Borrador guardado a las ${shortTime(saved.updatedAt)}.` };
  if (saved.status === 'scheduled') return { tone: 'win', text: `Programado para el ${form.publishAt}.` };
  return { tone: 'win', text: 'Artículo publicado.', articleId: saved.id };
}
