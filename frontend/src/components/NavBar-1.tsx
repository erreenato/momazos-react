import './NavBarStyle.css';

export function Navbar() {
  return (
    <header className="navbar">
      <a href="#" className="navbar-logo">
        Momardos Reactivos
      </a>

      <nav>
        <ul className="navbar-links">
          <li><a href="#">Inicio</a></li>

          {/* Aquí debería ir una comprobación del usuario si es admin o non */}
          <li><a href="#">Moderación</a></li>

          <li><a href="#">Subir Meme</a></li>
          <li><a href="#">Ranking</a></li>
        </ul>
      </nav>

      <div className="navbar-user">
        <button className="user-profile-button">
            <span>👤 @MemeLord99</span>
        </button>
      </div>
    </header>
  );
}
