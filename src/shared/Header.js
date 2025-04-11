import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import Swal from 'sweetalert2';
import { firebaseAuthService } from '../services/firebaseService';
import './Header.css';

const Header = ({ handleLogout }) => {
  const { userRole } = useSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const headerElement = document.querySelector('.header');
    if (headerElement) {
      setHeaderHeight(headerElement.offsetHeight);
    }
  }, []);

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

  const toggleSubmenu = (submenu) => {
    setActiveSubmenu(prev => (prev === submenu ? null : submenu));
  };

  return (
    <>
      <header className="header" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 10 }}>
        <NavLink to="/" className="logo">
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/pensionados-d82b2.appspot.com/o/Captura%20desde%202025-02-12%2014-38-01.png?alt=media&token=85350e0f-d5fd-45fa-a7bd-8764d34c123b"
            alt="Logo" 
            style={{ width: '220px', height: 'auto' }}
          />
        </NavLink>

        {/* Ícono de menú para vista móvil */}
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

        {/* Menú principal */}
        <ul className="menu">
          {/* Ítems para administrador/contable */}
          {['administrador', 'contable'].includes(userRole) && (
            <>
              <li>
                <NavLink to="/consultas" onClick={() => setMenuOpen(false)}>
                  Consulta de pagos
                </NavLink>
              </li>
              <li>
                <NavLink to="/pagosespecificos" onClick={() => setMenuOpen(false)}>
                  Consulta Sentencias
                </NavLink>
              </li>
              <li>
                <NavLink to="/contabilidad" onClick={() => setMenuOpen(false)}>
                  Contabilidad
                </NavLink>
              </li>
              <li>
              <NavLink
                  to="#"
                  className="submenu-toggle"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSubmenu('reportes');
                  }}
                >
                  Reportes
                </NavLink>
                {activeSubmenu === 'reportes' && (
                  <ul className="submenu">
                    <li>
                      <NavLink to="/consulta-procesos" onClick={() => setMenuOpen(false)}>
                        Procesos
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/consulta-pagos" onClick={() => setMenuOpen(false)}>
                        Consultar Asociaciones
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/consulta-pagos-Contraios" onClick={() => setMenuOpen(false)}>
                        Consultar sin asociaciones
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/consulta-compartidos" onClick={() => setMenuOpen(false)}>
                        Consultar compartidos
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/consulta-nopagos" onClick={() => setMenuOpen(false)}>
                        NO pagos
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/reportes/general" onClick={() => setMenuOpen(false)}>
                        General
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>
            </>
          )}

          {/* Ítems para cliente */}
          {userRole === 'cliente' && (
            <>
              <li>
                <NavLink to="/cliente" onClick={() => setMenuOpen(false)}>
                  Mi Perfil
                </NavLink>
              </li>
              {/* Agrega aquí más enlaces para cliente si lo deseas */}
            </>
          )}

          {/* Botón de Logout (aparece siempre) */}
          <li className="logout-item">
            <NavLink
              to="#"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                onLogout();
              }}
              className="logout-link"
            >
              Logout
            </NavLink>
          </li>
        </ul>
      </header>
      {/* Para que el contenido no quede detrás del header fijo */}
      <div style={{ marginTop: `${headerHeight}px` }}></div>
    </>
  );
};

export default Header;
