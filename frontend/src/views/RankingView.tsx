
import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import {
  getBottomMemes,
  getBottomUsers,
  getTopMemes,
  getTopUsers,
} from '../api/meme';
import type { RankingUser } from '../api/meme';
import type { Meme } from '../types';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import './RankingView.css';

type RankingVariant = 'top' | 'anti';
type RankingTab = 'memes' | 'users';

const VARIANT_CONFIG: Record<
  RankingVariant,
  { emoji: string; title: string; subtitle: string; positionLabel: string }
> = {
  top: {
    emoji: '🏆',
    title: 'Ranking',
    subtitle: 'Los momos y usuarios mejor puntuados',
    positionLabel: 'Lugar',
  },
  anti: {
    emoji: '💀',
    title: 'Anti-Ranking',
    subtitle: 'Los momos y usuarios con peor puntaje',
    positionLabel: 'Peor',
  },
};

function getAuthorName(author: Meme['author']): string {
  if (!author) return 'Anónimo';
  if (typeof author === 'string') return author;
  return author.username ?? 'Anónimo';
}

/** Celda de puntaje: en rojo si es negativo. */
function ScoreCell({ score }: { score: number }) {
  return (
    <TableCell align="right" sx={{ fontWeight: 700, color: score < 0 ? 'error.main' : 'text.primary', whiteSpace: 'nowrap' }}>
      {score} pts
    </TableCell>
  );
}

function PositionCell({ index }: { index: number }) {
  return (
    <TableCell align="center" sx={{ fontWeight: 700, color: 'primary.main', width: 64 }}>
      #{index + 1}
    </TableCell>
  );
}

function RankingBoard({ variant }: { variant: RankingVariant }) {
  const [tab, setTab] = useState<RankingTab>('memes');
  const [memes, setMemes] = useState<Meme[]>([]);
  const [users, setUsers] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = VARIANT_CONFIG[variant];

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    const load =
      variant === 'top'
        ? Promise.all([getTopMemes(), getTopUsers()])
        : Promise.all([getBottomMemes(), getBottomUsers()]);

    load
      .then(([memesData, usersData]) => {
        if (cancelled) return;

        setMemes(memesData);
        setUsers(usersData);
      })
      .catch((err) => {
        if (cancelled) return;

        console.error(
          `Error al cargar ${variant === 'top' ? 'ranking' : 'anti-ranking'}:`,
          err
        );
        setError('No se pudo cargar la tabla. Intenta de nuevo más tarde.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [variant]);

  return (
    <Paper
      variant="outlined"
      className={`ranking-container${variant === 'anti' ? ' ranking-container--inverted' : ''}`}
      sx={{ borderRadius: 5, p: { xs: 2, sm: 3 } }}
    >
      <Box
        component="header"
        sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box component="span" aria-hidden="true" sx={{ fontSize: 28, lineHeight: 1 }}>
            {config.emoji}
          </Box>
          <div>
            <Typography variant="h2" component="h2" sx={{ m: 0 }}>
              {config.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {config.subtitle}
            </Typography>
          </div>
        </Box>

        <Tabs value={tab} onChange={(_, value: RankingTab) => setTab(value)} aria-label="Tipo de ranking">
          <Tab value="memes" label="Momos" />
          <Tab value="users" label="Usuarios" />
        </Tabs>
      </Box>

      <Box sx={{ mt: 2 }}>
        {loading ? (
          <LoadingState message={`Cargando ${config.title.toLowerCase()}…`} />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : tab === 'memes' ? (
          memes.length === 0 ? (
            <EmptyState icon="🖼️" title="Todavía no hay momos para mostrar." />
          ) : (
            <TableContainer>
              <Table size="small" aria-label="Ranking de momos">
                <TableHead>
                  <TableRow>
                    <TableCell align="center">{config.positionLabel}</TableCell>
                    <TableCell>Título</TableCell>
                    {/* El autor se oculta en móvil para que la tabla no se desborde */}
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Autor</TableCell>
                    <TableCell align="right">Puntaje</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {memes.map((meme, index) => (
                    <TableRow key={meme.id} hover>
                      <PositionCell index={index} />
                      <TableCell sx={{ maxWidth: 0, width: '100%' }}>
                        <Typography noWrap title={meme.title} sx={{ fontWeight: 600, fontSize: 14 }}>
                          {meme.title}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {getAuthorName(meme.author)}
                      </TableCell>
                      <ScoreCell score={meme.score} />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        ) : users.length === 0 ? (
          <EmptyState icon="👤" title="Todavía no hay usuarios para mostrar." />
        ) : (
          <TableContainer>
            <Table size="small" aria-label="Ranking de usuarios">
              <TableHead>
                <TableRow>
                  <TableCell align="center">{config.positionLabel}</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell align="right">Puntaje</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={user._id} hover>
                    <PositionCell index={index} />
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, fontWeight: 600 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 13, bgcolor: 'primary.main' }}>
                          {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                        {user.username}
                      </Box>
                    </TableCell>
                    <ScoreCell score={user.score} />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Paper>
  );
}

export function RankingView() {
  return <RankingBoard variant="top" />;
}

export function AntiRankingView() {
  return <RankingBoard variant="anti" />;
}
