import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useViewTransitionName, withViewTransition } from '../hooks/useViewTransition';
import type { Comment, Meme, ReactionType, User } from '../types';
import { selectUser, useAuthStore } from '../stores/authStore';
import { useComments, useMemeList, useMemeStore } from '../stores/memeStore';
import {
  Alert,
  Avatar as MuiAvatar,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Link as MuiLink,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
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
    <MuiLink component={Link} className="meme-card-author" to={`/perfil/${author.id}`} underline="hover">
      {author.username}
    </MuiLink>
  );
}

/** Etiqueta de estado (pendiente / rechazado) con los colores semánticos del tema. */
function StatusChip({ status }: { status: Meme['status'] }) {
  if (status === 'approved') return null;
  return (
    <Chip
      size="small"
      sx={{ ml: 'auto' }}
      color={status === 'pending' ? 'warning' : 'error'}
      variant="outlined"
      label={status === 'pending' ? 'Pendiente' : 'Rechazado'}
    />
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

function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  return (
    <MuiAvatar sx={{ bgcolor: avatarColor(name), width: size, height: size, fontSize: size * 0.42, fontWeight: 700 }}>
      {name.charAt(0).toUpperCase()}
    </MuiAvatar>
  );
}

/**
 * Botón de reacción (me gusta / no me gusta / comentarios) usado en las tarjetas.
 * Reemplaza a las antiguas "píldoras" .meme-pill hechas a mano con un Button de MUI.
 */
function ReactionButton({
  icon,
  label,
  active,
  activeColor = 'primary',
  ...buttonProps
}: {
  icon: ReactNode;
  label: ReactNode;
  active: boolean;
  activeColor?: 'primary' | 'error' | 'inherit';
  onClick: () => void;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
}) {
  return (
    <Button
      size="small"
      variant={active ? 'contained' : 'outlined'}
      color={active ? activeColor : 'inherit'}
      startIcon={icon}
      sx={active ? undefined : { borderColor: 'divider', color: 'text.primary' }}
      {...buttonProps}
    >
      {label}
    </Button>
  );
}

function CommentThread({
  comment,
  comments,
  onReply,
  reactingCommentId,
  onReact,
  canReact,
}: {
  comment: Comment;
  comments: Comment[];
  onReply: (comment: Comment) => void;
  reactingCommentId: string | null;
  onReact: (commentId: string, type: 'like' | 'dislike') => void;
  canReact: boolean;
}) {
  const replies = comments.filter((c) => c.parentType === 'Comment' && c.parentId === comment.id);
  const name = authorName(comment.author);

  return (
    <li className="comment">
      <div className="comment-row">
        <Avatar name={name} size={30} />
        <div className="comment-body">
          <div className="comment-header">
            <span className="comment-author">{name}</span>
            <span className="comment-time">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="comment-content">{comment.content}</p>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            {/* Tooltip explica por qué el botón está deshabilitado sin sesión */}
            <Tooltip title={canReact ? '' : 'Inicia sesión para reaccionar'}>
              <span>
                <Button
                  size="small"
                  color={comment.myReaction === 'like' ? 'primary' : 'inherit'}
                  startIcon={<ThumbUpAltOutlinedIcon fontSize="small" />}
                  onClick={() => onReact(comment.id, 'like')}
                  disabled={reactingCommentId === comment.id || !canReact}
                  sx={{ minWidth: 0, px: 1, color: comment.myReaction === 'like' ? undefined : 'text.secondary' }}
                >
                  {comment.likes}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={canReact ? '' : 'Inicia sesión para reaccionar'}>
              <span>
                <Button
                  size="small"
                  color={comment.myReaction === 'dislike' ? 'error' : 'inherit'}
                  startIcon={<ThumbDownAltOutlinedIcon fontSize="small" />}
                  onClick={() => onReact(comment.id, 'dislike')}
                  disabled={reactingCommentId === comment.id || !canReact}
                  sx={{ minWidth: 0, px: 1, color: comment.myReaction === 'dislike' ? undefined : 'text.secondary' }}
                >
                  {comment.dislikes}
                </Button>
              </span>
            </Tooltip>
            <Button size="small" color="inherit" onClick={() => onReply(comment)} sx={{ color: 'text.secondary', px: 1 }}>
              Responder
            </Button>
          </Box>
        </div>
      </div>
      {replies.length > 0 && (
        <ul className="comment-replies">
          {replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              comments={comments}
              onReply={onReply}
              reactingCommentId={reactingCommentId}
              onReact={onReact}
              canReact={canReact}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}

/**
 * Votos y comentarios de un meme. Los datos (likes, voto propio, comentarios) salen
 * del store global de memes, así un voto en el feed se ve también en el ranking o
 * en /meme/:id. Lo único local es el estado del formulario y los avisos de error.
 */
function useMemeInteractions(meme: Meme) {
  const user = useAuthStore(selectUser);
  const isReacting = useMemeStore((state) => state.reactingIds[meme.id] === true);
  const reactToMeme = useMemeStore((state) => state.reactToMeme);
  const fetchComments = useMemeStore((state) => state.fetchComments);
  const addComment = useMemeStore((state) => state.addComment);
  const reactToComment = useMemeStore((state) => state.reactToComment);
  const commentsState = useComments(meme.id);
  const comments = commentsState.items;

  const [reactionError, setReactionError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reactingCommentId, setReactingCommentId] = useState<string | null>(null);

  useEffect(() => {
    void fetchComments(meme.id);
  }, [fetchComments, meme.id]);

  const vote = meme.myReaction ?? null;
  const topLevelComments = comments.filter((c) => c.parentType === 'Meme' && c.parentId === meme.id);
  const totalComments = comments.length;
  const commentError = actionError ?? commentsState.error?.message ?? null;

  const toggleVote = async (type: ReactionType) => {
    // Reaccionar exige sesión: el backend lo rechaza igual, pero damos feedback inmediato.
    if (!user) {
      setReactionError('Inicia sesión para reaccionar.');
      return;
    }
    setReactionError(null);
    try {
      await reactToMeme(meme.id, type);
    } catch (err) {
      setReactionError(errorMessage(err, 'No se pudo registrar la reacción.'));
    }
  };

  const handleAddComment = async (event: FormEvent) => {
    event.preventDefault();
    const content = newComment.trim();
    if (!content || !user) return;

    setActionError(null);
    try {
      await addComment(meme.id, content, replyTo);
      setNewComment('');
      setReplyTo(null);
    } catch (err) {
      setActionError(errorMessage(err, 'No se pudo publicar el comentario.'));
    }
  };

  const handleCommentReaction = async (commentId: string, type: ReactionType) => {
    if (!user) {
      setActionError('Inicia sesión para reaccionar.');
      return;
    }
    if (reactingCommentId) return;

    setReactingCommentId(commentId);
    setActionError(null);
    try {
      await reactToComment(meme.id, commentId, type);
    } catch (err) {
      setActionError(errorMessage(err, 'No se pudo registrar la reacción.'));
    } finally {
      setReactingCommentId(null);
    }
  };

  return {
    vote,
    toggleVote,
    isReacting,
    reactionError,
    likeCount: meme.likes,
    dislikeCount: meme.dislikes,
    topLevelComments,
    totalComments,
    comments,
    commentsLoading: !commentsState.loaded && commentsState.error === null,
    commentError,
    canComment: user !== null,
    canReact: user !== null,
    replyTo,
    setReplyTo,
    reactingCommentId,
    handleCommentReaction,
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
  disabled = false,
  replyTo,
  onCancelReply,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  disabled?: boolean;
  replyTo?: Comment | null;
  onCancelReply?: () => void;
}) {
  return (
    <form className="meme-comment-form" onSubmit={onSubmit}>
      {replyTo && (
        <Box sx={{ flex: '1 1 100%' }}>
          {/* Chip con "x" para cancelar la respuesta */}
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            label={`Respondiendo a ${authorName(replyTo.author)}`}
            onDelete={onCancelReply}
          />
        </Box>
      )}
      <TextField
        size="small"
        placeholder={disabled ? 'Inicia sesión para comentar' : 'Añade un comentario'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        slotProps={{
          htmlInput: { maxLength: 300, 'aria-label': 'Comentario' },
          input: { sx: { borderRadius: 999, bgcolor: 'background.paper' } },
        }}
        sx={{ flex: '1 1 auto', width: 'auto' }}
      />
      <IconButton
        type="submit"
        color="primary"
        disabled={disabled || !value.trim()}
        aria-label="Enviar comentario"
        sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }}
      >
        <SendRoundedIcon fontSize="small" />
      </IconButton>
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
    isReacting,
    reactionError,
    likeCount,
    dislikeCount,
    topLevelComments,
    totalComments,
    comments,
    commentsLoading,
    commentError,
    canComment,
    canReact,
    replyTo,
    setReplyTo,
    reactingCommentId,
    handleCommentReaction,
    newComment,
    setNewComment,
    handleAddComment,
  } = useMemeInteractions(meme);

  const authorLabel = authorName(meme.author);
  const rootRef = useViewTransitionName<HTMLDivElement>(`meme-${meme.id}`);

  return (
    <Card component="article" className="meme-pin" ref={rootRef}>
      <button type="button" className="meme-pin-media" onClick={onCollapse} aria-label="Achicar momo">
        <img src={meme.imageUrl} alt={meme.title} />
      </button>

      <div className="meme-pin-side">
        <div className="meme-pin-toolbar">
          <ReactionButton
            icon={<ThumbUpAltOutlinedIcon />}
            label={likeCount}
            active={vote === 'like'}
            onClick={() => toggleVote('like')}
            aria-pressed={vote === 'like'}
            disabled={isReacting}
            aria-label="Me gusta"
          />
          <ReactionButton
            icon={<ThumbDownAltOutlinedIcon />}
            label={dislikeCount}
            active={vote === 'dislike'}
            activeColor="error"
            onClick={() => toggleVote('dislike')}
            aria-pressed={vote === 'dislike'}
            disabled={isReacting}
            aria-label="No me gusta"
          />
          <IconButton aria-label="Más opciones" size="small">
            <MoreHorizRoundedIcon />
          </IconButton>

          <StatusChip status={meme.status} />

          <Button
            variant="contained"
            startIcon={<ShareRoundedIcon />}
            onClick={() => shareMeme(meme, onShare)}
            sx={{ ml: meme.status === 'approved' ? 'auto' : 1 }}
          >
            Compartir
          </Button>
        </div>

        {!canReact && (
          <Typography variant="caption" color="primary" sx={{ px: 2, fontWeight: 600 }}>
            Inicia sesión para reaccionar
          </Typography>
        )}
        {reactionError && (
          <Alert severity="error" sx={{ mx: 2, mb: 1 }}>
            {reactionError}
          </Alert>
        )}

        <Divider sx={{ mx: 2 }} />

        <p className="meme-pin-title">{meme.title}</p>

        <div className="meme-pin-author">
          <Avatar name={authorLabel} size={34} />
          <div className="meme-card-authorinfo">
            <AuthorName author={meme.author} />
            <span className="meme-card-time">{timeAgo(meme.createdAt)}</span>
          </div>
        </div>

        <Divider sx={{ mx: 2 }} />

        <p className="meme-pin-comments-heading">{totalComments} comentarios</p>

        <ul className="meme-pin-comments-list">
          {commentsLoading ? (
            <li className="meme-card-comments-empty"><LoadingState compact message="Cargando comentarios…" /></li>
          ) : topLevelComments.length === 0 ? (
            <li className="meme-card-comments-empty"><EmptyState compact icon="💬" title="Sé el primero en comentar este momo." /></li>
          ) : (
            topLevelComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                comments={comments}
                onReply={setReplyTo}
                reactingCommentId={reactingCommentId}
                onReact={handleCommentReaction}
                canReact={canReact}
              />
            ))
          )}
        </ul>

        {commentError && <Alert severity="error" sx={{ mb: 1 }}>{commentError}</Alert>}
        <CommentForm
          value={newComment}
          onChange={setNewComment}
          onSubmit={handleAddComment}
          disabled={!canComment}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </Card>
  );
}

/** Plain feed card: click the image/title to grow it slightly in place and reveal comments. */
function MemeFeedCard({ meme, onShare }: { meme: Meme; onShare: (message: string) => void }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const {
    vote,
    toggleVote,
    isReacting,
    reactionError,
    likeCount,
    dislikeCount,
    topLevelComments,
    totalComments,
    comments,
    commentsLoading,
    commentError,
    canComment,
    canReact,
    replyTo,
    setReplyTo,
    reactingCommentId,
    handleCommentReaction,
    newComment,
    setNewComment,
    handleAddComment,
  } = useMemeInteractions(meme);

  const authorLabel = authorName(meme.author);
  const approval =
    likeCount + dislikeCount > 0 ? Math.round((likeCount / (likeCount + dislikeCount)) * 100) : null;
  const rootRef = useViewTransitionName<HTMLDivElement>(`meme-${meme.id}`);

  return (
    <Card component="article" className="meme-card" ref={rootRef}>
      <header className="meme-card-header">
        <Avatar name={authorLabel} />
        <div className="meme-card-authorinfo">
          <AuthorName author={meme.author} />
          <span className="meme-card-time">{timeAgo(meme.createdAt)}</span>
        </div>
        <StatusChip status={meme.status} />
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
        {approval !== null && <Chip size="small" label={`🔥 ${approval}%`} sx={{ fontWeight: 700 }} />}
        <ReactionButton
          icon={<ThumbUpAltOutlinedIcon />}
          label={likeCount}
          active={vote === 'like'}
          onClick={() => toggleVote('like')}
          aria-pressed={vote === 'like'}
          aria-label="Me gusta"
          disabled={isReacting}
        />
        <ReactionButton
          icon={<ThumbDownAltOutlinedIcon />}
          label={dislikeCount}
          active={vote === 'dislike'}
          activeColor="error"
          onClick={() => toggleVote('dislike')}
          aria-pressed={vote === 'dislike'}
          aria-label="No me gusta"
          disabled={isReacting}
        />
        <ReactionButton
          icon={<ChatBubbleOutlineRoundedIcon />}
          label={totalComments}
          active={commentsOpen}
          onClick={() => setCommentsOpen((open) => !open)}
          aria-label="Ver comentarios"
        />
        <Button
          size="small"
          variant="text"
          startIcon={<ShareRoundedIcon />}
          onClick={() => shareMeme(meme, onShare)}
          sx={{ ml: { sm: 'auto' } }}
        >
          Compartir
        </Button>
        {!canReact && (
          <Typography variant="caption" color="primary" sx={{ flexBasis: '100%', fontWeight: 600 }}>
            Inicia sesión para reaccionar
          </Typography>
        )}
        {reactionError && (
          <Alert severity="error" sx={{ flexBasis: '100%' }}>
            {reactionError}
          </Alert>
        )}
      </div>

      {commentsOpen && (
        <div className="meme-card-comments">
          <ul className="meme-card-comments-list">
            {commentsLoading ? (
              <li className="meme-card-comments-empty"><LoadingState compact message="Cargando comentarios…" /></li>
            ) : topLevelComments.length === 0 ? (
              <li className="meme-card-comments-empty"><EmptyState compact icon="💬" title="Sé el primero en comentar este momo." /></li>
            ) : (
              topLevelComments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  comments={comments}
                  onReply={setReplyTo}
                  reactingCommentId={reactingCommentId}
                  onReact={handleCommentReaction}
                  canReact={canReact}
                />
              ))
            )}
          </ul>

          {commentError && <Alert severity="error" sx={{ mb: 1 }}>{commentError}</Alert>}
          <CommentForm
            value={newComment}
            onChange={setNewComment}
            onSubmit={handleAddComment}
            disabled={!canComment}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        </div>
      )}
    </Card>
  );
}

/**
 * A feed of meme cards where one meme (if any) can be "featured": shown big, Pinterest-pin
 * style, with its comments open. Clicking another card's image grows it into that spot and
 * shrinks the previous one back down; clicking the featured image shrinks it back to a card.
 * Used both as the standalone `/meme/:id` page and embedded in the home feed.
 */
function rotateTo(memes: Meme[], anchorId: string | null): Meme[] {
  const index = anchorId ? memes.findIndex((m) => m.id === anchorId) : -1;
  return index <= 0 ? memes : [...memes.slice(index), ...memes.slice(0, index)];
}

function MemeFeed({
  memes,
  initialFeaturedId = null,
  syncUrl = false,
  header = null,
}: {
  memes: Meme[];
  initialFeaturedId?: string | null;
  syncUrl?: boolean;
  /** Contenido opcional sobre el feed (p. ej. el botón "Volver" en /meme/:id). */
  header?: ReactNode;
}) {
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  // El meme con el que se abrió la página queda primero. El orden se fija al montar para
  // que la lista no salte al cambiar el meme agrandado o al votar (que cambia el puntaje);
  // los datos de cada meme sí se actualizan, porque vienen del store. Los memes que
  // lleguen después (p. ej. uno recién aprobado) se agregan al final.
  const [frozenOrder] = useState<string[]>(() => rotateTo(memes, initialFeaturedId).map((m) => m.id));
  const orderedMemes = useMemo(() => {
    const byId = new Map(memes.map((m) => [m.id, m]));
    const kept = frozenOrder.flatMap((memeId) => byId.get(memeId) ?? []);
    const added = memes.filter((m) => !frozenOrder.includes(m.id));
    return [...kept, ...added];
  }, [memes, frozenOrder]);
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
    // Al agrandar otro meme se actualiza la URL; al achicarlo se queda en la misma
    // página (antes saltaba a "/", lo que sacaba al usuario si venía del perfil).
    if (syncUrl && newId) navigate(`/meme/${newId}`, { replace: true });
  };

  const collapseMeme = () => applyFeatured(null);

  return (
    <div className="meme-feed">
      {header}
      {/* Snackbar de MUI: aviso temporal ("¡Enlace copiado!"); el cierre automático lo maneja el efecto de arriba */}
      <Snackbar
        open={toast !== null}
        message={toast}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={() => setToast(null)}
      />

      {orderedMemes.map((meme) =>
        meme.id === featuredId ? (
          <FeaturedMemeDetail key={meme.id} meme={meme} onShare={setToast} onCollapse={collapseMeme} />
        ) : (
          <MemeFeedCard key={meme.id} meme={meme} onShare={setToast} />
        ),
      )}

      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 1 }}>
        Ya viste todos los momos disponibles 🎉
      </Typography>
    </div>
  );
}

export { MemeFeed };

/**
 * Ruta `/meme/:id`: página propia de un meme (con sus comentarios).
 *
 * Carga el meme desde la API (`GET /api/memes/:id`). El backend también lo entrega
 * si está pendiente o rechazado, siempre que lo pida su autor o un moderador;
 * por eso funciona al abrir un meme propio desde el perfil.
 * Debajo se muestran los demás memes aprobados, como en el feed.
 */
export function MemeDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const selectMeme = useMemeStore((state) => state.selectMeme);
  const fetchFeed = useMemeStore((state) => state.fetchFeed);
  const byId = useMemeStore((state) => state.byId);
  const detail = useMemeStore((state) => state.detail);
  const feed = useMemeList('feed');
  const generation = useMemeStore((state) => state.generation);

  // Meme con el que se armó la página. Si el usuario agranda otro meme del mismo feed
  // la URL cambia pero el ancla no: así la animación no se corta ni la lista se recarga.
  const [anchorId, setAnchorId] = useState<string | undefined>(id);
  if (id !== anchorId && !feed.memes.some((m) => m.id === id)) {
    setAnchorId(id);
  }

  useEffect(() => {
    void fetchFeed();
  }, [fetchFeed, generation]);

  useEffect(() => {
    if (!id) return;
    void selectMeme(id);
  }, [id, selectMeme, generation]);

  // Al salir de la vista ya no hay meme seleccionado.
  useEffect(() => () => void selectMeme(null), [selectMeme]);

  // "Volver" solo tiene sentido si se llegó desde otra página de la app.
  const canGoBack = location.key !== 'default';
  const backButton = canGoBack && (
    <Button
      startIcon={<ArrowBackRoundedIcon />}
      color="inherit"
      onClick={() => navigate(-1)}
      sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
    >
      Volver
    </Button>
  );

  const anchor = anchorId ? byId[anchorId] : undefined;
  const anchorError = detail.id === anchorId ? detail.error : null;

  if (!anchor && !anchorError) {
    return (
      <div className="meme-feed">
        <LoadingState message="Cargando momo…" />
      </div>
    );
  }

  if (!anchor) {
    const notFound = anchorError?.status === 404 || anchorError?.status === 400;
    return (
      <div className="meme-feed">
        {backButton}
        {!notFound ? (
          <Alert severity="error">{anchorError?.message}</Alert>
        ) : (
          <Card>
            <EmptyState
              icon="🔍"
              title="Momo no encontrado"
              description="Puede que este meme haya sido eliminado o el enlace esté mal escrito."
              action={
                <Button component={Link} to="/" variant="contained">
                  Volver a Momazos
                </Button>
              }
            />
          </Card>
        )}
      </div>
    );
  }

  // Debajo del meme abierto se muestran los demás memes aprobados, como en el feed.
  const memes = [anchor, ...feed.memes.filter((m) => m.id !== anchor.id)];

  return (
    <MemeFeed
      key={anchor.id}
      memes={memes}
      initialFeaturedId={id ?? null}
      syncUrl
      header={backButton}
    />
  );
}
