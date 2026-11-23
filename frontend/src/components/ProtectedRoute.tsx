import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Alert } from '@mui/material';
import type { User } from '../types';
import { LoadingState } from './ui/LoadingState';

interface ProtectedRouteProps {
  role?: User['role'];
}

export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. Esperar mientras se restaura la sesión tras F5
  if (loading) {
    return <LoadingState message="Cargando sesión…" />;
  }

  // 2. Si no está autenticado, redirige a /login pasando la ruta original como string
  if (!user) {
  const returnTo = `${location.pathname}${location.search}${location.hash}`;

  return (
    <Navigate
      to="/login"
      state={{ from: returnTo }}
      replace
    />
  );
}

  // 3. Si la ruta exige rol de moderador y el usuario no lo tiene, muestra un aviso
  if (role && user.role !== role) {
    return (
      <Alert severity="warning" sx={{ m: 3, width: '100%', maxWidth: 520 }}>
        No tienes permisos para ver esta página.
      </Alert>
    );
  }

  // 4. Renderiza la ruta hija protegida
  return <Outlet />;
}