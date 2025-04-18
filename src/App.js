// App.js
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { login, logout, setLoading } from './redux/authSlice';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, app } from './firebase/firebaseConfig';
import Header from './shared/Header';
import Login from './auth/Login';
import Register from './auth/registeer';
import Dashboard from './components/Dashboard';
import Eventos from './components/Eventos';
import Certificaciones from './components/Certificaciones';
import Perfil from './components/Perfil';
import Cliente from './components/Cliente';  // Importa el componente Cliente
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PagosEspecificos from './components/PagosEspecificos';
import Contabilidad from './components/Contabilidad';
import ListaUsuarios from './components/ListaUsuarios';
import FormularioEdicionUsuario from './components/FormularioEdicionUsuario';
import ProcesosTablaCompleta from './components/ProcesosTablaCompleta';
import ComentariosTabla from './components/resumentTablas';
import PagosBusqueda from './components/resumentTablas';
import ConsultaPagosfucntion from './components/resumentTablas';
import ConsultaPagosContrario from './components/resumenTablaContrario';
import ConsultaCompartidos from './components/consultacompartidos';
import ConsultaNopagos from './components/Consultanopagos';
import SubirExcel from './admin/cargarNuevosDatos';
import SubirExcelCausante from './admin/SubirExcelCausante';
import SubirDatosNoRelacionados from './admin/subirdatosnorelacionados';
import DocumentosSoporte from './components/DocumentosSoporte';
import ProtectedRoute from './auth/ProtectedRoute';
import Unauthorized from './auth/Unauthorized';

function App() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setLoading(true));
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Consulta el rol del usuario desde Firestore
        const docRef = doc(db, "rol", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userRole = docSnap.data().nivel;
          dispatch(login({ userRole }));
          console.log("Usuario logueado con rol:", userRole);
        } else {
          dispatch(logout());
          console.log("Documento de rol no encontrado, usuario deslogueado.");
        }
      } else {
        dispatch(logout());
        console.log("Usuario no autenticado.");
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  return (
    <Router>
      <div className="App">
        {!isAuthenticated ? (
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/*" element={<Login />} />
          </Routes>
        ) : (
          <>
            <Header handleLogout={() => dispatch(logout())} />
            <main>
              <Routes>
                <Route path="/unauthorized" element={<Unauthorized />} />
                
                {/* Rutas para administradores y contables */}
                <Route
                  path="/certificaciones"
                  element={
                    <ProtectedRoute requiredRole={["administrador", "contable"]}>
                      <Certificaciones />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/agregarpago"
                  element={
                    <ProtectedRoute requiredRole={["administrador", "contable"]}>
                      <ListaUsuarios />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/editarusuario"
                  element={
                    <ProtectedRoute requiredRole={["administrador", "contable"]}>
                      <FormularioEdicionUsuario />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/consultas"
                  element={
                    <ProtectedRoute requiredRole={["administrador", "contable"]}>
                      <Eventos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/consulta-procesos"
                  element={
                    <ProtectedRoute requiredRole={["administrador", "contable"]}>
                      <ProcesosTablaCompleta />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/consulta-pagos"
                  element={
                    <ProtectedRoute requiredRole={["administrador", "contable"]}>
                      <ConsultaPagosfucntion />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/consulta-pagos-Contraios"
                  element={
                    <ProtectedRoute requiredRole={["administrador", "contable"]}>
                      <ConsultaPagosContrario />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/consulta-compartidos"
                  element={
                    <ProtectedRoute requiredRole={["administrador", "contable"]}>
                      <ConsultaCompartidos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/consulta-nopagos"
                  element={
                    <ProtectedRoute requiredRole={["administrador", "contable"]}>
                      <ConsultaNopagos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/perfil"
                  element={
                    <ProtectedRoute requiredRole={["administrador", "contable"]}>
                      <Perfil />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pagosespecificos"
                  element={
                    <ProtectedRoute requiredRole={["administrador", "contable"]}>
                      <PagosEspecificos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contabilidad"
                  element={
                    <ProtectedRoute requiredRole={["administrador", "contable"]}>
                      <Contabilidad />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/documentosSoporte"
                  element={
                    <ProtectedRoute requiredRole={["administrador", "contable"]}>
                      <DocumentosSoporte />
                    </ProtectedRoute>
                  }
                />
                
                {/* Ruta para clientes */}
                <Route
                  path="/cliente"
                  element={
                    <ProtectedRoute requiredRole="cliente">
                      <Cliente />
                    </ProtectedRoute>
                  }
                />

                {/* Ruta por defecto (puedes personalizarla según el rol) */}
                <Route
                  path="/"
                  element={
                    // Ejemplo: Si el usuario es cliente, se le puede redirigir a /cliente.
                    <ProtectedRoute requiredRole={["administrador", "contable", "cliente"]}>
                      <Cliente />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </>
        )}
      </div>
    </Router>
  );
}

export default App;
