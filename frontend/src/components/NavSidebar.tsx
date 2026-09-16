import './NavSidebar.css';

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
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

const NAV_ITEMS = [
  { label: 'Inicio', icon: HomeIcon },
  { label: 'Perfil', icon: UserIcon },
  { label: 'Subir Meme', icon: UploadIcon },
  { label: 'Ranking Memes', icon: TrophyIcon },
];

export function NavSidebar() {
  return (
    <nav className="app-nav" aria-label="Navegación principal">
      <div className="app-nav-brand">
        moma<span>zos</span>
      </div>
      <ul className="app-nav-list">
        {NAV_ITEMS.map(({ label, icon: Icon }) => (
          <li key={label}>
            <button type="button" className="app-nav-item">
              <span className="app-nav-icon">
                <Icon />
              </span>
              <span className="app-nav-label">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
