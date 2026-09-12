import './App.css';
import { useState } from 'react';
import SubirPost from "../src/components/SubirPost/SubirPost";
import { mockUsers, mockMemes } from './mockData';
import type { Meme } from './types';
import MemeCard from './components/MemeCard';

function App() {
  const [memes, setMemes] = useState<Meme[]>(mockMemes);
  const currentUser = mockUsers[0]; // placeholder hasta que exista login real

  const handleMemeSubmit = (meme: Meme) => {
    setMemes((currentMemes) => [meme, ...currentMemes]);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <SubirPost currentUser={currentUser} onSubmit={handleMemeSubmit} submitText="Publicar momo" />

      <h2>Memes actuales ({memes.length})</h2>
      <div className="meme-grid">
        {memes.map((meme) => (
          <MemeCard key={meme.id} meme={meme} />
      ))}
      </div>
    </div>
  );
}

export default App;
