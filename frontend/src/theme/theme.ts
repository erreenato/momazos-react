import { createTheme } from '@mui/material/styles';

/**
 * Tema visual global de Momazos (Material UI).
 *
 * - `colorSchemes` define la paleta clara y la oscura. MUI elige una u otra según
 *   la preferencia del sistema operativo (prefers-color-scheme).
 * - `cssVariables: true` hace que MUI publique toda la paleta como variables CSS
 *   (`--mui-palette-primary-main`, etc.). index.css usa esas variables para que el
 *   CSS antiguo y los componentes MUI compartan exactamente los mismos colores.
 */
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'media' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#8900ff', light: '#aa3bff', dark: '#6a00c7', contrastText: '#ffffff' },
        secondary: { main: '#00a6dd', contrastText: '#ffffff' },
        success: { main: '#16a34a' },
        error: { main: '#dc2626' },
        warning: { main: '#f59f00' },
        background: { default: '#f4f3ec', paper: '#ffffff' },
        text: { primary: '#08060d', secondary: '#6b6375' },
        divider: '#e5e4e7',
      },
    },
    dark: {
      palette: {
        primary: { main: '#b366ff', light: '#c084fc', dark: '#8900ff', contrastText: '#ffffff' },
        secondary: { main: '#00c2ff', contrastText: '#08060d' },
        success: { main: '#22c55e' },
        error: { main: '#f87171' },
        warning: { main: '#fbbf24' },
        background: { default: '#1f2028', paper: '#16171d' },
        text: { primary: '#f3f4f6', secondary: '#9ca3af' },
        divider: '#2e303a',
      },
    },
  },

  // Tipografía: Inter (cargada con @fontsource/inter en main.tsx).
  typography: {
    fontFamily: "'Inter', system-ui, 'Segoe UI', Roboto, sans-serif",
    h1: { fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.3rem', fontWeight: 700 },
    h4: { fontSize: '1.1rem', fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },

  // Bordes redondeados y escala de espaciado (1 unidad = 8px).
  shape: { borderRadius: 12 },
  spacing: 8,

  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        // Botones tipo "píldora", como el diseño original.
        root: { borderRadius: 999, paddingInline: 18 },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          borderRadius: 20,
          transition: 'box-shadow 0.2s, border-color 0.2s',
        },
      },
    },
    MuiTextField: {
      defaultProps: { fullWidth: true, variant: 'outlined' },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 20 } },
    },
    MuiTableCell: {
      styleOverrides: { head: { fontWeight: 700 } },
    },
  },
});
