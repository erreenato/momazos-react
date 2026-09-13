interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const navItems = [
    { id: 'publicar', label: '➕ Publicar' },
    { id: 'moderar', label: '🛡️ Moderar' },
    { id: 'ranking', label: '🏆 Ranking' },
  ];

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      backgroundColor: '#141414',
      borderBottom: '1px solid #2a2a2a',
      marginBottom: '2rem'
    }}>
      {/* Click en el logo lleva al inicio */}
      <h1 
        onClick={() => setActiveTab('inicio')}
        style={{ 
          margin: 0, 
          fontSize: '1.4rem', 
          color: '#00ff88', 
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        Momazos React
      </h1>
      
      {/* Links centrales de navegación */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              backgroundColor: activeTab === item.id ? '#00ff88' : 'transparent',
              color: activeTab === item.id ? '#000' : '#ccc',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontWeight: activeTab === item.id ? 'bold' : 'normal',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Botón superior derecho de Perfil */}
      <button
        onClick={() => setActiveTab('perfil')}
        style={{
          backgroundColor: activeTab === 'perfil' ? '#00ff88' : '#222',
          color: activeTab === 'perfil' ? '#000' : '#fff',
          border: '1px solid #333',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <span>👤</span> Mi Perfil
      </button>
    </nav>
  );
}