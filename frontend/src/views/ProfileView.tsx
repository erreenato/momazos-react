
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import {
  getUserById,
  getUserMemes,
  updateMyProfile,
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
        <p className="empty">Cargando perfil…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-view">
        <p className="empty" role="alert">{error}</p>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="profile-view">
        <p className="empty">No encontramos a este usuario.</p>
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

  const [draft, setDraft] = useState({
    description: initialUser.description ?? '',
    avatarUrl: initialUser.avatarUrl ?? '',
  });

  const isModerator = user.role === 'moderator';

  const approvedMemes = memes.filter(
    (meme) => meme.status === 'approved',
  );

  const totalLikes = memes.reduce(
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

  const showAvatar = editing ? draft.avatarUrl : user.avatarUrl;

  return (
    <div className="profile-view">
      <header className="profile-header">
        {showAvatar ? (
          <img
            className="profile-avatar-image"
            src={showAvatar}
            alt={`Avatar de ${user.username}`}
          />
        ) : (
          <div className="profile-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="profile-info">
          {editing ? (
            <div className="edit-form">
              <label className="field">
                <span className="field-label">Descripción</span>
                <textarea
                  value={draft.description}
                  rows={3}
                  maxLength={500}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      description: e.target.value,
                    }))
                  }
                />
              </label>

              <label className="field">
                <span className="field-label">
                  URL de la imagen de perfil
                </span>
                <input
                  type="url"
                  placeholder="https://..."
                  value={draft.avatarUrl}
                  maxLength={2048}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      avatarUrl: e.target.value,
                    }))
                  }
                />
              </label>

              {saveError && (
                <p className="empty" role="alert">{saveError}</p>
              )}

              <div className="edit-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void saveChanges()}
                  disabled={saving}
                >
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="profile-title-row">
                <h2 className="profile-username">
                  {user.username}
                </h2>

                <span
                  className={`profile-role ${isModerator ? 'role-admin' : 'role-user'
                    }`}
                >
                  {isModerator ? 'Administrador' : 'Usuario'}
                </span>

                {isOwner && (
                  <button
                    type="button"
                    className="btn btn-edit"
                    onClick={startEditing}
                  >
                    Editar perfil
                  </button>
                )}
              </div>

              <p className="profile-description">
                {user.description || 'Sin descripción.'}
              </p>
            </>
          )}
        </div>
      </header>

      <section className="profile-stats">
        {stats.map((stat) => (
          <div className="profile-stat" key={stat.label}>
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="profile-memes">
        <h3 className="section-title">
          {isOwner
            ? 'Mis memes'
            : `Memes de ${user.username}`}
        </h3>

        {memes.length === 0 ? (
          <p className="empty">
            {isOwner
              ? 'Aún no has publicado memes.'
              : 'Este usuario aún no tiene memes disponibles.'}
          </p>
        ) : (
          <div className="memes-grid">
            {memes.map((meme) => (
              <article
                className="profile-meme-card"
                key={meme.id}
              >
                <img
                  className="meme-image"
                  src={meme.imageUrl}
                  alt={meme.title}
                />

                <div className="meme-body">
                  <p className="meme-title">{meme.title}</p>

                  {(isOwner || viewerIsModerator) && (
                    <span className={`meme-status status-${meme.status}`}>
                      {statusLabels[meme.status]}
                    </span>
                  )}


                  <p className="meme-score">
                    Score: {meme.score}
                  </p>
                  <p className="meme-likes">
                    {meme.likes} likes · {meme.dislikes} dislikes
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
