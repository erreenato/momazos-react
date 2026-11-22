import { useMemo } from 'react';
import { create } from 'zustand';
import { toStoreError } from '../api/client';
import * as commentApi from '../api/comment';
import * as memeApi from '../api/meme';
import type { RankingUser } from '../api/meme';
import type { Comment, Meme, MemeStatus, ReactionType, StoreError, User } from '../types';

/**
 * Store global de memes (Zustand).
 *
 * Qué se guarda en memoria y qué se vuelve a consultar:
 * - `byId` es la caché normalizada: cada meme existe una sola vez. Las listas
 *   (feed, pendientes, memes de un usuario, rankings) solo guardan ids, así un voto
 *   o una moderación se ven al instante en todas las vistas.
 * - Al entrar a una vista se vuelve a pedir su lista (los puntajes cambian), pero si ya
 *   había datos se muestran mientras tanto: `loading` solo bloquea la vista la primera vez.
 * - Los comentarios se cachean por meme y se piden una vez (o al forzar).
 * - Al cambiar de usuario (login / logout / 401) el store de auth llama a `reset()`,
 *   porque `myReaction` y los memes pendientes dependen de quién está en sesión.
 *
 * Errores: las cargas guardan su error en el store (`StoreError`); las acciones que
 * modifican datos (publicar, votar, comentar, moderar, eliminar) además lo lanzan,
 * para que el formulario o botón que las llamó pueda mostrarlo.
 */

export type MemeListKey = 'feed' | 'pending' | `user:${string}`;
export type RankingVariant = 'top' | 'anti';
export type FeedSort = 'recent' | 'top';

export interface ListState {
  ids: string[];
  loading: boolean;
  /** true cuando ya se cargó al menos una vez. */
  loaded: boolean;
  error: StoreError | null;
}

export interface RankingState extends ListState {
  users: RankingUser[];
}

export interface CommentsState {
  items: Comment[];
  loading: boolean;
  loaded: boolean;
  error: StoreError | null;
}

export interface DetailState {
  id: string | null;
  loading: boolean;
  error: StoreError | null;
}

interface MemeState {
  byId: Record<string, Meme>;
  lists: Partial<Record<MemeListKey, ListState>>;
  rankings: Record<RankingVariant, RankingState>;
  comments: Record<string, CommentsState>;
  /** Meme abierto en /meme/:id. */
  selectedMemeId: string | null;
  detail: DetailState;
  /** Ids de memes con una reacción en curso (deshabilita sus botones). */
  reactingIds: Record<string, boolean>;
  /** Filtro de orden del feed principal. */
  feedSort: FeedSort;
  /**
   * Aumenta con cada `reset()`. Las vistas lo ponen en las dependencias de su efecto
   * de carga, así las que siguen montadas (p. ej. el ranking lateral) vuelven a pedir
   * sus datos después de un login o logout.
   */
  generation: number;

  fetchFeed: () => Promise<void>;
  fetchPending: () => Promise<void>;
  fetchUserMemes: (userId: string) => Promise<void>;
  fetchRanking: (variant: RankingVariant) => Promise<void>;
  selectMeme: (memeId: string | null) => Promise<void>;
  /** `author` es el usuario en sesión: POST /memes devuelve el autor solo como id. */
  publishMeme: (data: FormData, author?: User | null) => Promise<Meme>;
  reactToMeme: (memeId: string, type: ReactionType) => Promise<void>;
  moderateMeme: (memeId: string, status: Exclude<MemeStatus, 'pending'>) => Promise<void>;
  deleteMeme: (memeId: string) => Promise<void>;
  fetchComments: (memeId: string, options?: { force?: boolean }) => Promise<void>;
  addComment: (memeId: string, content: string, replyTo?: Comment | null) => Promise<Comment>;
  reactToComment: (memeId: string, commentId: string, type: ReactionType) => Promise<void>;
  setFeedSort: (sort: FeedSort) => void;
  reset: () => void;
}

const EMPTY_LIST: ListState = { ids: [], loading: false, loaded: false, error: null };
const EMPTY_RANKING: RankingState = { ...EMPTY_LIST, users: [] };
const EMPTY_COMMENTS: CommentsState = { items: [], loading: false, loaded: false, error: null };

function initialState() {
  return {
    byId: {} as Record<string, Meme>,
    lists: {} as Partial<Record<MemeListKey, ListState>>,
    rankings: { top: EMPTY_RANKING, anti: EMPTY_RANKING },
    comments: {} as Record<string, CommentsState>,
    selectedMemeId: null as string | null,
    detail: { id: null, loading: false, error: null } as DetailState,
    reactingIds: {} as Record<string, boolean>,
    feedSort: 'recent' as FeedSort,
  };
}

function authorIdOf(meme: Meme): string | null {
  return typeof meme.author === 'string' ? null : meme.author.id;
}

function mergeMemes(byId: Record<string, Meme>, memes: Meme[]): Record<string, Meme> {
  const next = { ...byId };
  for (const meme of memes) next[meme.id] = { ...next[meme.id], ...meme };
  return next;
}

function withoutId(ids: string[], memeId: string): string[] {
  return ids.filter((id) => id !== memeId);
}

export const useMemeStore = create<MemeState>()((set, get) => {
  /** Carga genérica de una lista: marca loading, guarda los memes en `byId` y los ids en la lista. */
  async function loadList(key: MemeListKey, request: () => Promise<Meme[]>, fallback: string) {
    set((state) => ({
      lists: {
        ...state.lists,
        [key]: { ...(state.lists[key] ?? EMPTY_LIST), loading: true, error: null },
      },
    }));
    try {
      const memes = await request();
      set((state) => ({
        byId: mergeMemes(state.byId, memes),
        lists: {
          ...state.lists,
          [key]: { ids: memes.map((m) => m.id), loading: false, loaded: true, error: null },
        },
      }));
    } catch (error) {
      set((state) => ({
        lists: {
          ...state.lists,
          [key]: { ...(state.lists[key] ?? EMPTY_LIST), loading: false, error: toStoreError(error, fallback) },
        },
      }));
    }
  }

  function updateComments(memeId: string, update: (current: CommentsState) => Partial<CommentsState>) {
    set((state) => {
      const current = state.comments[memeId] ?? EMPTY_COMMENTS;
      return { comments: { ...state.comments, [memeId]: { ...current, ...update(current) } } };
    });
  }

  return {
    ...initialState(),
    generation: 0,

    fetchFeed: () => loadList('feed', memeApi.getApprovedMemes, 'No se pudieron cargar los memes.'),

    fetchPending: () =>
      loadList('pending', memeApi.getPendingMemes, 'No se pudieron cargar los memes pendientes.'),

    fetchUserMemes: (userId) =>
      loadList(`user:${userId}`, () => memeApi.getUserMemes(userId), 'No se pudieron cargar los memes del usuario.'),

    fetchRanking: async (variant) => {
      set((state) => ({
        rankings: { ...state.rankings, [variant]: { ...state.rankings[variant], loading: true, error: null } },
      }));
      try {
        const [memes, users] =
          variant === 'top'
            ? await Promise.all([memeApi.getTopMemes(), memeApi.getTopUsers()])
            : await Promise.all([memeApi.getBottomMemes(), memeApi.getBottomUsers()]);
        set((state) => ({
          byId: mergeMemes(state.byId, memes),
          rankings: {
            ...state.rankings,
            [variant]: { ids: memes.map((m) => m.id), users, loading: false, loaded: true, error: null },
          },
        }));
      } catch (error) {
        set((state) => ({
          rankings: {
            ...state.rankings,
            [variant]: {
              ...state.rankings[variant],
              loading: false,
              error: toStoreError(error, 'No se pudo cargar la tabla. Intenta de nuevo más tarde.'),
            },
          },
        }));
      }
    },

    selectMeme: async (memeId) => {
      set({ selectedMemeId: memeId });
      if (!memeId) return;

      // Si ya está en memoria se muestra de inmediato y se refresca en segundo plano.
      set({ detail: { id: memeId, loading: true, error: null } });
      try {
        const meme = await memeApi.getMemeById(memeId);
        set((state) => ({
          byId: mergeMemes(state.byId, [meme]),
          detail: state.detail.id === memeId ? { id: memeId, loading: false, error: null } : state.detail,
        }));
      } catch (error) {
        set((state) => ({
          detail:
            state.detail.id === memeId
              ? { id: memeId, loading: false, error: toStoreError(error, 'No se pudo cargar el meme.') }
              : state.detail,
        }));
      }
    },

    publishMeme: async (data, author = null) => {
      try {
        const created = await memeApi.createMeme(data);
        const meme: Meme = typeof created.author === 'string' && author ? { ...created, author } : created;
        const authorId = authorIdOf(meme);
        set((state) => {
          const lists = { ...state.lists };
          // El meme nace pendiente: aparece en "mis memes" y, si quien publica es
          // moderador y ya tenía la lista cargada, en la cola de moderación.
          const userKey = authorId ? (`user:${authorId}` as const) : null;
          if (userKey && lists[userKey]) {
            lists[userKey] = { ...lists[userKey], ids: [meme.id, ...lists[userKey].ids] };
          }
          if (lists.pending?.loaded) {
            lists.pending = { ...lists.pending, ids: [...lists.pending.ids, meme.id] };
          }
          return { byId: mergeMemes(state.byId, [meme]), lists };
        });
        return meme;
      } catch (error) {
        throw toStoreError(error, 'No se pudo publicar el meme.');
      }
    },

    reactToMeme: async (memeId, type) => {
      const current = get().byId[memeId];
      // Un solo voto por publicación: repetir el mismo voto no hace nada.
      if (get().reactingIds[memeId] || current?.myReaction === type) return;

      set((state) => ({ reactingIds: { ...state.reactingIds, [memeId]: true } }));
      try {
        const { meme } = await memeApi.reactToMeme(memeId, type);
        set((state) => ({
          byId: state.byId[memeId]
            ? {
                ...state.byId,
                [memeId]: {
                  ...state.byId[memeId],
                  likes: meme.likes,
                  dislikes: meme.dislikes,
                  score: meme.score,
                  myReaction: meme.myReaction,
                },
              }
            : state.byId,
        }));
      } catch (error) {
        throw toStoreError(error, 'No se pudo registrar la reacción.');
      } finally {
        set((state) => {
          const reactingIds = { ...state.reactingIds };
          delete reactingIds[memeId];
          return { reactingIds };
        });
      }
    },

    moderateMeme: async (memeId, status) => {
      try {
        const meme = await memeApi.updateMemeStatus(memeId, status);
        set((state) => {
          const lists = { ...state.lists };
          if (lists.pending) lists.pending = { ...lists.pending, ids: withoutId(lists.pending.ids, memeId) };
          // Un meme aprobado entra al feed: se agrega arriba para que se vea sin recargar.
          if (status === 'approved' && lists.feed?.loaded && !lists.feed.ids.includes(memeId)) {
            lists.feed = { ...lists.feed, ids: [memeId, ...lists.feed.ids] };
          }
          if (status === 'rejected' && lists.feed) {
            lists.feed = { ...lists.feed, ids: withoutId(lists.feed.ids, memeId) };
          }
          return { byId: mergeMemes(state.byId, [meme]), lists };
        });
      } catch (error) {
        throw toStoreError(error, 'No se pudo moderar el meme.');
      }
    },

    deleteMeme: async (memeId) => {
      try {
        await memeApi.deleteMeme(memeId);
        set((state) => {
          const byId = { ...state.byId };
          delete byId[memeId];
          const lists: MemeState['lists'] = {};
          for (const [key, list] of Object.entries(state.lists) as [MemeListKey, ListState][]) {
            lists[key] = { ...list, ids: withoutId(list.ids, memeId) };
          }
          const rankings = {
            top: { ...state.rankings.top, ids: withoutId(state.rankings.top.ids, memeId) },
            anti: { ...state.rankings.anti, ids: withoutId(state.rankings.anti.ids, memeId) },
          };
          const comments = { ...state.comments };
          delete comments[memeId];
          return { byId, lists, rankings, comments };
        });
      } catch (error) {
        throw toStoreError(error, 'No se pudo eliminar el meme.');
      }
    },

    fetchComments: async (memeId, { force = false } = {}) => {
      const current = get().comments[memeId];
      if (!force && (current?.loaded || current?.loading)) return;

      updateComments(memeId, () => ({ loading: true, error: null }));
      try {
        const items = await commentApi.getCommentsByMeme(memeId);
        updateComments(memeId, () => ({ items, loading: false, loaded: true, error: null }));
      } catch (error) {
        updateComments(memeId, () => ({
          loading: false,
          error: toStoreError(error, 'No se pudieron cargar los comentarios.'),
        }));
      }
    },

    addComment: async (memeId, content, replyTo = null) => {
      try {
        const comment = await commentApi.postComment(
          content,
          replyTo?.id ?? memeId,
          replyTo ? 'Comment' : 'Meme',
        );
        updateComments(memeId, (current) => ({ items: [comment, ...current.items] }));
        return comment;
      } catch (error) {
        throw toStoreError(error, 'No se pudo publicar el comentario.');
      }
    },

    reactToComment: async (memeId, commentId, type) => {
      try {
        const { comment } = await commentApi.reactToCommentApi(commentId, type);
        updateComments(memeId, (current) => ({
          items: current.items.map((item) => (item.id === commentId ? { ...item, ...comment } : item)),
        }));
      } catch (error) {
        throw toStoreError(error, 'No se pudo registrar la reacción.');
      }
    },

    setFeedSort: (feedSort) => set({ feedSort }),

    // El filtro de orden es una preferencia de la vista, no un dato del usuario: se conserva.
    reset: () => set((state) => ({ ...initialState(), feedSort: state.feedSort, generation: state.generation + 1 })),
  };
});

// ---------------------------------------------------------------------------
// Hooks de lectura. Seleccionan referencias estables del store y arman los
// arreglos con useMemo, para no crear un arreglo nuevo en cada render.
// ---------------------------------------------------------------------------

function idsToMemes(ids: string[], byId: Record<string, Meme>): Meme[] {
  return ids.map((id) => byId[id]).filter((meme): meme is Meme => meme !== undefined);
}

export function useMemeList(key: MemeListKey) {
  const list = useMemeStore((state) => state.lists[key]) ?? EMPTY_LIST;
  const byId = useMemeStore((state) => state.byId);
  const memes = useMemo(() => idsToMemes(list.ids, byId), [list.ids, byId]);
  return { memes, loading: list.loading, loaded: list.loaded, error: list.error };
}

/** Feed principal con el filtro de orden aplicado. */
export function useFeed() {
  const feed = useMemeList('feed');
  const sort = useMemeStore((state) => state.feedSort);
  const memes = useMemo(() => {
    if (sort === 'recent') return feed.memes;
    return [...feed.memes].sort((a, b) => b.score - a.score);
  }, [feed.memes, sort]);
  return { ...feed, memes, sort };
}

export function useRanking(variant: RankingVariant) {
  const ranking = useMemeStore((state) => state.rankings[variant]);
  const byId = useMemeStore((state) => state.byId);
  const memes = useMemo(() => idsToMemes(ranking.ids, byId), [ranking.ids, byId]);
  return { ...ranking, memes };
}

export function useMeme(memeId: string | null | undefined): Meme | undefined {
  return useMemeStore((state) => (memeId ? state.byId[memeId] : undefined));
}

export function useComments(memeId: string): CommentsState {
  return useMemeStore((state) => state.comments[memeId]) ?? EMPTY_COMMENTS;
}
