import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { apiFetch } from '../api/client';
import {
  Alert,
  Box,
  Button,
  Card,
  CardMedia,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import ComputerRoundedIcon from '@mui/icons-material/ComputerRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import { FormCard } from '../components/ui/FormCard';

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
    <FormCard
      title="Subir un momo"
      subtitle="Tu momo quedará pendiente hasta que un moderador lo apruebe"
      onSubmit={handleSubmit}
      maxWidth={560}
    >
      <TextField
        id="subir-titulo"
        label="Título"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setSubmitted(false);
        }}
        placeholder="Dale un título a tu momo"
        required
      />

      {/* Selector de origen de la imagen (antes eran dos radio buttons) */}
      <ToggleButtonGroup
        exclusive
        fullWidth
        color="primary"
        size="small"
        value={mode}
        onChange={(_, value: 'url' | 'file' | null) => {
          if (!value) return;
          setMode(value);
          setError('');
        }}
        aria-label="Origen de la imagen"
      >
        <ToggleButton value="url">
          <LinkRoundedIcon fontSize="small" sx={{ mr: 1 }} />
          Desde una URL
        </ToggleButton>
        <ToggleButton value="file">
          <ComputerRoundedIcon fontSize="small" sx={{ mr: 1 }} />
          Desde mi computador
        </ToggleButton>
      </ToggleButtonGroup>

      {mode === 'url' ? (
        <TextField
          id="subir-url"
          label="URL de la imagen"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            setError('');
          }}
          placeholder="https://..."
        />
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {/* Patrón de MUI para subir archivos: un Button que actúa como <label> de un input oculto */}
          <Button component="label" variant="outlined" startIcon={<CloudUploadRoundedIcon />}>
            Elegir imagen
            <input
              key={fileKey}
              id="subir-archivo"
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ minWidth: 0, flex: 1 }}>
            {file ? file.name : 'Ningún archivo seleccionado'}
          </Typography>
        </Box>
      )}

      {mode === 'url' && imageUrl && (
        <Card sx={{ borderRadius: 3 }}>
          <CardMedia
            component="img"
            image={imageUrl}
            alt="Vista previa del momo"
            sx={{ maxHeight: 320, objectFit: 'contain', bgcolor: 'background.default' }}
          />
        </Card>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      <Button type="submit" variant="contained" size="large" loading={publishing}>
        Publicar
      </Button>

      {submitted && <Alert severity="success">¡Tu momo quedó pendiente de moderación!</Alert>}
    </FormCard>
  );
}
