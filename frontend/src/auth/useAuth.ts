import { useShallow } from 'zustand/react/shallow';
import { useAuthStore, type RegisterData } from '../stores/authStore';
import type { User } from '../types';

export type { RegisterData };

export interface AuthValue {
  user: User | null;
  /** true mientras se consulta /auth/me al cargar la app. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Atajo sobre el store de Zustand con la misma forma que tenía el antiguo AuthContext,
 * para que las vistas no tengan que cambiar. Ya no hay un estado de React aparte:
 * todo sale de `useAuthStore`, así contexto y store no pueden contradecirse.
 */
export function useAuth(): AuthValue {
  return useAuthStore(
    useShallow((state) => ({
      user: state.user,
      loading: state.status === 'restoring',
      login: state.login,
      register: state.register,
      logout: state.logout,
    })),
  );
}
