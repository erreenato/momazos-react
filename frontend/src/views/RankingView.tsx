import { useState } from 'react';
import { mockMemes, mockUsers } from '../mockData';
import './RankingView.css';

export function RankingView() {
  const [tab, setTab] = useState<'memes' | 'users'>('memes');

  // 1. Filtrar solo aprobados, ordenar de mayor a menor y tomar 10
  const topMemes = [...mockMemes]
    .filter((meme) => meme.status === 'approved')
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const topUsers = [...mockUsers]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // Helper para obtener el username de forma segura
  const getAuthorName = (author: typeof mockMemes[0]['author']) => {
    return typeof author === 'string' ? author : author.username;
  };

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

      {/* --- TAB MEMES --- */}
      {tab === 'memes' && (
        <div className="ranking-table">
          <div className="table-header meme-grid">
            <span>Lugar</span>
            <span>Título</span>
            <span>Autor</span>
            <span style={{ textAlign: 'right' }}>Puntaje</span>
          </div>

          <ul className="ranking-list">
            {topMemes.map((meme, index) => (
              <li key={meme.id} className="ranking-item meme-grid">
                <strong className="ranking-position">#{index + 1}</strong>
                <span className="truncate">{meme.title}</span>
                <span className="author-name">{getAuthorName(meme.author)}</span>
                <span className="score-cell">{meme.score} pts</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- TAB USUARIOS --- */}
      {tab === 'users' && (
        <div className="ranking-table">
          <div className="table-header user-grid">
            <span>Lugar</span>
            <span>Usuario</span>
            <span style={{ textAlign: 'right' }}>Puntaje</span>
          </div>

          <ul className="ranking-list">
            {topUsers.map((user, index) => (
              <li key={user.id} className="ranking-item user-grid">
                <strong className="ranking-position">#{index + 1}</strong>
                <span>{user.username}</span>
                <span className="score-cell">{user.score} pts</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}