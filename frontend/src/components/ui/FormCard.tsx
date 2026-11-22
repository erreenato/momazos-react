import type { FormEvent, ReactNode } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';

interface FormCardProps {
  title: string;
  subtitle?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  /** Campos y botones del formulario. */
  children: ReactNode;
  /** Contenido bajo el formulario (por ejemplo "¿No tienes cuenta? Regístrate"). */
  footer?: ReactNode;
  maxWidth?: number;
}

/**
 * Contenedor común de formularios (login, registro, subir meme).
 * Garantiza el mismo ancho, padding, título y separación entre campos en todas las vistas.
 */
export function FormCard({ title, subtitle, onSubmit, children, footer, maxWidth = 420 }: FormCardProps) {
  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', py: { xs: 2, sm: 4 } }}>
      <Paper variant="outlined" sx={{ width: '100%', maxWidth, p: { xs: 2.5, sm: 4 }, borderRadius: 5 }}>
        <Typography variant="h2" component="h2" align="center" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            {subtitle}
          </Typography>
        )}

        <Stack component="form" spacing={2} onSubmit={onSubmit} noValidate={false} sx={{ mt: 2 }}>
          {children}
        </Stack>

        {footer && (
          <Typography variant="body2" align="center" sx={{ mt: 3 }}>
            {footer}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
