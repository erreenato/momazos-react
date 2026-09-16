import type { Meme, User } from '../types';
import './WeeklyRanking.css';

const MEDALS = ['🥇', '🥈', '🥉'];

function authorName(author: User | string): string {
  return typeof author === 'string' ? author : author.username;
}

export function WeeklyRanking({ memes }: { memes: Meme[] }) {
  const ranked = [...memes].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <aside className="weekly-ranking" aria-label="Ranking semanal de memes">
      <div className="weekly-ranking-header">
        <span className="weekly-ranking-fire">🔥</span>
        <div>
          <h3>Ranking semanal</h3>
          <p>Los momos más votados de la semana</p>
        </div>
      </div>

      <ol className="weekly-ranking-list">
        {ranked.map((meme, index) => (
          <li key={meme.id} className="weekly-ranking-item">
            <span className={`weekly-ranking-rank ${index < 3 ? 'top' : ''}`}>
              {index < 3 ? MEDALS[index] : index + 1}
            </span>
            <img className="weekly-ranking-thumb" src={meme.imageUrl} alt="" />
            <div className="weekly-ranking-info">
              <span className="weekly-ranking-title">{meme.title}</span>
              <span className="weekly-ranking-author">{authorName(meme.author)}</span>
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

      <button type="button" className="weekly-ranking-more">
        Ver ranking completo
      </button>
    </aside>
  );
}
