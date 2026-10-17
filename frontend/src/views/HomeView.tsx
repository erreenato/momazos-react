import { useState, useEffect } from 'react';
import { getApprovedMemes } from '../api/meme';
import { MemeFeed } from './MemeDetailView';
import './HomeViewStyle.css';

export function HomeView() {
  const [approvedMemes, setApprovedMemes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getApprovedMemes()
      .then((data) => setApprovedMemes(data))
      .catch((err) => console.error('Error al cargar momos:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="home-container">
        <p className="home-empty">Cargando momazos...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <h2 className="home-decoration">────୨ৎ────</h2>
      <h3 className="home-title">¡Bienvenido!</h3>
      {approvedMemes.length === 0 ? (
        <p className="home-empty">Todavía no hay momos aprobados.</p>
      ) : (
        <MemeFeed memes={approvedMemes} />
      )}
    </div>
  );
}