
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Typography } from '@mui/material';
import { getApprovedMemes } from '../api/meme';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { MemeFeed } from './MemeDetailView';
import type { Meme } from '../types';
import './HomeViewStyle.css';

export function HomeView() {
  const [approvedMemes, setApprovedMemes] = useState<Meme[]>([]);
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
        <LoadingState message="Cargando momazos…" />
      </div>
    );
  }


  return (
    <div className="home-container">
      <h2 className="home-decoration">────୨ৎ────</h2>
      <Typography variant="h1" component="h3" className="home-title">
        ¡Bienvenido!
      </Typography>
      {approvedMemes.length === 0 ? (
        <EmptyState
          icon="🐸"
          title="Todavía no hay momos aprobados."
          description="Sé el primero en compartir uno."
          action={
            <Button component={Link} to="/subir" variant="contained">
              Subir meme
            </Button>
          }
        />
      ) : (
        <MemeFeed memes={approvedMemes} />
      )}
    </div>
  );
}