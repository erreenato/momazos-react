import { useState } from 'react';
import type { ComponentType } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import type { SvgIconProps, Theme } from '@mui/material';
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import GppGoodRoundedIcon from '@mui/icons-material/GppGoodRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { useAuth } from '../auth/useAuth';

interface NavItem {
  label: string;
  icon: ComponentType<SvgIconProps>;
  to: string;
  moderatorOnly?: boolean;
  /** Otras rutas en las que este enlace también se marca como activo. */
  alsoActiveOn?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', icon: HomeRoundedIcon, to: '/' },
  { label: 'Subir Meme', icon: AddPhotoAlternateRoundedIcon, to: '/subir' },
  // El Anti-Ranking ya no tiene enlace propio: se entra con un botón dentro del Ranking.
  { label: 'Ranking Memes', icon: EmojiEventsRoundedIcon, to: '/ranking', alsoActiveOn: ['/anti-ranking'] },
  { label: 'Moderación', icon: GppGoodRoundedIcon, to: '/moderacion', moderatorOnly: true },
];

/** Estilo de un enlace de navegación; NavLink agrega la clase "active" a la ruta actual. */
const navButtonSx = {
  color: 'text.secondary',
  fontSize: 14,
  px: 1.75,
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
  '&.active': { bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.12)', color: 'primary.main' },
} as const;

function Brand() {
  return (
    <Typography
      component={NavLink}
      to="/"
      sx={{ fontWeight: 800, fontSize: 19, letterSpacing: '-0.3px', color: 'text.primary', textDecoration: 'none' }}
    >
      moma
      <Box component="span" sx={{ color: 'primary.main' }}>
        zos
      </Box>
    </Typography>
  );
}

export function TopNav() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // true en pantallas anchas (≥ 1200px): ahí caben los textos de los enlaces.
  const isWide = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));

  const handleLogout = async () => {
    setDrawerOpen(false);
    await logout();
    navigate('/login');
  };

  const { pathname } = useLocation();
  const visibleItems = NAV_ITEMS.filter((item) => !item.moderatorOnly || user?.role === 'moderator');
  // NavLink marca "active" solo en su propia ruta; esto agrega las rutas extra (alsoActiveOn).
  const extraActive = (alsoActiveOn?: string[]) =>
    alsoActiveOn?.some((path) => pathname.startsWith(path)) ? 'active' : undefined;

  const userAvatar = user && (
    <Avatar src={user.avatarUrl || undefined} alt="" sx={{ width: 28, height: 28, fontSize: 13, bgcolor: 'primary.main' }}>
      {user.username.charAt(0).toUpperCase()}
    </Avatar>
  );

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar sx={{ gap: 2, minHeight: { xs: 60 } }}>
        {/* Botón hamburguesa: solo en pantallas chicas */}
        <IconButton
          edge="start"
          aria-label="Abrir menú"
          onClick={() => setDrawerOpen(true)}
          sx={{ display: { xs: 'inline-flex', md: 'none' } }}
        >
          <MenuRoundedIcon />
        </IconButton>

        <Brand />

        {/* Enlaces horizontales: desde tablet grande hacia arriba.
            Entre md y lg solo se muestra el ícono (con Tooltip) para que la barra no se desborde. */}
        <Box component="nav" aria-label="Navegación principal" sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
          {visibleItems.map(({ label, icon: Icon, to, alsoActiveOn }) => (
            <Tooltip key={label} title={label} disableHoverListener={isWide}>
              <Button
                component={NavLink}
                to={to}
                end={to === '/'}
                className={extraActive(alsoActiveOn)}
                aria-label={label}
                startIcon={isWide ? <Icon /> : undefined}
                sx={{ ...navButtonSx, minWidth: 0 }}
              >
                {isWide ? label : <Icon />}
              </Button>
            </Tooltip>
          ))}
        </Box>

        <Box sx={{ flex: { xs: 1, md: 'none' } }} />

        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              component={NavLink}
              to="/perfil"
              variant="outlined"
              color="inherit"
              startIcon={userAvatar}
              sx={{
                borderColor: 'divider',
                minWidth: 0,
                pl: 0.75,
                // En móvil solo se ve el avatar: se quita el espacio sobrante del texto oculto.
                pr: { xs: 0.75, sm: 2 },
                '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 }, ml: 0 },
                '&.active': { borderColor: 'primary.main', color: 'primary.main' },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                @{user.username}
              </Box>
            </Button>
            {isWide ? (
              <Button variant="text" color="inherit" onClick={handleLogout} sx={{ color: 'text.secondary' }}>
                Cerrar sesión
              </Button>
            ) : (
              <Tooltip title="Cerrar sesión">
                <IconButton
                  onClick={handleLogout}
                  aria-label="Cerrar sesión"
                  sx={{ display: { xs: 'none', md: 'inline-flex' }, color: 'text.secondary' }}
                >
                  <LogoutRoundedIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ) : (
          !loading && (
            <Button component={NavLink} to="/login" variant="contained">
              Iniciar sesión
            </Button>
          )
        )}
      </Toolbar>

      {/* Menú lateral para móvil */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260, py: 2 }} role="presentation">
          <Box sx={{ px: 2.5, pb: 1.5 }}>
            <Brand />
          </Box>
          <Divider />
          <List>
            {visibleItems.map(({ label, icon: Icon, to, alsoActiveOn }) => (
              <ListItemButton
                key={label}
                component={NavLink}
                to={to}
                end={to === '/'}
                className={extraActive(alsoActiveOn)}
                onClick={() => setDrawerOpen(false)}
                sx={{ '&.active': { color: 'primary.main', '& .MuiListItemIcon-root': { color: 'primary.main' } } }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={label} />
              </ListItemButton>
            ))}
          </List>
          {user && (
            <>
              <Divider />
              <List>
                <ListItemButton onClick={handleLogout}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <LogoutRoundedIcon />
                  </ListItemIcon>
                  <ListItemText primary="Cerrar sesión" />
                </ListItemButton>
              </List>
            </>
          )}
        </Box>
      </Drawer>
    </AppBar>
  );
}
