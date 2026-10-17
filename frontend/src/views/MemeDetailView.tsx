import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useViewTransitionName, withViewTransition } from '../hooks/useViewTransition';
import { mockComments } from '../mockData';
import { CURRENT_USER, canSeeMeme, useMemes } from '../memeStore';
import type { Comment, Meme, User } from '../types';
import './MemeDetailView.css';

const AVATAR_COLORS = ['#aa3bff', '#ff6b6b', '#4dabf7', '#51cf66', '#ffa94d', '#f783ac', '#20c997'];

function authorName(author: User | string): string {
  return typeof author === 'string' ? author : author.username;
}

function AuthorName({ author }: { author: User | string }) {
  if (typeof author === 'string') {
    return <span className="meme-card-author">{author}</span>;
  }
  return (
    <Link className="meme-card-author" to={`/perfil/${author.id}`}>
      {author.username}
    </Link>
  );
}

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(dateString?: string): string {
  if (!dateString) return '';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'justo ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} mes${months > 1 ? 'es' : ''}`;
  const years = Math.floor(months / 12);
  return `hace ${years} año${years > 1 ? 's' : ''}`;
}

function countReplies(commentId: string): number {
  const replies = mockComments.filter((c) => c.parentType === 'Comment' && c.parentId === commentId);
  return replies.reduce((sum, reply) => sum + 1 + countReplies(reply.id), 0);
}

function countAllComments(memeId: string, extra: Comment[]): number {
  const topLevel = mockComments.filter((c) => c.parentType === 'Meme' && c.parentId === memeId);
  const total = topLevel.reduce((sum, c) => sum + 1 + countReplies(c.id), 0);
  return total + extra.length;
}

function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  return (
    <div
      className="meme-avatar"
      style={{ background: avatarColor(name), width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function ThumbUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 10v11M2 13.5v5A1.5 1.5 0 0 0 3.5 20H18a2 2 0 0 0 2-1.6l1.2-6A2 2 0 0 0 19.2 10H14V5a2 2 0 0 0-2-2l-2 6.5V20" />
    </svg>
  );
}
function ThumbDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 14V3M22 10.5v-5A1.5 1.5 0 0 0 20.5 4H6a2 2 0 0 0-2 1.6l-1.2 6A2 2 0 0 0 4.8 14H10v5a2 2 0 0 0 2 2l2-6.5V4" />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 3.9M15.4 6.6L8.6 10.5" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}
function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function CommentThread({ comment }: { comment: Comment }) {
  const replies = mockComments.filter((c) => c.parentType === 'Comment' && c.parentId === comment.id);
  const name = authorName(comment.author);

  return (
    <li className="comment">
      <div className="comment-row">
        <div className="comment-avatar" style={{ background: avatarColor(name) }}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="comment-body">
          <div className="comment-header">
            <span className="comment-author">{name}</span>
            <span className="comment-time">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="comment-content">{comment.content}</p>
          <div className="comment-actions">
            <button type="button">
              <ThumbUpIcon /> {comment.likes}
            </button>
            <button type="button">
              <ThumbDownIcon /> {comment.dislikes}
            </button>
            <button type="button">Responder</button>
          </div>
        </div>
      </div>
      {replies.length > 0 && (
        <ul className="comment-replies">
          {replies.map((reply) => (
            <CommentThread key={reply.id} comment={reply} />
          ))}
        </ul>
      )}
    </li>
  );
}

function useMemeInteractions(meme: Meme) {
  const [vote, setVote] = useState<'like' | 'dislike' | null>(null);
  const [newComment, setNewComment] = useState('');
  const [extraComments, setExtraComments] = useState<Comment[]>([]);

  const likeCount = meme.likes + (vote === 'like' ? 1 : 0);
  const dislikeCount = meme.dislikes + (vote === 'dislike' ? 1 : 0);

  const topLevelComments = [
    ...extraComments,
    ...mockComments.filter((c) => c.parentType === 'Meme' && c.parentId === meme.id),
  ];
  const totalComments = countAllComments(meme.id, extraComments);

  const toggleVote = (type: 'like' | 'dislike') => {
    setVote((current) => (current === type ? null : type));
  };

  const handleAddComment = (event: FormEvent) => {
    event.preventDefault();
    const content = newComment.trim();
    if (!content) return;
    const comment: Comment = {
      id: `comment_local_${Date.now()}`,
      author: CURRENT_USER,
      content,
      parentId: meme.id,
      parentType: 'Meme',
      likes: 0,
      dislikes: 0,
      createdAt: new Date().toISOString(),
    };
    setExtraComments((prev) => [comment, ...prev]);
    setNewComment('');
  };

  return {
    vote,
    toggleVote,
    likeCount,
    dislikeCount,
    topLevelComments,
    totalComments,
    newComment,
    setNewComment,
    handleAddComment,
  };
}

async function shareMeme(meme: Meme, onShare: (message: string) => void) {
  const url = `${window.location.origin}/meme/${meme.id}`;
  try {
    await navigator.clipboard.writeText(url);
    onShare('¡Enlace copiado!');
  } catch {
    onShare(url);
  }
}

function CommentForm({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form className="meme-comment-form" onSubmit={onSubmit}>
      <input
        type="text"
        placeholder={`Añade un comentario`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={300}
      />
      <button type="submit" disabled={!value.trim()} aria-label="Enviar comentario">
        <SendIcon />
      </button>
    </form>
  );
}

/** Pin-detail style layout for the meme the user actually opened: image on one side, actions + comments on the other. */
export function FeaturedMemeDetail({
  meme,
  onShare,
  onCollapse,
}: {
  meme: Meme;
  onShare: (message: string) => void;
  onCollapse: () => void;
}) {
  const {
    vote,
    toggleVote,
    likeCount,
    dislikeCount,
    topLevelComments,
    totalComments,
    newComment,
    setNewComment,
    handleAddComment,
  } = useMemeInteractions(meme);

  const authorLabel = authorName(meme.author);
  const rootRef = useViewTransitionName(`meme-${meme.id}`);

  return (
    <article className="meme-pin" ref={rootRef}>
      <button type="button" className="meme-pin-media" onClick={onCollapse} aria-label="Achicar momo">
        <img src={meme.imageUrl} alt={meme.title} />
      </button>

      <div className="meme-pin-side">
        <div className="meme-pin-toolbar">
          <button
            type="button"
            className={`meme-pin-iconbtn ${vote === 'like' ? 'active-like' : ''}`}
            onClick={() => toggleVote('like')}
            aria-pressed={vote === 'like'}
            aria-label="Me gusta"
          >
            <ThumbUpIcon />
            <span>{likeCount}</span>
          </button>
          <button
            type="button"
            className={`meme-pin-iconbtn ${vote === 'dislike' ? 'active-dislike' : ''}`}
            onClick={() => toggleVote('dislike')}
            aria-pressed={vote === 'dislike'}
            aria-label="No me gusta"
          >
            <ThumbDownIcon />
            <span>{dislikeCount}</span>
          </button>
          <button type="button" className="meme-pin-iconbtn" aria-label="Más opciones">
            <MoreIcon />
          </button>

          {meme.status !== 'approved' && (
            <span className={`meme-card-status ${meme.status}`}>
              {meme.status === 'pending' ? 'Pendiente' : 'Rechazado'}
            </span>
          )}

          <button type="button" className="meme-pin-cta" onClick={() => shareMeme(meme, onShare)}>
            <ShareIcon />
            Compartir
          </button>
        </div>

        <div className="meme-pin-divider" />

        <p className="meme-pin-title">{meme.title}</p>

        <div className="meme-pin-author">
          <Avatar name={authorLabel} size={34} />
          <div className="meme-card-authorinfo">
            <AuthorName author={meme.author} />
            <span className="meme-card-time">{timeAgo(meme.createdAt)}</span>
          </div>
        </div>

        <div className="meme-pin-divider" />

        <p className="meme-pin-comments-heading">{totalComments} comentarios</p>

        <ul className="meme-pin-comments-list">
          {topLevelComments.length === 0 ? (
            <li className="meme-card-comments-empty">Sé el primero en comentar este momo.</li>
          ) : (
            topLevelComments.map((comment) => <CommentThread key={comment.id} comment={comment} />)
          )}
        </ul>

        <CommentForm value={newComment} onChange={setNewComment} onSubmit={handleAddComment} />
      </div>
    </article>
  );
}

/** Plain feed card: click the image/title to grow it slightly in place and reveal comments. */
function MemeFeedCard({ meme, onShare }: { meme: Meme; onShare: (message: string) => void }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const {
    vote,
    toggleVote,
    likeCount,
    dislikeCount,
    topLevelComments,
    totalComments,
    newComment,
    setNewComment,
    handleAddComment,
  } = useMemeInteractions(meme);

  const authorLabel = authorName(meme.author);
  const approval =
    likeCount + dislikeCount > 0 ? Math.round((likeCount / (likeCount + dislikeCount)) * 100) : null;
  const rootRef = useViewTransitionName(`meme-${meme.id}`);

  return (
    <article className="meme-card" ref={rootRef}>
      <header className="meme-card-header">
        <Avatar name={authorLabel} />
        <div className="meme-card-authorinfo">
          <AuthorName author={meme.author} />
          <span className="meme-card-time">{timeAgo(meme.createdAt)}</span>
        </div>
        {meme.status !== 'approved' && (
          <span className={`meme-card-status ${meme.status}`}>
            {meme.status === 'pending' ? 'Pendiente' : 'Rechazado'}
          </span>
        )}
      </header>

      <button
        type="button"
        className="meme-card-open"
        onClick={() => setCommentsOpen((open) => !open)}
      >
        <p className="meme-card-title">{meme.title}</p>

        <div className={`meme-card-media ${commentsOpen ? 'open' : ''}`}>
          <img src={meme.imageUrl} alt={meme.title} loading="lazy" />
        </div>
      </button>

      <div className="meme-card-actions">
        {approval !== null && <span className="meme-card-approval">🔥 {approval}%</span>}
        <button
          type="button"
          className={`meme-pill like ${vote === 'like' ? 'active' : ''}`}
          onClick={() => toggleVote('like')}
          aria-pressed={vote === 'like'}
        >
          <ThumbUpIcon />
          {likeCount}
        </button>
        <button
          type="button"
          className={`meme-pill dislike ${vote === 'dislike' ? 'active' : ''}`}
          onClick={() => toggleVote('dislike')}
          aria-pressed={vote === 'dislike'}
        >
          <ThumbDownIcon />
          {dislikeCount}
        </button>
        <button
          type="button"
          className={`meme-pill ${commentsOpen ? 'active' : ''}`}
          onClick={() => setCommentsOpen((open) => !open)}
        >
          <CommentIcon />
          {totalComments}
        </button>
        <button type="button" className="meme-pill share" onClick={() => shareMeme(meme, onShare)}>
          <ShareIcon />
          Compartir
        </button>
      </div>

      {commentsOpen && (
        <div className="meme-card-comments">
          <ul className="meme-card-comments-list">
            {topLevelComments.length === 0 ? (
              <li className="meme-card-comments-empty">Sé el primero en comentar este momo.</li>
            ) : (
              topLevelComments.map((comment) => <CommentThread key={comment.id} comment={comment} />)
            )}
          </ul>

          <CommentForm value={newComment} onChange={setNewComment} onSubmit={handleAddComment} />
        </div>
      )}
    </article>
  );
}

/**
 * A feed of meme cards where one meme (if any) can be "featured": shown big, Pinterest-pin
 * style, with its comments open. Clicking another card's image grows it into that spot and
 * shrinks the previous one back down; clicking the featured image shrinks it back to a card.
 * Used both as the standalone `/meme/:id` page and embedded in the home feed.
 */
function MemeFeed({
  memes: memesProp,
  initialFeaturedId = null,
  syncUrl = false,
}: {
  memes?: Meme[];
  initialFeaturedId?: string | null;
  syncUrl?: boolean;
}) {
  const navigate = useNavigate();
  const storeMemes = useMemes();
  // Sin lista explícita, solo se muestran los memes que el usuario actual puede ver.
  const memes = memesProp ?? storeMemes.filter((meme) => canSeeMeme(CURRENT_USER, meme));
  const [toast, setToast] = useState<string | null>(null);

  const initialIndex = initialFeaturedId ? memes.findIndex((m) => m.id === initialFeaturedId) : -1;
  // Fixed once so the list doesn't reshuffle every time the featured meme changes.
  const [orderedMemes] = useState<Meme[]>(() =>
    initialIndex < 0 ? memes : [...memes.slice(initialIndex), ...memes.slice(0, initialIndex)],
  );
  const [featuredId, setFeaturedId] = useState<string | null>(initialFeaturedId ?? null);
  // Keep in sync when the prop changes from outside our own clicks (e.g. a direct link or
  // browser back/forward) — adjusted during render rather than an effect, per React's
  // guidance for state that mirrors a prop.
  const [syncedProp, setSyncedProp] = useState(initialFeaturedId ?? null);
  if ((initialFeaturedId ?? null) !== syncedProp) {
    setSyncedProp(initialFeaturedId ?? null);
    if (initialFeaturedId && orderedMemes.some((m) => m.id === initialFeaturedId)) {
      setFeaturedId(initialFeaturedId);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(timeout);
  }, [toast]);

  const applyFeatured = (newId: string | null) => {
    withViewTransition(() => setFeaturedId(newId));
    if (syncUrl) navigate(newId ? `/meme/${newId}` : '/', { replace: true });
  };

  const collapseMeme = () => applyFeatured(null);

  return (
    <div className="meme-feed">
      {toast && <div className="meme-feed-toast">{toast}</div>}

      {orderedMemes.map((meme) =>
        meme.id === featuredId ? (
          <FeaturedMemeDetail key={meme.id} meme={meme} onShare={setToast} onCollapse={collapseMeme} />
        ) : (
          <MemeFeedCard key={meme.id} meme={meme} onShare={setToast} />
        ),
      )}

      <p className="meme-feed-end">Ya viste todos los momos disponibles 🎉</p>
    </div>
  );
}

export { MemeFeed };

/** Standalone route for a shareable link to one specific meme (`/meme/:id`). */
export function MemeDetailView() {
  const { id } = useParams<{ id: string }>();
  const memes = useMemes();
  // Los memes pendientes o rechazados solo los ven su autor o un moderador.
  const exists = memes.some((m) => m.id === id && canSeeMeme(CURRENT_USER, m));

  if (!exists) {
    return (
      <div className="meme-feed">
        <div className="meme-card meme-card-notfound">
          <h2>Momo no encontrado</h2>
          <p>Puede que este meme haya sido eliminado o el enlace esté mal escrito.</p>
          <Link className="meme-pill" to="/">
            Volver a Momazos
          </Link>
        </div>
      </div>
    );
  }

  return <MemeFeed initialFeaturedId={id ?? null} syncUrl />;
}