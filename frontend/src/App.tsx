import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TopNav } from './components/TopNav';
import { WeeklyRanking } from './components/WeeklyRanking';
import { mockMemes } from './mockData';
import { HomeView } from './views/HomeView';
import { MemeDetailView } from './views/MemeDetailView';
import { ModerationView } from './views/ModerationView';
import { ProfileView } from './views/ProfileView';
import { RankingView } from './views/RankingView';
import { SubirPost } from './views/SubirPost';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-page">
        <TopNav />
        <div className="app-shell">
          <div className="app-content">
            <Routes>
              <Route path="/" element={<HomeView />} />
              <Route path="/perfil" element={<ProfileView />} />
              <Route path="/perfil/:id" element={<ProfileView />} />
              <Route path="/subir" element={<SubirPost />} />
              <Route path="/moderacion" element={<ModerationView />} />
              <Route path="/ranking" element={<RankingView />} />
              <Route path="/meme/:id" element={<MemeDetailView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <WeeklyRanking memes={mockMemes} />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
