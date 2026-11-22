import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingStateProps {
  /** Texto bajo el spinner, por ejemplo "Cargando momazos…". */
  message?: string;
  /** Versión compacta para espacios chicos (ranking lateral, comentarios). */
  compact?: boolean;
}

/** Indicador de carga único para toda la app (guía visual: "indicadores de carga"). */
export function LoadingState({ message = 'Cargando…', compact = false }: LoadingStateProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: 'flex',
        flexDirection: compact ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? 1.5 : 2,
        py: compact ? 2 : 6,
        width: '100%',
        color: 'text.secondary',
      }}
    >
      <CircularProgress size={compact ? 20 : 36} />
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
}
