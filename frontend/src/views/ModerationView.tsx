import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import type { Meme } from '../types';
import './ModerationView.css';

type ModerationDecision = 'approved' | 'rejected';

export function ModerationView() {
    // Memes pendientes que entrega el backend (solo moderadores).
    const [pendingMemes, setPendingMemes] = useState<Meme[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Guarda el último mensaje de acción para dar feedback visual.
    const [message, setMessage] = useState<string | null>(null);
    // Meme que se está actualizando, para deshabilitar sus botones.
    const [updatingId, setUpdatingId] = useState<string | null>(null);

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
            setMessage(
                status === 'approved'
                    ? 'Meme aprobado correctamente.'
                    : 'Meme rechazado correctamente.'
            );
        } catch (err) {
            setMessage(err instanceof Error ? err.message : 'No se pudo moderar el meme.');
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <main className="moderation-view">
            <header className="moderation-header">
                <h1>Moderación</h1>
                <p>
                    Revisa los memes pendientes y decide si se aprueban o se rechazan.
                </p>
            </header>

            {message !== null && (
                <p className="moderation-message">
                    {message}
                </p>
            )}

            {loading ? (
                <p className="empty-state">
                    Cargando memes pendientes…
                </p>
            ) : error !== null ? (
                <p className="empty-state">
                    {error}
                </p>
            ) : pendingMemes.length === 0 ? (
                <p className="empty-state">
                    No hay memes pendientes por moderar.
                </p>
            ) : (
                <section className="moderation-list">
                    {pendingMemes.map((meme) => (
                        <article
                            key={meme.id}
                            className="moderation-card"
                        >
                            <img
                                src={meme.imageUrl}
                                alt={meme.title}
                                className="moderation-image"
                            />

                            <div className="moderation-info">
                                <h2>{meme.title}</h2>

                                <p>
                                    Autor:{' '}
                                    {typeof meme.author === 'string'
                                        ? meme.author
                                        : meme.author.username}
                                </p>

                                <p>Estado: pendiente</p>

                                <div className="moderation-actions">
                                    <button
                                        type="button"
                                        disabled={updatingId === meme.id}
                                        onClick={() => moderateMeme(meme.id, 'approved')}
                                    >
                                        Aprobar
                                    </button>

                                    <button
                                        type="button"
                                        disabled={updatingId === meme.id}
                                        onClick={() => moderateMeme(meme.id, 'rejected')}
                                    >
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </main>
    );
}
