import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { login, logout } from './redux/authSlice';
import { firebaseAuthService } from './services/firebaseService';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Eventos from './components/Eventos';
import Certificaciones from './components/Certificaciones';
import Perfil from './components/Perfil';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Cambiamos Switch a Routes
import PagosEspecificos from './components/PagosEspecificos';
import Contabilidad from './components/Contabilidad';
import ListaUsuarios from './components/ListaUsuarios';

function App() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const dispatch = useDispatch();

  const handleLogin = () => {
    dispatch(login());
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  useEffect(() => {
    const unsubscribe = firebaseAuthService.onAuthStateChanged((user) => {
      if (user) {
        dispatch(login());
      } else {
        dispatch(logout());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return (
    <Router>
      <div className="App">
        {!isAuthenticated ? (
          <Login handleLogin={handleLogin} />
        ) : (
          <>
            <Header handleLogout={handleLogout} />
            <main>
              <Routes> {/* Cambiamos Switch a Routes */}
                <Route path="/certificaciones" element={<Certificaciones />} />
                <Route path="/agregarpago" element={<ListaUsuarios />} />
                <Route path="/consultas" element={<Eventos />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/pagosespecificos" element={<PagosEspecificos />} />
                <Route path="/contabilidad" element={<Contabilidad />} />
                <Route path="/" element={<Eventos />} /> {/* Ruta por defecto */}
              </Routes>
            </main>
          </>
        )}
      </div>
    </Router>
  );
}

export default App;
