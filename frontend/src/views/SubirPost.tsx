import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import './SubirPost.css';

export function SubirPost() {
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'url' | 'file'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.files?.[0]?.name ?? '');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="subir-post">
      <h2>Subir un momo</h2>

      <form className="subir-post-form" onSubmit={handleSubmit}>
        <label htmlFor="subir-titulo">Título</label>
        <input
          id="subir-titulo"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSubmitted(false);
          }}
          placeholder="Dale un título a tu momo"
          required
        />

        <div className="subir-post-mode">
          <label>
            <input type="radio" checked={mode === 'url'} onChange={() => setMode('url')} />
            Desde una URL
          </label>
          <label>
            <input type="radio" checked={mode === 'file'} onChange={() => setMode('file')} />
            Desde mi computador
          </label>
        </div>

        {mode === 'url' ? (
          <>
            <label htmlFor="subir-url">URL de la imagen</label>
            <input
              id="subir-url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
            {imageUrl && (
              <div className="subir-post-preview">
                <img src={imageUrl} alt="Vista previa del momo" />
              </div>
            )}
          </>
        ) : (
          <>
            <label htmlFor="subir-archivo">Archivo</label>
            <input id="subir-archivo" type="file" accept="image/*" onChange={handleFileChange} />
            {fileName && <span className="subir-post-filename">{fileName}</span>}
          </>
        )}

        <button type="submit">Publicar</button>

        {submitted && (
          <p className="subir-post-success">¡Tu momo quedó pendiente de moderación!</p>
        )}
      </form>
    </div>
  );
}
