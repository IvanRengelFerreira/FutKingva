import { useRef, useState } from 'react';
import Button from '../../components/Button/Button.jsx';
import Illustration from '../../components/Illustration/Illustration.jsx';
import { coverProps } from '../../components/Illustration/coverProps.js';
import uploadIcon from '../../assets/icon-upload.svg';

// Imagen de portada: la ilustración automática (la que se guarda) o una imagen elegida por el editor.
// La imagen subida solo se ve aquí: todavía no hay servidor de archivos, así que no se guarda.
// preview: { category, cover, coverTeams } (coverPreview de articleForm.js)
export default function CoverBox({ preview }) {
  const { category } = preview;
  const illustration = coverProps(preview);
  const fileRef = useRef(null);
  const [coverImage, setCoverImage] = useState(null);

  function uploadCover(event) {
    const file = event.target.files?.[0];
    if (file) setCoverImage(URL.createObjectURL(file)); // Solo se ve aquí: no se sube a ningún sitio
    event.target.value = '';
  }

  return (
    <div className="article-editor__box">
      <h2 className="article-editor__box-title">Imagen de portada</h2>
      {coverImage ? (
        <img className="article-editor__cover" src={coverImage} alt="Imagen de portada elegida" />
      ) : (
        <Illustration className="article-editor__cover" type={category} {...illustration} />
      )}
      <div className="article-editor__buttons">
        <Button variant="secondary" className="article-editor__button" onClick={() => fileRef.current.click()}>
          <img src={uploadIcon} alt="" width="16" height="16" />
          Subir imagen
        </Button>
        <Button
          variant="tertiary"
          className="article-editor__button article-editor__button--draft"
          onClick={() => setCoverImage(null)}
        >
          Ilustración auto
        </Button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadCover} />
    </div>
  );
}
