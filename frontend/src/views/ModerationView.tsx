import { useEffect, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    Chip,
    Paper,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { apiFetch } from '../api/client';
import type { Meme } from '../types';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import './ModerationView.css';

type ModerationDecision = 'approved' | 'rejected';

function authorOf(meme: Meme): string {
    return typeof meme.author === 'string' ? meme.author : meme.author.username;
}

export function ModerationView() {
    // Memes pendientes que entrega el backend (solo moderadores).
    const [pendingMemes, setPendingMemes] = useState<Meme[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Guarda el último mensaje de acción para dar feedback visual (Snackbar).
    const [message, setMessage] = useState<{ text: string; severity: 'success' | 'error' } | null>(null);
    // Meme que se está actualizando, para deshabilitar sus botones.
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    // Meme que se quiere rechazar: abre el diálogo de confirmación.
    const [memeToReject, setMemeToReject] = useState<Meme | null>(null);

    useEffect(() => {
        apiFetch<Meme[]>('/moderation/memes')
            .then(setPendingMemes)
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'No se pudieron cargar los memes.');
            })
            .finally(() => setLoading(false));
    }, []);

    const moderateMeme = async (memeId: string, status: ModerationDecision) => {
        setUpdatingId(memeId);
        setMessage(null);
        try {
            await apiFetch<Meme>(`/memes/${memeId}/status`, {
                method: 'PATCH',
                body: { status },
            });
            setPendingMemes((currentMemes) =>
                currentMemes.filter((meme) => meme.id !== memeId)
            );
            setMessage({
                severity: 'success',
                text: status === 'approved'
                    ? 'Meme aprobado correctamente.'
                    : 'Meme rechazado correctamente.',
            });
        } catch (err) {
            setMessage({
                severity: 'error',
                text: err instanceof Error ? err.message : 'No se pudo moderar el meme.',
            });
        } finally {
            setUpdatingId(null);
        }
    };

    const confirmReject = async () => {
        if (!memeToReject) return;
        await moderateMeme(memeToReject.id, 'rejected');
        setMemeToReject(null);
    };

    /** Botones Aprobar / Rechazar, compartidos por la tabla (escritorio) y las tarjetas (móvil). */
    const renderActions = (meme: Meme, direction: 'row' | 'column' = 'row') => (
        <Stack direction={direction} spacing={1} sx={{ justifyContent: 'flex-end', alignItems: 'stretch' }}>
            <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckRoundedIcon />}
                loading={updatingId === meme.id && memeToReject === null}
                disabled={updatingId === meme.id}
                onClick={() => moderateMeme(meme.id, 'approved')}
            >
                Aprobar
            </Button>
            <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<CloseRoundedIcon />}
                disabled={updatingId === meme.id}
                onClick={() => setMemeToReject(meme)}
            >
                Rechazar
            </Button>
        </Stack>
    );

    return (
        <main className="moderation-view">
            <header className="moderation-header">
                <Typography variant="h1" component="h1">
                    Moderación
                </Typography>
                <Typography color="text.secondary">
                    Revisa los memes pendientes y decide si se aprueban o se rechazan.
                </Typography>
            </header>

            {loading ? (
                <LoadingState message="Cargando memes pendientes…" />
            ) : error !== null ? (
                <Alert severity="error">{error}</Alert>
            ) : pendingMemes.length === 0 ? (
                <Paper variant="outlined" sx={{ borderRadius: 5 }}>
                    <EmptyState icon="✅" title="No hay memes pendientes por moderar." description="¡Todo al día!" />
                </Paper>
            ) : (
                <>
                    <Chip
                        color="warning"
                        variant="outlined"
                        label={`${pendingMemes.length} pendiente${pendingMemes.length === 1 ? '' : 's'}`}
                        sx={{ mb: 2 }}
                    />

                    {/* Escritorio / tablet: tabla */}
                    <TableContainer
                        component={Paper}
                        variant="outlined"
                        sx={{ display: { xs: 'none', sm: 'block' }, borderRadius: 4 }}
                    >
                        <Table aria-label="Memes pendientes de moderación">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Meme</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pendingMemes.map((meme) => (
                                    <TableRow key={meme.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar
                                                    variant="rounded"
                                                    src={meme.imageUrl}
                                                    alt={meme.title}
                                                    sx={{ width: 64, height: 64 }}
                                                />
                                                <div>
                                                    <Typography sx={{ fontWeight: 600 }}>{meme.title}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        por {authorOf(meme)}
                                                    </Typography>
                                                </div>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="small" color="warning" label="Pendiente" />
                                        </TableCell>
                                        <TableCell align="right" sx={{ width: 150 }}>{renderActions(meme, 'column')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Móvil: tarjetas apiladas */}
                    <Stack spacing={2} sx={{ display: { xs: 'flex', sm: 'none' } }}>
                        {pendingMemes.map((meme) => (
                            <Card key={meme.id}>
                                <CardMedia
                                    component="img"
                                    image={meme.imageUrl}
                                    alt={meme.title}
                                    sx={{ maxHeight: 260, objectFit: 'cover' }}
                                />
                                <CardContent sx={{ pb: 1 }}>
                                    <Typography variant="h4" component="h2">{meme.title}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Autor: {authorOf(meme)}
                                    </Typography>
                                    <Chip size="small" color="warning" label="Pendiente" sx={{ mt: 1 }} />
                                </CardContent>
                                <CardActions sx={{ px: 2, pb: 2 }}>{renderActions(meme)}</CardActions>
                            </Card>
                        ))}
                    </Stack>
                </>
            )}

            <ConfirmDialog
                open={memeToReject !== null}
                title="¿Rechazar este meme?"
                message={memeToReject ? `"${memeToReject.title}" no se publicará en el feed.` : ''}
                confirmLabel="Rechazar"
                color="error"
                loading={memeToReject !== null && updatingId === memeToReject.id}
                onConfirm={() => void confirmReject()}
                onClose={() => setMemeToReject(null)}
            />

            <Snackbar
                open={message !== null}
                autoHideDuration={3000}
                onClose={() => setMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {/* El Snackbar necesita un hijo siempre; se usa un Alert para darle color según el resultado */}
                <Alert
                    severity={message?.severity ?? 'success'}
                    variant="filled"
                    onClose={() => setMessage(null)}
                >
                    {message?.text}
                </Alert>
            </Snackbar>
        </main>
    );
}
