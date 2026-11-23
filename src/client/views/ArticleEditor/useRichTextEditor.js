import { useEffect, useRef, useState } from 'react';

function isInsideEditor(editor) {
  const selection = window.getSelection();
  return selection.rangeCount > 0 && Boolean(editor?.contains(selection.anchorNode));
}

// Solo cuenta el texto escrito: las fichas de jugador, imágenes y gráficos insertados no son palabras
function countWords(editor) {
  const copy = editor?.cloneNode(true);
  copy?.querySelectorAll('[data-block]').forEach((block) => block.remove());
  const text = copy?.textContent ?? '';
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// Editor de texto con contentEditable y las órdenes del navegador (sin bibliotecas).
// «onEdit» se llama cada vez que el texto cambia por una acción del usuario.
export default function useRichTextEditor({ initialHtml, onEdit }) {
  const editorRef = useRef(null);
  const rangeRef = useRef(null); // Última posición del cursor dentro del texto
  const [words, setWords] = useState(0);
  const [formats, setFormats] = useState({ bold: false, italic: false, heading: false });

  // El texto inicial se pone al montar: después lo maneja el navegador (contentEditable).
  // Solo se repite si cambia initialHtml; ArticleEditor remonta el formulario (key) al cambiar de artículo,
  // así que nunca pisa lo que el usuario está escribiendo.
  useEffect(() => {
    editorRef.current.innerHTML = initialHtml;
    setWords(countWords(editorRef.current));
  }, [initialHtml]);

  // Botones B, I y H2 encendidos según dónde esté el cursor
  useEffect(() => {
    function update() {
      if (!isInsideEditor(editorRef.current)) return;
      setFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        heading: document.queryCommandValue('formatBlock').toLowerCase() === 'h2',
      });
    }
    document.addEventListener('selectionchange', update);
    return () => document.removeEventListener('selectionchange', update);
  }, []);

  function rememberCursor() {
    if (isInsideEditor(editorRef.current)) rangeRef.current = window.getSelection().getRangeAt(0).cloneRange();
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

  function edited() {
    rememberCursor();
    setWords(countWords(editorRef.current));
    onEdit?.();
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

  // La × de un bloque insertado lo quita
  function handleClick(event) {
    const remove = event.target.closest('[data-remove-block]');
    if (!remove) return;
    remove.closest('[data-block]')?.remove();
    edited();
  }

  return {
    editorRef,
    words,
    formats,
    // Eventos del propio texto (contentEditable)
    textHandlers: {
      onInput: edited,
      onKeyUp: rememberCursor,
      onMouseUp: rememberCursor,
      onClick: handleClick,
    },
    // Órdenes que usa la barra de herramientas
    commands: { command, toggleHeading, toggleQuote, addLink, insertBlock },
  };
}
