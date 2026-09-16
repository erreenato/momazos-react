import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { NavSidebar } from './components/NavSidebar';
import { WeeklyRanking } from './components/WeeklyRanking';
import { mockMemes } from './mockData';
import { MemeDetailView } from './views/MemeDetailView';
import './App.css';

function App() {
  const firstMemeId = mockMemes[0]?.id ?? '';

  return (
    <BrowserRouter>
      <div className="app-shell">
        <NavSidebar />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Navigate to={`/meme/${firstMemeId}`} replace />} />
            <Route path="/meme/:id" element={<MemeDetailView />} />
            <Route path="*" element={<Navigate to={`/meme/${firstMemeId}`} replace />} />
          </Routes>
        </div>
        <WeeklyRanking memes={mockMemes} />
      </div>
    </BrowserRouter>
  );
}

export default App;
