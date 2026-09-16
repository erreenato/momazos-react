import { useState } from 'react';
import { mockMemes } from '../mockData';
import type { Meme } from '../types';
import './ModerationView.css';

export function ModerationView() {
    // Nos quedamos inicialmente solo con los memes pendientes.
    const [pendingMemes, setPendingMemes] = useState<Meme[]>(
        mockMemes.filter((meme) => meme.status === 'pending')
    );

    // Guarda el último mensaje de acción para dar feedback visual.
    const [message, setMessage] = useState<string | null>(null);

    const approveMeme = (memeId: string) => {
        setPendingMemes((currentMemes) =>
            currentMemes.filter((meme) => meme.id !== memeId)
        );

        setMessage('Meme aprobado correctamente.');
    };

    const rejectMeme = (memeId: string) => {
        setPendingMemes((currentMemes) =>
            currentMemes.filter((meme) => meme.id !== memeId)
        );

        setMessage('Meme rechazado correctamente.');
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

            {pendingMemes.length === 0 ? (
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
                                        onClick={() => approveMeme(meme.id)}
                                    >
                                        Aprobar
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => rejectMeme(meme.id)}
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
