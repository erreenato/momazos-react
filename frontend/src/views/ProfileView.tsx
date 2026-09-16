import { useState } from 'react';
import { mockUsers, mockMemes } from '../mockData';
import type { User, Meme } from '../types';
import './ProfileView.css';

const statusLabels: Record<Meme['status'], string> = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  rejected: 'Rechazado',
};

export function ProfileView() {
  const initial = mockUsers[0];
  const [user, setUser] = useState<User>(initial);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    username: initial.username,
    description: initial.description ?? '',
    avatarUrl: initial.avatarUrl ?? '',
  });

  const userMemes: Meme[] = mockMemes.filter(
    (meme) => typeof meme.author !== 'string' && meme.author.id === user.id,
  );

  const isModerator = user.role === 'moderator';
  const totalLikes = userMemes.reduce((total, meme) => total + meme.likes, 0);
  const pendingCount = userMemes.filter((meme) => meme.status === 'pending').length;

  const stats = [
    { label: 'Puntaje', value: user.score },
    { label: 'Memes', value: userMemes.length },
    { label: 'Me gusta', value: totalLikes },
    { label: 'En moderación', value: pendingCount },
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
                <button className="btn btn-edit" onClick={startEditing}>
                  Editar perfil
                </button>
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
        <h3 className="section-title">Mis memes</h3>
        {userMemes.length === 0 ? (
          <p className="empty">Este usuario aún no ha subido memes.</p>
        ) : (
          <div className="memes-grid">
            {userMemes.map((meme) => (
              <article className="meme-card" key={meme.id}>
                <img
                  className="meme-image"
                  src={meme.imageUrl}
                  alt={meme.title}
                />
                <div className="meme-body">
                  <span className={`meme-status status-${meme.status}`}>
                    {statusLabels[meme.status]}
                  </span>
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