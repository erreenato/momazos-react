import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import type { User } from '../types';

interface ProtectedRouteProps {
  /** Si se indica, además de tener sesión el usuario debe tener este rol. */
  role?: User['role'];
}

/** Envuelve rutas que exigen sesión. Sin sesión redirige a /login y recuerda a dónde se quería ir. */
export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="route-status">Cargando sesión…</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role && user.role !== role) {
    return <p className="route-status">No tienes permisos para ver esta página.</p>;
  }

  return <Outlet />;
}
