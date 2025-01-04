import React, { useState, useEffect } from 'react';
import './Header.css';
import { firebaseAuthService } from '../services/firebaseService';
import Swal from 'sweetalert2';
import { NavLink } from 'react-router-dom';

const Header = ({ handleLogout }) => {
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
          PROMETHEO
        </NavLink>
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
            <a href="#" onClick={() => toggleSubmenu('contabilidad')}>
              Contabilidad
            </a>
            {activeSubmenu === 'contabilidad' && (
             <ul className="submenu">
             <li>
               <NavLink to="/contabilidad" onClick={() => setMenuOpen(false)}>
                 Agregar cliente
               </NavLink>
             </li>
             <li>
               <NavLink to="/agregarpago" onClick={() => setMenuOpen(false)}>
                 Registrar pagos
               </NavLink>
             </li>
             <li>
               <NavLink to="/editarusuario" onClick={() => setMenuOpen(false)}>
                 Consultar & Editar
               </NavLink>
             </li>
           </ul>
            )}
          </li>
          <li>
            <a href="#" onClick={() => toggleSubmenu('reportes')}>
              Reportes
            </a>
            {activeSubmenu === 'reportes' && (
              <ul className="submenu">
                <li>
                  <NavLink to="/consulta-procesos" onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? "active-link" : "")}>
                    Procesos
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/consulta-pagos" onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? "active-link" : "")}>
                    Consultar Asociaciones
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/consulta-pagos-Contraios" onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? "active-link" : "")}>
                    Consultar sin asociaciones
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/consulta-compartidos" onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? "active-link" : "")}>
                    Consultar compartidos
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/reportes/general" onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? "active-link" : "")}>
                    General
                  </NavLink>
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
              className="nav__NavLink nav__NavLink--button" 
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


// /consulta-pagos-Contraios