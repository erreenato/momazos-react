
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopMemes } from '../api/meme';
import type { Meme, User } from '../types';
import './WeeklyRanking.css';

const MEDALS = ['🥇', '🥈', '🥉'];

function authorName(author: User | string): string {
  return typeof author === 'string' ? author : author.username;
}

export function WeeklyRanking({ memes }: { memes?: Meme[] }) {
  const [loaded, setLoaded] = useState<Meme[]>(memes ?? []);
  const [loading, setLoading] = useState(memes === undefined);
  const navigate = useNavigate();

  useEffect(() => {
    if (memes !== undefined) {
      setLoaded(memes);
      setLoading(false);
      return;
    }

    let cancelled = false;

    getTopMemes()
      .then((data) => {
        if (!cancelled) setLoaded(data);
      })
      .catch((error) => {
        console.error('Error al cargar ranking lateral:', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [memes]);

  const ranked = [...loaded]
    .filter((meme) => meme.status === 'approved')
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <aside className="weekly-ranking" aria-label="Ranking semanal de memes">
      <div className="weekly-ranking-header">
        <span className="weekly-ranking-fire">🔥</span>
        <div>
          <h3>Ranking semanal</h3>
          <p>Los momos más votados de la semana</p>
        </div>
      </div>

      {loading ? (
        <p className="weekly-ranking-empty">Cargando ranking...</p>
      ) : ranked.length === 0 ? (
        <p className="weekly-ranking-empty">Aún no hay memes puntuados.</p>
      ) : (
        <ol className="weekly-ranking-list">
          {ranked.map((meme, index) => (
            <li
              key={meme.id}
              className="weekly-ranking-item"
              onClick={() => navigate(`/meme/${meme.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  navigate(`/meme/${meme.id}`);
                }
              }}
            >
              <span className={`weekly-ranking-rank ${index < 3 ? 'top' : ''}`}>
                {index < 3 ? MEDALS[index] : index + 1}
              </span>

              <img
                className="weekly-ranking-thumb"
                src={meme.imageUrl}
                alt=""
              />

              <div className="weekly-ranking-info">
                <span className="weekly-ranking-title">{meme.title}</span>
                <span className="weekly-ranking-author">
                  {authorName(meme.author)}
                </span>
              </div>

              <span className="weekly-ranking-score">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4 3 18h18L12 4z" />
                </svg>
                {meme.score}
              </span>
            </li>
          ))}
        </ol>
      )}

      <button
        type="button"
        className="weekly-ranking-more"
        onClick={() => navigate('/ranking')}
      >
        Ver ranking completo
      </button>
    </aside>
  );
}
