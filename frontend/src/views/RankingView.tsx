import { useState } from 'react';
import { mockMemes, mockUsers } from '../mockData';
import './RankingView.css'; // <-- Importas tu hoja de estilo aquí

export function RankingView() {
  const [tab, setTab] = useState<'memes' | 'users'>('memes');

  const topMemes = [...mockMemes].sort((a, b) => b.score - a.score).slice(0, 10);
  const topUsers = [...mockUsers].sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <div className="ranking-container">
      <h2>🏆 Ranking</h2>

      <div className="ranking-tabs">
        <button 
          className={`tab-button ${tab === 'memes' ? 'active' : ''}`}
          onClick={() => setTab('memes')}
        >
          Top Memes
        </button>
        <button 
          className={`tab-button ${tab === 'users' ? 'active' : ''}`}
          onClick={() => setTab('users')}
        >
          Top Usuarios
        </button>
      </div>

      {tab === 'memes' && (
        <ul className="ranking-list">
          {topMemes.map((meme, index) => (
            <li key={meme.id} className="ranking-item">
              <span><strong className="ranking-position">#{index + 1}</strong> {meme.title}</span>
              <span>{meme.score} pts</span>
            </li>
          ))}
        </ul>
      )}

      {tab === 'users' && (
        <ul className="ranking-list">
          {topUsers.map((user, index) => (
            <li key={user.id} className="ranking-item">
              <span><strong className="ranking-position">#{index + 1}</strong> {user.username}</span>
              <span>{user.score} pts</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}