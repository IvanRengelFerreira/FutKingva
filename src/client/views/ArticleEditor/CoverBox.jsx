import { useRef, useState } from 'react';
import Button from '../../components/Button/Button.jsx';
import Illustration from '../../components/Illustration/Illustration.jsx';
import uploadIcon from '../../assets/icon-upload.svg';

// Imagen de portada: la ilustración automática o una imagen elegida por el editor
export default function CoverBox({ category, illustration }) {
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
