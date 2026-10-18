
import { useEffect, useState } from 'react';
import {
  getBottomMemes,
  getBottomUsers,
  getTopMemes,
  getTopUsers,
} from '../api/meme';
import type { RankingUser } from '../api/meme';
import type { Meme } from '../types';
import './RankingView.css';

type RankingVariant = 'top' | 'anti';
type RankingTab = 'memes' | 'users';

const VARIANT_CONFIG: Record<
  RankingVariant,
  { emoji: string; title: string; subtitle: string; positionLabel: string }
> = {
  top: {
    emoji: '🏆',
    title: 'Ranking',
    subtitle: 'Los momos y usuarios mejor puntuados',
    positionLabel: 'Lugar',
  },
  anti: {
    emoji: '💀',
    title: 'Anti-Ranking',
    subtitle: 'Los momos y usuarios con peor puntaje',
    positionLabel: 'Peor',
  },
};

function getAuthorName(author: Meme['author']): string {
  if (!author) return 'Anónimo';
  if (typeof author === 'string') return author;
  return author.username ?? 'Anónimo';
}

function RankingBoard({ variant }: { variant: RankingVariant }) {
  const [tab, setTab] = useState<RankingTab>('memes');
  const [memes, setMemes] = useState<Meme[]>([]);
  const [users, setUsers] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = VARIANT_CONFIG[variant];

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    const load =
      variant === 'top'
        ? Promise.all([getTopMemes(), getTopUsers()])
        : Promise.all([getBottomMemes(), getBottomUsers()]);

    load
      .then(([memesData, usersData]) => {
        if (cancelled) return;

        setMemes(memesData);
        setUsers(usersData);
      })
      .catch((err) => {
        if (cancelled) return;

        console.error(
          `Error al cargar ${variant === 'top' ? 'ranking' : 'anti-ranking'}:`,
          err
        );
        setError('No se pudo cargar la tabla. Intenta de nuevo más tarde.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [variant]);

  return (
    <div
      className={`ranking-container${variant === 'anti' ? ' ranking-container--inverted' : ''
        }`}
    >
      <header className="ranking-header">
        <div className="ranking-heading">
          <span className="ranking-emoji" aria-hidden="true">
            {config.emoji}
          </span>

          <div>
            <h2>{config.title}</h2>
            <p className="ranking-subtitle">{config.subtitle}</p>
          </div>
        </div>

        <div className="ranking-tabs">
          <button
            type="button"
            className={`tab-button ${tab === 'memes' ? 'active' : ''}`}
            onClick={() => setTab('memes')}
          >
            Momos
          </button>

          <button
            type="button"
            className={`tab-button ${tab === 'users' ? 'active' : ''}`}
            onClick={() => setTab('users')}
          >
            Usuarios
          </button>
        </div>
      </header>

      {loading ? (
        <p className="ranking-status">
          Cargando {config.title.toLowerCase()}...
        </p>
      ) : error ? (
        <p className="ranking-status ranking-status--error" role="alert">
          {error}
        </p>
      ) : (
        <div className="ranking-table">
          {tab === 'memes' ? (
            <>
              <div className="table-header meme-grid">
                <span>{config.positionLabel}</span>
                <span>Título</span>
                <span>Autor</span>
                <span className="score-cell">Puntaje</span>
              </div>

              <ul className="ranking-list">
                {memes.length === 0 ? (
                  <li className="ranking-empty">
                    Todavía no hay momos para mostrar.
                  </li>
                ) : (
                  memes.map((meme, index) => (
                    <li key={meme.id} className="ranking-item meme-grid">
                      <strong className="ranking-position">
                        #{index + 1}
                      </strong>

                      <span className="truncate" title={meme.title}>
                        {meme.title}
                      </span>

                      <span className="author-name">
                        {getAuthorName(meme.author)}
                      </span>

                      <span
                        className={`score-cell${meme.score < 0 ? ' score-negative' : ''
                          }`}
                      >
                        {meme.score} pts
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </>
          ) : (
            <>
              <div className="table-header user-grid">
                <span>{config.positionLabel}</span>
                <span>Usuario</span>
                <span className="score-cell">Puntaje</span>
              </div>

              <ul className="ranking-list">
                {users.length === 0 ? (
                  <li className="ranking-empty">
                    Todavía no hay usuarios para mostrar.
                  </li>
                ) : (
                  users.map((user, index) => (
                    <li key={user._id} className="ranking-item user-grid">
                      <strong className="ranking-position">
                        #{index + 1}
                      </strong>

                      <span className="ranking-user">
                        <span
                          className="ranking-user-avatar"
                          aria-hidden="true"
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                        {user.username}
                      </span>

                      <span
                        className={`score-cell${user.score < 0 ? ' score-negative' : ''
                          }`}
                      >
                        {user.score} pts
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function RankingView() {
  return <RankingBoard variant="top" />;
}

export function AntiRankingView() {
  return <RankingBoard variant="anti" />;
}
