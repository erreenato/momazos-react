import { useState } from 'react';
import { mockMemes } from '../mockData';
import './HomeViewStyle.css';

function MemeCard({ meme }: { meme: typeof mockMemes[0] }) {

  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);

  const handleLike = () => {
    setUserVote(prev => (prev === 'like' ? null : 'like'));
  };

  const handleDislike = () => {
    setUserVote(prev => (prev === 'dislike' ? null : 'dislike'));
  };

  const likesCount = meme.likes + (userVote === 'like' ? 1 : 0);
  const dislikesCount = meme.dislikes + (userVote === 'dislike' ? 1 : 0);
  const scoreCount = meme.score + (userVote === 'like' ? 1 : userVote === 'dislike' ? -1 : 0);

  return (
    <article className="meme-card">
      <button className="meme-image-button">
        <img src={meme.imageUrl} alt={meme.title} className="meme-image" />
      </button>

      <h4 className="meme-title">{meme.title}</h4>

      <p className="meme-author">
        Por: <strong>@{typeof meme.author === 'string' ? meme.author : meme.author.username}</strong>
      </p>

      <div className="meme-metrics">
        <span className="metric-score">🧠? {scoreCount}</span>

        <button
          className={`btn-metric btn-like ${userVote === 'like' ? 'active' : ''}`}
          onClick={handleLike}
        >
          ❤ {likesCount}
        </button>

        <button
          className={`btn-metric btn-dislike ${userVote === 'dislike' ? 'active' : ''}`}
          onClick={handleDislike}
        >
          ♿ {dislikesCount}
        </button>
      </div>
    </article>
  );
}

export function MemeList() {
  const approvedMemes = mockMemes.filter((meme) => meme.status === 'approved');

  return (
    <div className="meme-grid">
      {approvedMemes.map((meme) => (
        <MemeCard key={meme.id} meme={meme} />
      ))}
    </div>
  );
}

export function HomeView() {
  return (
    <div className="home-container">
      <h2> ────୨ৎ──── </h2>
      <h3 className="home-title">¡Bienvenido!</h3>
      <MemeList />
    </div>
  );
}