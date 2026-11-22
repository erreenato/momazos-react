import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Link as MuiLink, TextField } from '@mui/material';
import { useAuth } from '../auth/useAuth';
import { FormCard } from '../components/ui/FormCard';

interface LocationState {
  from?: string;
}

export function LoginView() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormCard
      title="Iniciar sesión"
      subtitle="Entra para votar, comentar y subir tus momos"
      onSubmit={handleSubmit}
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <MuiLink component={Link} to="/registro" state={location.state} sx={{ fontWeight: 600 }}>
            Regístrate
          </MuiLink>
        </>
      }
    >
      <TextField
        id="login-email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <TextField
        id="login-password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {error && <Alert severity="error">{error}</Alert>}

      {/* loading: MUI muestra un spinner dentro del botón y lo deshabilita */}
      <Button type="submit" variant="contained" size="large" loading={submitting}>
        Entrar
      </Button>
    </FormCard>
  );
}
