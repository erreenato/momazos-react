
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { useAuth } from '../auth/useAuth';
import {
  getUserById,
  getUserMemes,
  updateMyProfile,
  deleteMyMeme,
} from '../services/profileService';
import type { User, Meme } from '../types';
import './ProfileView.css';

interface ProfileData {
  id: string;
  user: User | null;
  memes: Meme[];
}


const statusLabels: Record<Meme['status'], string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

// Color semántico del tema MUI para cada estado del meme.
const statusColors: Record<Meme['status'], 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};


export function ProfileView() {
  const { id } = useParams<{ id: string }>();
  const { user: viewer, loading: authLoading } = useAuth();

  const profileId = id ?? viewer?.id;

  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profileId || authLoading) return;

    let cancelled = false;

    async function load() {
      try {
        setError('');

        const user = await getUserById(profileId!);
        const memes = user ? await getUserMemes(profileId!) : [];

        if (!cancelled) {
          setData({ id: profileId!, user, memes });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudo cargar el perfil.',
          );
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [profileId, authLoading]);

  if (authLoading || !profileId || (data?.id !== profileId && !error)) {
    return (
      <div className="profile-view">
        <LoadingState message="Cargando perfil…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-view">
        <Alert severity="error">{error}</Alert>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="profile-view">
        <EmptyState icon="👻" title="No encontramos a este usuario." />
      </div>
    );
  }

  return (
    <ProfileContent
      key={data.user.id}
      initialUser={data.user}
      memes={data.memes}
      isOwner={viewer?.id === data.user.id}
      viewerIsModerator={viewer?.role === 'moderator'}
    />
  );
}

interface ProfileContentProps {
  initialUser: User;
  memes: Meme[];
  isOwner: boolean;
  viewerIsModerator: boolean;
}

function ProfileContent({
  initialUser,
  memes,
  isOwner,
  viewerIsModerator,
}: ProfileContentProps) {
  const [user, setUser] = useState<User>(initialUser);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [userMemes, setUserMemes] = useState<Meme[]>(memes);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const [draft, setDraft] = useState({
    description: initialUser.description ?? '',
    avatarUrl: initialUser.avatarUrl ?? '',
  });

  const isModerator = user.role === 'moderator';

  const approvedMemes = userMemes.filter(
    (meme) => meme.status === 'approved',
  );

  const totalLikes = userMemes.reduce(
    (total, meme) => total + meme.likes,
    0,
  );

  const stats = [
    { label: 'Puntaje', value: user.score },
    { label: 'Memes aprobados', value: approvedMemes.length },
    { label: 'Me gusta', value: totalLikes },
  ];

  const startEditing = () => {
    setDraft({
      description: user.description ?? '',
      avatarUrl: user.avatarUrl ?? '',
    });
    setSaveError('');
    setEditing(true);
  };

  const saveChanges = async () => {
    if (saving) return;

    setSaving(true);
    setSaveError('');

    try {
      const updatedUser = await updateMyProfile({
        description: draft.description.trim(),
        avatarUrl: draft.avatarUrl.trim(),
      });

      setUser(updatedUser);
      setEditing(false);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'No se pudieron guardar los cambios.',
      );
    } finally {
      setSaving(false);
    }
  };

  // Meme que se quiere eliminar: abre el ConfirmDialog (reemplaza a window.confirm).
  const [memeToDelete, setMemeToDelete] = useState<Meme | null>(null);

  const handleDeleteMeme = async (meme: Meme) => {
    if (!isOwner || deletingId) return;

    setDeletingId(meme.id);
    setDeleteError('');

    try {
      await deleteMyMeme(meme.id);

      setUserMemes((current) =>
        current.filter((item) => item.id !== meme.id),
      );

      // Consultar el perfil actualizado para reflejar el nuevo puntaje.
      const updatedUser = await getUserById(user.id);

      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : 'No se pudo eliminar el meme.',
      );
    } finally {
      setDeletingId(null);
      setMemeToDelete(null);
    }
  };
  const showAvatar = editing ? draft.avatarUrl : user.avatarUrl;

  return (
    <div className="profile-view">
      <Paper component="header" variant="outlined" className="profile-header">
        <Avatar
          src={showAvatar || undefined}
          alt={`Avatar de ${user.username}`}
          sx={{
            width: { xs: 72, sm: 96 },
            height: { xs: 72, sm: 96 },
            fontSize: { xs: 30, sm: 40 },
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--mui-palette-primary-light), var(--mui-palette-primary-dark))',
          }}
        >
          {user.username.charAt(0).toUpperCase()}
        </Avatar>

        <div className="profile-info">
          {editing ? (
            <Stack spacing={2} sx={{ width: '100%' }}>
              <TextField
                label="Descripción"
                multiline
                minRows={3}
                value={draft.description}
                slotProps={{ htmlInput: { maxLength: 500 } }}
                helperText={`${draft.description.length}/500`}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    description: e.target.value,
                  }))
                }
              />

              <TextField
                label="URL de la imagen de perfil"
                type="url"
                placeholder="https://..."
                value={draft.avatarUrl}
                slotProps={{ htmlInput: { maxLength: 2048 } }}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    avatarUrl: e.target.value,
                  }))
                }
              />

              {saveError && <Alert severity="error">{saveError}</Alert>}

              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={() => void saveChanges()} loading={saving}>
                  Guardar
                </Button>
                <Button color="inherit" onClick={() => setEditing(false)} disabled={saving}>
                  Cancelar
                </Button>
              </Stack>
            </Stack>
          ) : (
            <>
              <div className="profile-title-row">
                <Typography variant="h2" component="h2" className="profile-username">
                  {user.username}
                </Typography>

                <Chip
                  size="small"
                  color={isModerator ? 'primary' : 'default'}
                  variant={isModerator ? 'filled' : 'outlined'}
                  label={isModerator ? 'Administrador' : 'Usuario'}
                />

                {isOwner && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditRoundedIcon />}
                    onClick={startEditing}
                    sx={{ ml: { sm: 'auto' } }}
                  >
                    Editar perfil
                  </Button>
                )}
              </div>

              <Typography className="profile-description" color={user.description ? 'text.primary' : 'text.secondary'}>
                {user.description || 'Sin descripción.'}
              </Typography>
            </>
          )}
        </div>
      </Paper>

      <section className="profile-stats">
        {stats.map((stat) => (
          <Paper variant="outlined" className="profile-stat" key={stat.label}>
            <Typography component="span" className="stat-value" color="primary">
              {stat.value}
            </Typography>
            <Typography component="span" variant="body2" color="text.secondary">
              {stat.label}
            </Typography>
          </Paper>
        ))}
      </section>

      <section className="profile-memes">
        <Typography variant="h3" component="h3" className="section-title">
          {isOwner
            ? 'Mis memes'
            : `Memes de ${user.username}`}
        </Typography>
        {deleteError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {deleteError}
          </Alert>
        )}

        {userMemes.length === 0 ? (
          <Paper variant="outlined" sx={{ borderRadius: 4 }}>
            <EmptyState
              icon="🖼️"
              title={isOwner
                ? 'Aún no has publicado memes.'
                : 'Este usuario aún no tiene memes disponibles.'}
              action={isOwner && (
                <Button component={Link} to="/subir" variant="contained">
                  Subir mi primer meme
                </Button>
              )}
            />
          </Paper>
        ) : (
          <div className="memes-grid">
            {userMemes.map((meme) => (
              <Card className="profile-meme-card" key={meme.id}>
                <CardMedia
                  component="img"
                  image={meme.imageUrl}
                  alt={meme.title}
                  sx={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
                />

                <CardContent sx={{ pb: 1 }}>
                  <Typography sx={{ fontWeight: 600 }} noWrap title={meme.title}>
                    {meme.title}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    {(isOwner || viewerIsModerator) && (
                      <Chip size="small" color={statusColors[meme.status]} label={statusLabels[meme.status]} />
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Score: {meme.score}
                    </Typography>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {meme.likes} likes · {meme.dislikes} dislikes
                  </Typography>
                </CardContent>

                {isOwner && (
                  <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteOutlineRoundedIcon />}
                      onClick={() => setMemeToDelete(meme)}
                      disabled={deletingId !== null}
                    >
                      Eliminar meme
                    </Button>
                  </CardActions>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={memeToDelete !== null}
        title="¿Eliminar este meme?"
        message={memeToDelete ? `"${memeToDelete.title}" se eliminará.\nEsta acción no se puede deshacer.` : ''}
        confirmLabel="Eliminar"
        color="error"
        loading={deletingId !== null}
        onConfirm={() => memeToDelete && void handleDeleteMeme(memeToDelete)}
        onClose={() => setMemeToDelete(null)}
      />
    </div>
  );
}
