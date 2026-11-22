import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import { theme } from './theme/theme'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* ThemeProvider entrega el tema de MUI a toda la app; CssBaseline normaliza estilos base. */}
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
