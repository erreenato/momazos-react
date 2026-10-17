import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { mockUsers } from '../mockData';
import {
  canViewPrivateMemes,
  getUserById,
  getUserMemes,
} from '../services/profileService.ts';
import type { User, Meme } from '../types';
import './ProfileView.css';

const statusLabels: Record<Meme['status'], string> = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  rejected: 'Rechazado',
};

interface ProfileData {
  id: string;
  user: User | null;
  memes: Meme[];
}

export function ProfileView() {
  const { id } = useParams<{ id: string }>();
  const viewer = mockUsers[0]; // usuario logueado simulado; reemplazar por la auth real
  // Sin parámetro (/perfil) se muestra el perfil del usuario actual.
  const profileId = id ?? viewer.id;

  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const user = await getUserById(profileId);
      const memes = user ? await getUserMemes(profileId) : [];
      if (!cancelled) setData({ id: profileId, user, memes });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const loading = data === null || data.id !== profileId;

  if (loading) {
    return (
      <div className="profile-view">
        <p className="empty">Cargando perfil…</p>
      </div>
    );
  }

  if (data.user === null) {
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
      isOwner={viewer.id === data.user.id}
      canSeeAll={canViewPrivateMemes(viewer, data.user)}
    />
  );
}

interface ProfileContentProps {
  initialUser: User;
  memes: Meme[];
  isOwner: boolean;
  canSeeAll: boolean;
}

function ProfileContent({ initialUser, memes, isOwner, canSeeAll }: ProfileContentProps) {
  const [user, setUser] = useState<User>(initialUser);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    username: initialUser.username,
    description: initialUser.description ?? '',
    avatarUrl: initialUser.avatarUrl ?? '',
  });

  const isModerator = user.role === 'moderator';
  const totalLikes = memes.reduce((total, meme) => total + meme.likes, 0);
  const pendingCount = memes.filter((meme) => meme.status === 'pending').length;

  const stats = [
    { label: 'Puntaje', value: user.score },
    { label: 'Memes', value: memes.length },
    { label: 'Me gusta', value: totalLikes },
    // Los memes en moderación solo son visibles para el dueño o un moderador.
    ...(canSeeAll ? [{ label: 'En moderación', value: pendingCount }] : []),
  ];

  const startEditing = () => {
    setDraft({
      username: user.username,
      description: user.description ?? '',
      avatarUrl: user.avatarUrl ?? '',
    });
    setEditing(true);
  };

  const saveChanges = () => {
    setUser((prev) => ({
      ...prev,
      username: draft.username.trim() || prev.username,
      description: draft.description.trim() || undefined,
      avatarUrl: draft.avatarUrl.trim() || undefined,
    }));
    setEditing(false);
  };

  const showAvatar = editing ? draft.avatarUrl : user.avatarUrl;

  return (
    <div className="profile-view">
      <header className="profile-header">
        {showAvatar ? (
          <img
            className="profile-avatar-image"
            src={showAvatar}
            alt={`Avatar de ${editing ? draft.username : user.username}`}
          />
        ) : (
          <div className="profile-avatar">
            {(editing ? draft.username : user.username).charAt(0).toUpperCase()}
          </div>
        )}

        <div className="profile-info">
          {editing ? (
            <div className="edit-form">
              <label className="field">
                <span className="field-label">Nombre de usuario</span>
                <input
                  value={draft.username}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, username: e.target.value }))
                  }
                />
              </label>

              <label className="field">
                <span className="field-label">Descripción</span>
                <textarea
                  value={draft.description}
                  rows={3}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, description: e.target.value }))
                  }
                />
              </label>

              <label className="field">
                <span className="field-label">URL de la imagen de perfil</span>
                <input
                  placeholder="https://..."
                  value={draft.avatarUrl}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, avatarUrl: e.target.value }))
                  }
                />
              </label>

              <div className="edit-actions">
                <button className="btn btn-primary" onClick={saveChanges}>
                  Guardar
                </button>
                <button className="btn" onClick={() => setEditing(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="profile-title-row">
                <h2 className="profile-username">{user.username}</h2>
                <span
                  className={`profile-role ${
                    isModerator ? 'role-admin' : 'role-user'
                  }`}
                >
                  {isModerator ? 'Administrador' : 'Usuario'}
                </span>
                {isOwner && (
                  <button className="btn btn-edit" onClick={startEditing}>
                    Editar perfil
                  </button>
                )}
              </div>
              <p className="profile-description">
                {user.description ?? 'Sin descripción.'}
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
          {isOwner ? 'Mis memes' : `Memes de ${user.username}`}
        </h3>

        {canSeeAll && !isOwner && (
          <p className="profile-notice">
            Como moderador, ves también los memes pendientes y rechazados de este usuario.
          </p>
        )}

        {memes.length === 0 ? (
          <p className="empty">
            {isOwner
              ? 'Aún no has subido memes.'
              : 'Este usuario aún no tiene memes aprobados.'}
          </p>
        ) : (
          <div className="memes-grid">
            {memes.map((meme) => (
              <article className="profile-meme-card" key={meme.id}>
                <img
                  className="meme-image"
                  src={meme.imageUrl}
                  alt={meme.title}
                />
                <div className="meme-body">
                  {canSeeAll && (
                    <span className={`meme-status status-${meme.status}`}>
                      {statusLabels[meme.status]}
                    </span>
                  )}
                  <p className="meme-title">{meme.title}</p>
                  <p className="meme-score">Score: {meme.score}</p>
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
