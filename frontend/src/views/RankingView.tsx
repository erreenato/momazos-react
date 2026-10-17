import { useState, useEffect } from 'react';
import { getTopMemes, getTopUsers } from '../api/meme'; // Ajusta la ruta a tu API
import './RankingView.css';

export function RankingView() {
  const [tab, setTab] = useState<'memes' | 'users'>('memes');
  const [topMemes, setTopMemes] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getTopMemes(), getTopUsers()])
      .then(([memesData, usersData]) => {
        setTopMemes(memesData);
        setTopUsers(usersData);
      })
      .catch((err) => console.error('Error al cargar rankings:', err))
      .finally(() => setLoading(false));
  }, []);

  // Helper para obtener el username de forma segura
  const getAuthorName = (author: any) => {
    if (!author) return 'Anónimo';
    if (typeof author === 'string') return author;
    return author.username ?? 'Anónimo';
  };

  if (loading) {
    return (
      <div className="ranking-container">
        <h2>🏆 Ranking</h2>
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>Cargando mejores momazos...</p>
      </div>
    );
  }

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
              <li key={meme._id || meme.id} className="ranking-item meme-grid">
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
              <li key={user._id || user.id} className="ranking-item user-grid">
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