import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import type { Meme, User } from '../../types';
import './SubirPost.css';

interface SubirPostProps {
  currentUser: User;
  onSubmit: (data: Meme) => void | Promise<void>;
  submitText?: string;
}

type ImageMode = 'url' | 'file';

const SubirPost = ({ currentUser, onSubmit, submitText = 'Publicar momo' }: SubirPostProps) => {
  // Formulario controlado: cada input refleja siempre el estado de React.
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // guarda la URL pegada o el data-url del archivo leido
  const [fileName, setFileName] = useState('');
  const [mode, setMode] = useState<ImageMode>('url');
  const [error, setError] = useState('');
  const [imageOk, setImageOk] = useState(true);
  const [success, setSuccess] = useState(false);

  // Oculta el mensaje de exito solo, 3 segundos despues de mostrarse.
  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => setSuccess(false), 3000);

    // Limpieza: si el componente se desmonta o success cambia antes,
    // cancelamos el timeout pendiente para evitar actualizar estado de mas.
    return () => clearTimeout(timer);
  }, [success]);

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const handleImageUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setImageUrl(event.target.value);
    setImageOk(true);
  };

  // Lee el archivo local y lo transforma en un data-url (string) que
  // puede usarse directamente como imageUrl, igual que una URL normal.
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      setImageOk(true);
    };
    reader.readAsDataURL(file);
  };

  const switchMode = (newMode: ImageMode) => {
    setMode(newMode);
    setImageUrl('');
    setFileName('');
    setImageOk(true);
    setError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // evita el envio tradicional del formulario (recarga de pagina)

    if (title.trim() === '' || imageUrl.trim() === '') {
      setError('El título y la imagen son obligatorios.');
      return;
    }

    const data: Meme = {
      id: `meme_${Date.now()}`,
      title: title.trim(),
      imageUrl: imageUrl.trim(),
      author: currentUser,
      status: 'pending',
      likes: 0,
      dislikes: 0,
      score: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await onSubmit(data);

      // Se limpia el formulario una vez enviado correctamente.
      setTitle('');
      setImageUrl('');
      setFileName('');
      setError('');
      setImageOk(true);
      setSuccess(true);
    } catch {
      setError('Ocurrió un error al publicar el momo. Intenta de nuevo.');
    }
  };

  return (
    <div className="subir-post">
      <h2>Sube tu Meme</h2>

      <form onSubmit={handleSubmit} className="subir-post-form">
        <label htmlFor="title">Título</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Dale un título a tu momo"
        />

        <div className="subir-post-mode">
          <label>
            <input
              type="radio"
              name="image-mode"
              checked={mode === 'url'}
              onChange={() => switchMode('url')}
            />
            Pegar una URL
          </label>
          <label>
            <input
              type="radio"
              name="image-mode"
              checked={mode === 'file'}
              onChange={() => switchMode('file')}
            />
            Subir desde mi computador
          </label>
        </div>

        {mode === 'url' ? (
          <>
            <label htmlFor="imageUrl">URL de la imagen</label>
            <input
              id="imageUrl"
              type="text"
              value={imageUrl}
              onChange={handleImageUrlChange}
              placeholder="https://..."
            />
          </>
        ) : (
          <>
            <label htmlFor="imageFile">Imagen desde tu computador</label>
            <input
              id="imageFile"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            {fileName && <p className="subir-post-filename">{fileName}</p>}
          </>
        )}

        {imageUrl.trim() !== '' && (
          <div className="subir-post-preview">
            {imageOk ? (
              <img
                src={imageUrl}
                alt="Vista previa"
                onError={() => setImageOk(false)}
              />
            ) : (
              <p className="subir-post-preview-error">
                No se pudo cargar esa imagen, revisa la URL.
              </p>
            )}
          </div>
        )}

        {error && <p className="subir-post-error">{error}</p>}
        {success && <p className="subir-post-success">¡Tu momo fue publicado!</p>}

        <button type="submit">{submitText}</button>
      </form>
    </div>
  );
};

export default SubirPost;
