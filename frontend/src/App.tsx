
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TopNav } from './components/TopNav';
import { WeeklyRanking } from './components/WeeklyRanking';
import { useMemes } from './memeStore';
import { HomeView } from './views/HomeView';
import { LoginView } from './views/LoginView';
import { MemeDetailView } from './views/MemeDetailView';
import { ModerationView } from './views/ModerationView';
import { ProfileView } from './views/ProfileView';
import { RankingView } from './views/RankingView';
import { RegisterView } from './views/RegisterView';
import { SubirPost } from './views/SubirPost';
import './App.css';

function App() {
  const memes = useMemes();

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-page">
          <TopNav />
          <div className="app-shell">
            <div className="app-content">
              <Routes>
                <Route path="/" element={<HomeView />} />
                <Route path="/ranking" element={<RankingView />} />
                <Route path="/meme/:id" element={<MemeDetailView />} />
                <Route path="/login" element={<LoginView />} />
                <Route path="/registro" element={<RegisterView />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/perfil" element={<ProfileView />} />
                  <Route path="/perfil/:id" element={<ProfileView />} />
                  <Route path="/subir" element={<SubirPost />} />
                </Route>

                <Route element={<ProtectedRoute role="moderator" />}>
                  <Route path="/moderacion" element={<ModerationView />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <WeeklyRanking memes={memes} />
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
