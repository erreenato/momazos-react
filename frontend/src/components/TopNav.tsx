import { NavLink } from 'react-router-dom';
import { mockUsers } from '../mockData';
import './TopNav.css';

const CURRENT_USER = mockUsers[0];

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M12 15V8M8.5 11.5 12 8l3.5 3.5" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4.5A1.5 1.5 0 0 0 3 6.5 3.5 3.5 0 0 0 6.5 10H7M17 5h2.5A1.5 1.5 0 0 1 21 6.5 3.5 3.5 0 0 1 17.5 10H17" />
      <path d="M12 14v3M9 20.5h6M9.5 20.5c0-1.8.7-2.7 2.5-3 1.8.3 2.5 1.2 2.5 3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 8.5-4.1-1.1-7-4.3-7-8.5V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

const NAV_ITEMS = [
  { label: 'Inicio', icon: HomeIcon, to: '/' },
  { label: 'Subir Meme', icon: UploadIcon, to: '/subir' },
  { label: 'Ranking Memes', icon: TrophyIcon, to: '/ranking' },
  { label: 'Moderación', icon: ShieldIcon, to: '/moderacion' },
];

export function TopNav() {
  return (
    <header className="top-nav">
      <NavLink to="/" className="top-nav-brand">
        moma<span>zos</span>
      </NavLink>

      <nav className="top-nav-links" aria-label="Navegación principal">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={label}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `top-nav-item${isActive ? ' active' : ''}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <NavLink to="/perfil" className={({ isActive }) => `top-nav-user${isActive ? ' active' : ''}`}>
        <span className="top-nav-avatar">{CURRENT_USER.username.charAt(0).toUpperCase()}</span>
        <span>@{CURRENT_USER.username}</span>
      </NavLink>
    </header>
  );
}
