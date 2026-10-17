import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { publishMeme } from '../memeStore';
import './SubirPost.css';

export function SubirPost() {
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'url' | 'file'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0); // permite vaciar el input de archivo
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    setError('');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    // Con archivo se usa una URL temporal del navegador (solo vale mientras la
    // página esté abierta); con el backend real se subirá el archivo al servidor.
    const source =
      mode === 'url' ? imageUrl.trim() : file ? URL.createObjectURL(file) : '';

    if (!source) {
      setError(mode === 'url' ? 'Ingresa la URL de la imagen.' : 'Elige una imagen para subir.');
      return;
    }

    // El meme nace como "pendiente" y queda a la espera de un moderador.
    publishMeme({ title: title.trim(), imageUrl: source });

    setError('');
    setTitle('');
    setImageUrl('');
    setFile(null);
    setFileKey((key) => key + 1);
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

        <button type="submit">Publicar</button>

        {submitted && (
          <p className="subir-post-success">¡Tu momo quedó pendiente de moderación!</p>
        )}
      </form>
    </div>
  );
}
