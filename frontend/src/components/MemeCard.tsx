
import { Link } from 'react-router-dom';
import type { Meme } from '../types';
import './MemeCard.css';

interface MemeCardProps {
  meme: Meme;
}

const MemeCard = ({ meme }: MemeCardProps) => {
  const authorName =
    typeof meme.author === 'string'
      ? meme.author
      : meme.author.username;

  const authorId =
    typeof meme.author === 'string'
      ? null
      : meme.author.id;

  return (
    <article className="meme-card">
      <img
        src={meme.imageUrl}
        alt={meme.title}
        className="meme-card-image"
      />

      <div className="meme-card-body">
        <h3>{meme.title}</h3>

        <p className="meme-card-author">
          Por{' '}
          {authorId ? (
            <Link
              to={`/perfil/${authorId}`}
              className="meme-author-link"
            >
              {authorName}
            </Link>
          ) : (
            authorName
          )}
        </p>

        <div className="meme-card-stats">
          <span>👍 {meme.likes}</span>
          <span>👎 {meme.dislikes}</span>
        </div>
      </div>
    </article>
  );
};

export default MemeCard;
