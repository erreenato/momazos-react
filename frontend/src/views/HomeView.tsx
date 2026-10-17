import { useMemes } from '../memeStore';
import { MemeFeed } from './MemeDetailView';
import './HomeViewStyle.css';

export function HomeView() {
  const approvedMemes = useMemes().filter((meme) => meme.status === 'approved');

  return (
    <div className="home-container">
      <h2 className="home-decoration">────୨ৎ────</h2>
      <h3 className="home-title">¡Bienvenido!</h3>
      {approvedMemes.length === 0 ? (
        <p className="home-empty">Todavía no hay momos aprobados.</p>
      ) : (
        <MemeFeed memes={approvedMemes} />
      )}
    </div>
  );
}