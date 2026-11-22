import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

interface EmptyStateProps {
  /** Emoji o ícono grande que acompaña el mensaje. */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Acción opcional, por ejemplo un botón "Subir meme". */
  action?: ReactNode;
  compact?: boolean;
}

/** Estado vacío único para toda la app (guía visual: "estados vacíos"). */
export function EmptyState({ icon = '🫥', title, description, action, compact = false }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 1,
        py: compact ? 2 : 6,
        px: 2,
        width: '100%',
        color: 'text.secondary',
      }}
    >
      <Box component="span" aria-hidden="true" sx={{ fontSize: compact ? 28 : 44, lineHeight: 1 }}>
        {icon}
      </Box>
      <Typography variant={compact ? 'body2' : 'h4'} color="text.primary">
        {title}
      </Typography>
      {description && <Typography variant="body2">{description}</Typography>}
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
}
