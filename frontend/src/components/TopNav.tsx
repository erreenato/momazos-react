import { useState } from 'react';
import type { ComponentType } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  SvgIcon,
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

/** Material Icons no trae calavera: se reutiliza el SVG original dentro de SvgIcon. */
function SkullIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3c-4.4 0-7.5 3-7.5 7.2 0 2.4 1 4 2.3 5.1.5.4.7.9.7 1.5V18a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5v-1.2c0-.6.2-1.1.7-1.5 1.3-1.1 2.3-2.7 2.3-5.1C19.5 6 16.4 3 12 3zM11 19.5h2"
      />
      <circle cx="9" cy="11" r="1.4" />
      <circle cx="15" cy="11" r="1.4" />
    </SvgIcon>
  );
}

interface NavItem {
  label: string;
  icon: ComponentType<SvgIconProps>;
  to: string;
  moderatorOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', icon: HomeRoundedIcon, to: '/' },
  { label: 'Subir Meme', icon: AddPhotoAlternateRoundedIcon, to: '/subir' },
  { label: 'Ranking Memes', icon: EmojiEventsRoundedIcon, to: '/ranking' },
  { label: 'Anti-Ranking', icon: SkullIcon, to: '/anti-ranking' },
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

  const visibleItems = NAV_ITEMS.filter((item) => !item.moderatorOnly || user?.role === 'moderator');

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
          {visibleItems.map(({ label, icon: Icon, to }) => (
            <Tooltip key={label} title={label} disableHoverListener={isWide}>
              <Button
                component={NavLink}
                to={to}
                end={to === '/'}
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
            {visibleItems.map(({ label, icon: Icon, to }) => (
              <ListItemButton
                key={label}
                component={NavLink}
                to={to}
                end={to === '/'}
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
