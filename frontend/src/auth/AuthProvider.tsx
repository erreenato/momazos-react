import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * El estado de sesión vive en Zustand (`useAuthStore`). Este componente ya no guarda
 * estado propio: solo dispara la restauración de la sesión al montar la app (tras un F5).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  return <>{children}</>;
}
