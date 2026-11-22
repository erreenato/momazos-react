import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Box, Button, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { MemeFeed } from './MemeDetailView';
import { useFeed, useMemeStore, type FeedSort } from '../stores/memeStore';
import './HomeViewStyle.css';

export function HomeView() {
  const { memes, loaded, error, sort } = useFeed();
  const fetchFeed = useMemeStore((state) => state.fetchFeed);
  const setFeedSort = useMemeStore((state) => state.setFeedSort);
  const generation = useMemeStore((state) => state.generation);

  // Siempre se vuelve a pedir el feed al entrar; si ya había memes en memoria se
  // muestran mientras tanto, sin pantalla de carga.
  useEffect(() => {
    void fetchFeed();
  }, [fetchFeed, generation]);

  if (!loaded && !error) {
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

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => void fetchFeed()}>
              Reintentar
            </Button>
          }
        >
          {error.message}
        </Alert>
      )}

      {memes.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            color="primary"
            value={sort}
            onChange={(_, value: FeedSort | null) => value && setFeedSort(value)}
            aria-label="Ordenar memes"
          >
            <ToggleButton value="recent">Recientes</ToggleButton>
            <ToggleButton value="top">Más votados</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {memes.length === 0 ? (
        !error && (
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
        )
      ) : (
        // La key fuerza a rearmar el orden del feed al cambiar el filtro.
        <MemeFeed key={sort} memes={memes} />
      )}
    </div>
  );
}
