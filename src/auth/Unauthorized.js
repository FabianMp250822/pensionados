import React from 'react';
import { Link } from 'react-router-dom'; // Importa Link para la navegación

const Unauthorized = () => {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f8f9fa', // Un gris claro de fondo
      fontFamily: 'Arial, sans-serif',
    },
    icon: {
      fontSize: '8rem',
      color: '#dc3545', // Rojo para indicar error
      marginBottom: '20px',
    },
    title: {
      fontSize: '2.5rem',
      color: '#343a40', // Gris oscuro para el título
      marginBottom: '10px',
      fontWeight: 'bold',
    },
    message: {
      fontSize: '1.2rem',
      color: '#6c757d', // Gris medio para el mensaje
      marginBottom: '20px',
      textAlign: 'center',
      maxWidth: '500px',
    },
    link: {
      color: '#007bff', // Azul para el enlace
      textDecoration: 'none',
      fontWeight: 'bold',
      transition: 'color 0.3s ease',
    },
    linkHover: {
      color: '#0056b3', // Azul más oscuro al pasar el mouse
    },
  };

  return (
    <div style={styles.container}>
      <i className="fas fa-exclamation-triangle" style={styles.icon}></i> {/* Icono de Font Awesome */}
      <h1 style={styles.title}>Acceso Restringido</h1>
      <p style={styles.message}>
        Lo sentimos, no tienes los permisos necesarios para acceder a esta sección.
        Por favor, verifica tus credenciales o contacta al administrador del sistema.
      </p>
      <Link to="/" style={styles.link} onMouseOver={(e) => Object.assign(e.target.style, styles.linkHover)} onMouseOut={(e) => Object.assign(e.target.style, styles.link)}>
        Volver al Inicio
      </Link>
    </div>
  );
};

export default Unauthorized;
