
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import ArrowDropUpRoundedIcon from '@mui/icons-material/ArrowDropUpRounded';
import { getTopMemes } from '../api/meme';
import type { Meme, User } from '../types';
import { EmptyState } from './ui/EmptyState';
import { LoadingState } from './ui/LoadingState';
import './WeeklyRanking.css';

const MEDALS = ['🥇', '🥈', '🥉'];

function authorName(author: User | string): string {
  return typeof author === 'string' ? author : author.username;
}

export function WeeklyRanking({ memes }: { memes?: Meme[] }) {
  const [loaded, setLoaded] = useState<Meme[]>(memes ?? []);
  const [loading, setLoading] = useState(memes === undefined);
  const navigate = useNavigate();

  useEffect(() => {
    if (memes !== undefined) {
      setLoaded(memes);
      setLoading(false);
      return;
    }

    let cancelled = false;

    getTopMemes()
      .then((data) => {
        if (!cancelled) setLoaded(data);
      })
      .catch((error) => {
        console.error('Error al cargar ranking lateral:', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [memes]);

  const ranked = [...loaded]
    .filter((meme) => meme.status === 'approved')
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <Card component="aside" className="weekly-ranking" aria-label="Ranking semanal de memes" sx={{ bgcolor: 'background.default' }}>
      <CardHeader
        avatar={<span aria-hidden="true" style={{ fontSize: 22 }}>🔥</span>}
        title="Ranking semanal"
        subheader="Los momos más votados de la semana"
        slotProps={{
          title: { variant: 'subtitle1', fontWeight: 700 },
          subheader: { variant: 'caption' },
        }}
        sx={{ pb: 0 }}
      />

      <CardContent sx={{ pt: 1 }}>
        {loading ? (
          <LoadingState compact message="Cargando ranking…" />
        ) : ranked.length === 0 ? (
          <EmptyState compact icon="🏁" title="Aún no hay memes puntuados." />
        ) : (
          <List dense disablePadding>
            {ranked.map((meme, index) => (
              <ListItemButton
                key={meme.id}
                onClick={() => navigate(`/meme/${meme.id}`)}
                sx={{ borderRadius: 2, gap: 1, px: 1 }}
              >
                <Typography
                  component="span"
                  sx={{ width: 22, textAlign: 'center', fontWeight: 700, fontSize: index < 3 ? 17 : 13, color: 'text.secondary' }}
                >
                  {index < 3 ? MEDALS[index] : index + 1}
                </Typography>

                <ListItemAvatar sx={{ minWidth: 0 }}>
                  <Avatar variant="rounded" src={meme.imageUrl} alt="" sx={{ width: 42, height: 42 }} />
                </ListItemAvatar>

                <ListItemText
                  primary={meme.title}
                  secondary={authorName(meme.author)}
                  slotProps={{
                    primary: { noWrap: true, sx: { fontWeight: 600, fontSize: 13 } },
                    secondary: { sx: { fontSize: 11.5 } },
                  }}
                  sx={{ minWidth: 0 }}
                />

                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  icon={<ArrowDropUpRoundedIcon />}
                  label={meme.score}
                />
              </ListItemButton>
            ))}
          </List>
        )}

        <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/ranking')}>
          Ver ranking completo
        </Button>
      </CardContent>
    </Card>
  );
}
