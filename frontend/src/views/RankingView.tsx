
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
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
  useMediaQuery,
} from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import {
  RankingTransition,
  TRANSITION_SWAP_MS,
  TRANSITION_TOTAL_MS,
} from '../components/RankingTransition';
import type { RankingTransitionKind } from '../components/RankingTransition';
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

interface RankingBoardProps {
  variant: RankingVariant;
  /** Cambia al otro ranking (lo maneja RankingView, que también lanza la transición). */
  onToggle: () => void;
  /** true mientras corre la transición: deshabilita el botón. */
  toggling: boolean;
  /** true durante los rayos: hace temblar la tabla. */
  shaking: boolean;
}

function RankingBoard({ variant, onToggle, toggling, shaking }: RankingBoardProps) {
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
      className={`ranking-container${variant === 'anti' ? ' ranking-container--inverted' : ''}${shaking ? ' rt-shake' : ''}`}
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

        {/* Botón para cambiar entre Ranking y Anti-Ranking (con transición de rayos / arcoíris).
            Recuerda que el Anti-Ranking invierte los colores: este botón se ve "al revés" ahí. */}
        <Button
          variant="contained"
          className="ranking-toggle"
          color={variant === 'top' ? 'error' : 'primary'}
          onClick={onToggle}
          disabled={toggling}
          startIcon={variant === 'top' ? <BoltRoundedIcon /> : <span aria-hidden="true">🌈</span>}
          sx={{ ml: { sm: 'auto' } }}
        >
          {variant === 'top' ? 'Ver Anti-Ranking' : 'Volver al Ranking'}
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, value: RankingTab) => setTab(value)} aria-label="Tipo de ranking" sx={{ mt: 1.5 }}>
        <Tab value="memes" label="Momos" />
        <Tab value="users" label="Usuarios" />
      </Tabs>

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

/**
 * Ranking y Anti-Ranking en una sola vista. La variante sale de la URL
 * (/ranking o /anti-ranking), así ambos siguen teniendo un enlace propio.
 *
 * Al cambiar con el botón se lanza una transición a pantalla completa:
 * rayos al ir al Anti-Ranking y arcoíris al volver al Ranking. La navegación
 * ocurre a mitad de la animación, cuando la pantalla está cubierta.
 */
export function RankingView() {
  const location = useLocation();
  const navigate = useNavigate();
  const variant: RankingVariant = location.pathname.startsWith('/anti-ranking') ? 'anti' : 'top';
  const [transition, setTransition] = useState<RankingTransitionKind | null>(null);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const timers = useRef<number[]>([]);

  // Limpia los temporizadores si el usuario sale de la vista a mitad de la animación.
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const toggleVariant = () => {
    const target = variant === 'top' ? '/anti-ranking' : '/ranking';
    if (prefersReducedMotion) {
      navigate(target);
      return;
    }
    setTransition(variant === 'top' ? 'lightning' : 'rainbow');
    timers.current = [
      window.setTimeout(() => navigate(target), TRANSITION_SWAP_MS),
      window.setTimeout(() => setTransition(null), TRANSITION_TOTAL_MS),
    ];
  };

  return (
    <>
      <RankingBoard
        variant={variant}
        onToggle={toggleVariant}
        toggling={transition !== null}
        shaking={transition === 'lightning'}
      />
      <RankingTransition kind={transition} />
    </>
  );
}

/**
 * Se exporta con otro nombre para la ruta /anti-ranking, pero es el mismo componente:
 * así React no lo desmonta al cambiar de ruta y la transición no se corta.
 */
export const AntiRankingView = RankingView;
