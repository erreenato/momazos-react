import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Alert } from '@mui/material';
import type { User } from '../types';
import { LoadingState } from './ui/LoadingState';

interface ProtectedRouteProps {
  /** Si se indica, además de tener sesión el usuario debe tener este rol. */
  role?: User['role'];
}

/** Envuelve rutas que exigen sesión. Sin sesión redirige a /login y recuerda a dónde se quería ir. */
export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState message="Cargando sesión…" />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role && user.role !== role) {
    return (
      <Alert severity="warning" sx={{ m: 3, width: '100%', maxWidth: 520 }}>
        No tienes permisos para ver esta página.
      </Alert>
    );
  }

  return <Outlet />;
}
