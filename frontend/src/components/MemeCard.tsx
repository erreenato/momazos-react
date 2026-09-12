import type { Meme } from '../types';
import './MemeCard.css';

interface MemeCardProps {
  meme: Meme;
}

const MemeCard = ({ meme }: MemeCardProps) => {
  // author puede venir como User completo o como string (id/nombre)
  const authorName = typeof meme.author === 'string' ? meme.author : meme.author.username;

  return (
    <article className="meme-card">
      <img src={meme.imageUrl} alt={meme.title} className="meme-card-image" />
      <div className="meme-card-body">
        <h3>{meme.title}</h3>
        <p className="meme-card-author">Por {authorName}</p>
        <div className="meme-card-stats">
          <span>👍 {meme.likes}</span>
          <span>👎 {meme.dislikes}</span>
        </div>
      </div>
    </article>
  );
};

export default MemeCard;