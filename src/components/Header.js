import React, { useState, useEffect } from 'react';
import './Header.css';
import { firebaseAuthService } from '../services/firebaseService';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';

const Header = ({ handleLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState({});
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const headerElement = document.querySelector('.header');
    if (headerElement) {
      setHeaderHeight(headerElement.offsetHeight);
    }
  }, []);

  const toggleSubmenu = (menu) => {
    setSubmenuOpen((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

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

  return (
    <>
      <header className="header" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 10 }}>
        <Link to="/" className="logo">
          PROMETHEO
        </Link>
        <input
          className="menu-btn"
          type="checkbox"
          id="menu-btn"
          checked={menuOpen}
          onChange={() => setMenuOpen(!menuOpen)}
        />
        <label className="menu-icon" htmlFor="menu-btn">
          <span className="navicon"></span>
        </label>
        <ul className="menu">
          <li>
            <Link to="/consultas" onClick={() => setMenuOpen(false)}>
              Consulta de pagos
            </Link>
          </li>
          <li>
            <Link to="/pagosespecificos" onClick={() => setMenuOpen(false)}>
              Consulta Sentencias
            </Link>
          </li>
          <li>
            <a href="#" onClick={() => toggleSubmenu('contabilidad')}>
              Contabilidad
            </a>
            {submenuOpen['contabilidad'] && (
              <ul className="submenu">
                <li>
                  <Link to="/contabilidad" onClick={() => setMenuOpen(false)}>
                    Agregar cliente
                  </Link>
                </li>
                <li>
                  <Link to="/agregarpago" onClick={() => setMenuOpen(false)}>
                    Registrar pagos
                  </Link>
                </li>
                <li>
                  <Link to="/editarusuario" onClick={() => setMenuOpen(false)}>
                    Consultar & Editar
                  </Link>
                </li>
              </ul>
            )}
          </li>
          {/* Nuevo Menú "Reportes" */}
          <li>
            <a href="#" onClick={() => toggleSubmenu('reportes')}>
              Reportes
            </a>
            {submenuOpen['reportes'] && (
              <ul className="submenu">
                <li>
                  <Link to="/consulta-procesos" onClick={() => setMenuOpen(false)}>
                    Procesos
                  </Link>
                </li>
                <li>
                  <Link to="/reportes/pagos" onClick={() => setMenuOpen(false)}>
                    Pagos
                  </Link>
                </li>
                <li>
                  <Link to="/reportes/general" onClick={() => setMenuOpen(false)}>
                    General
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li>
            <button
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
              className="nav__link nav__link--button"
            >
              Logout
            </button>
          </li>
        </ul>
      </header>
      <div style={{ marginTop: `${headerHeight}px` }}></div>
    </>
  );
};

export default Header;
