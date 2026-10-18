import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { apiFetch } from '../api/client';
import './SubirPost.css';

export function SubirPost() {
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'url' | 'file'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0); // permite vaciar el input de archivo
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    setError('');
  };


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (publishing) return;

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setError('Ingresa un título.');
      return;
    }


    if (mode === 'file' && !file) {
      setError('Selecciona una imagen.');
      return;
    }

    if (mode === 'url' && !imageUrl.trim()) {
      setError('Ingresa la URL de la imagen.');
      return;
    }

    const formData = new FormData();
    formData.append('title', cleanTitle);

    if (mode === 'file' && file) {
      formData.append('image', file);
    } else {
      formData.append('imageUrl', imageUrl.trim());
    }


    setPublishing(true);
    setError('');
    setSubmitted(false);

    try {
      await apiFetch('/memes', {
        method: 'POST',
        body: formData,
      });

      setTitle('');
      setImageUrl('');
      setFile(null);
      setFileKey((key) => key + 1);
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo publicar el meme.',
      );
    } finally {
      setPublishing(false);
    }
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
            <input
              type="radio"
              checked={mode === 'url'}
              onChange={() => {
                setMode('url');
                setError('');
              }}
            />
            Desde una URL
          </label>
          <label>
            <input
              type="radio"
              checked={mode === 'file'}
              onChange={() => {
                setMode('file');
                setError('');
              }}
            />
            Desde mi computador
          </label>
        </div>

        {mode === 'url' ? (
          <>
            <label htmlFor="subir-url">URL de la imagen</label>
            <input
              id="subir-url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setError('');
              }}
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
            <input
              key={fileKey}
              id="subir-archivo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            {file && <span className="subir-post-filename">{file.name}</span>}
          </>
        )}

        {error && <p className="subir-post-error">{error}</p>}

        <button type="submit" disabled={publishing}>
          {publishing ? 'Publicando…' : 'Publicar'}
        </button>

        {submitted && (
          <p className="subir-post-success">¡Tu momo quedó pendiente de moderación!</p>
        )}
      </form>
    </div>
  );
}
