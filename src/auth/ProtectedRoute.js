import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, userRole, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    // Muestra un estado de carga mientras se obtiene el rol del usuario
    return <div>Cargando permisos...</div>;
  }

  if (!isAuthenticated) {
     return <Navigate to="/login" />;
  }

  if (requiredRole && !requiredRole.includes(userRole)) {
     return <Navigate to="/unauthorized" />;
  }

  console.log("Acceso permitido, mostrando ruta protegida");
  return children;
};

export default ProtectedRoute;
