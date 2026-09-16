import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { RankingView } from './views/RankingView';
import './App.css';

function App() {
  const [currentTab, setCurrentTab] = useState<string>('ranking');

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <Navbar activeTab={currentTab} setActiveTab={setCurrentTab} />

      <main style={{ padding: '0 1rem' }}>
        {currentTab === 'inicio' && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h2>🏠 Vista de Inicio</h2>
          </div>
        )}

        {currentTab === 'publicar' && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h2>➕ Vista Subir Meme</h2>
          </div>
        )}

        {currentTab === 'moderar' && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h2>🛡️ Vista Moderación</h2>
          </div>
        )}

        {currentTab === 'ranking' && <RankingView />}
      </main>
    </div>
  );
}

export default App;