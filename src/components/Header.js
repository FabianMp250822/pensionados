import React, { useState } from 'react';
import './Header.css';
import { firebaseAuthService } from '../services/firebaseService';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';

const Header = ({ handleLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);

  const onLogout = async () => {
    try {
      await firebaseAuthService.logout();
      Swal.fire({
        title: 'Logout Exitoso',
        text: 'Has cerrado sesión correctamente',
        icon: 'success',
        confirmButtonText: 'OK',
      });
      handleLogout();
    } catch (error) {
      Swal.fire({
        title: 'Error al cerrar sesión',
        text: error.message,
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleSubmenu = (e) => {
    e.preventDefault(); // Prevenir comportamiento predeterminado
    setSubmenuOpen(!submenuOpen);
  };

  return (
    <header className="header">
      {/* Logo */}
      <div className="header__logo">
        <img
          src="https://i.ibb.co/GF3Dkfq/Captura-desde-2024-10-10-12-21-05.png"
          alt="Día Mundial 2024 Logo"
          className="header__logo-image"
        />
      </div>

      {/* Menú de navegación */}
      <nav className={`nav ${menuOpen ? 'nav--open' : ''}`}>
        <ul className="nav__list">
          <li className="nav__item">
            <Link
              to="/consultas"
              className="nav__link"
              onClick={() => setMenuOpen(false)}
            >
              Realizar Consultas
            </Link>
          </li>
          <li className="nav__item">
            <Link
              to="/pagosespecificos"
              className="nav__link"
              onClick={() => setMenuOpen(false)}
            >
              Consulta Sentencias
            </Link>
          </li>
          <li className="nav__item nav__item--has-submenu">
            <a href="#" className="nav__link" onClick={toggleSubmenu}>
              Nuevo Clientes
            </a>
            {submenuOpen && (
              <ul className="submenu">
                <li className="submenu__item">
                  <Link
                    to="/contabilidad"
                    className="submenu__link"
                    onClick={() => setMenuOpen(false)}
                  >
                    Agregar cliente
                  </Link>
                </li>
                <li className="submenu__item">
                  <Link
                    to="/agregarpago"
                    className="submenu__link"
                    onClick={() => setMenuOpen(false)}
                  >
                    Registrar pagos
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li className="nav__item nav__item--logout">
            <button
              onClick={onLogout}
              className="nav__link nav__link--button"
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>

      {/* Botón de menú móvil */}
      <button
        className={`menu-toggle ${menuOpen ? 'menu-toggle--open' : ''}`}
        onClick={toggleMenu}
      >
        <span className="menu-toggle__bar"></span>
        <span className="menu-toggle__bar"></span>
        <span className="menu-toggle__bar"></span>
      </button>
    </header>
  );
};

export default Header;
