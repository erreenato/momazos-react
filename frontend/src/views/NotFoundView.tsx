import { Link } from 'react-router-dom';
import caballoTriste from '../assets/caballo-triste.jpg';

export function NotFoundView() {
  return (
    <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
      <img
        src={caballoTriste}
        alt="Caballo triste porque no se encontró la página"
        style={{
          maxWidth: '300px',
          width: '100%',
          borderRadius: '12px',
          marginBottom: '1.5rem',
        }}
      />
      <h2>404 - Página no encontrada</h2>
      <p>La ruta que buscas no existe o fue movida.</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  );
}