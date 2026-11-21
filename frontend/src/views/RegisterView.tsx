import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Link as MuiLink, TextField } from '@mui/material';
import { useAuth } from '../auth/useAuth';
import { FormCard } from '../components/ui/FormCard';

const MIN_PASSWORD_LENGTH = 6;

interface LocationState {
  from?: string;
}

export function RegisterView() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setSubmitting(true);
    try {
      await register({ username: username.trim(), email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  // Validación visual en vivo: se marca el campo apenas las contraseñas dejan de coincidir.
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <FormCard
      title="Crear cuenta"
      subtitle="Únete a Momazos en menos de un minuto"
      onSubmit={handleSubmit}
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <MuiLink component={Link} to="/login" state={location.state} sx={{ fontWeight: 600 }}>
            Inicia sesión
          </MuiLink>
        </>
      }
    >
      <TextField
        id="register-username"
        label="Nombre de usuario"
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <TextField
        id="register-email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <TextField
        id="register-password"
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        helperText={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
        slotProps={{ htmlInput: { minLength: MIN_PASSWORD_LENGTH } }}
        required
      />

      <TextField
        id="register-confirm"
        label="Repite la contraseña"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={passwordsMismatch}
        helperText={passwordsMismatch ? 'Las contraseñas no coinciden' : ' '}
        slotProps={{ htmlInput: { minLength: MIN_PASSWORD_LENGTH } }}
        required
      />

      {error && <Alert severity="error">{error}</Alert>}

      <Button type="submit" variant="contained" size="large" loading={submitting}>
        Registrarme
      </Button>
    </FormCard>
  );
}
