import { Link } from 'react-router-dom';

export function NotFoundView() {
  return (
    <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
      <h2>404 - Página no encontrada</h2>
      <p>La ruta que buscas no existe o fue movida.</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  );
}