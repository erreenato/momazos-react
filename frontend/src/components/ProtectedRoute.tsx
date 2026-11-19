import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

interface ProtectedRouteProps {
  role?: 'user' | 'moderator';
}

export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { user, loading } = useAuth(); // Nota: verifica si en useAuth se llama 'loading' o 'isLoading'
  const location = useLocation();

  // 1. Esperar mientras se restaura la sesión tras F5
  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando sesión...</div>;
  }

  // 2. Si no está autenticado, redirige a /login pasando la ruta original como string
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 3. Si la ruta exige rol de moderador y el usuario no lo tiene, vuelve al inicio
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  // 4. Renderiza la ruta hija protegida
  return <Outlet />;
}