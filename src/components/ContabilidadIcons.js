import React from 'react';
import {
  FaUserPlus,
  FaMoneyCheckAlt,
  FaHistory,
  FaPlusSquare,
  FaUserEdit,
  FaChartLine  // Ícono para Resumen Financiero
} from 'react-icons/fa';

const ContabilidadIcons = ({ vistaSeleccionada, setVistaSeleccionada }) => {
  // Opciones del menú lateral
  const opciones = [
    { label: 'Crear Nuevo Cliente', value: 'crearCliente', icon: <FaUserPlus /> },
    { label: 'Ver Pagos de Cliente', value: 'verPagosCliente', icon: <FaMoneyCheckAlt /> },
    { label: 'Ver Historial de Pagos', value: 'verHistorialPagos', icon: <FaHistory /> },
    { label: 'Agregar Pago', value: 'agregarPago', icon: <FaPlusSquare /> },
    { label: 'Editar Usuario', value: 'editarUsuario', icon: <FaUserEdit /> },
    { label: 'Resumen Financiero', value: 'resumenFinanciero', icon: <FaChartLine /> },
  ];

  // Estilos en objeto JS
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      marginBottom: '20px',
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer',
      padding: '8px',
      border: '1px solid transparent',
      borderRadius: '4px',
      transition: 'background 0.2s, border-color 0.2s',
      fontWeight: 500,
    },
    rowActive: {
      borderColor: '#007bff',
      backgroundColor: '#e6f0ff',
    },
    icon: {
      fontSize: '1.2rem',
      color: '#007bff',
    },
  };

  return (
    <div style={styles.container}>
      {opciones.map((opcion) => {
        const isActive = vistaSeleccionada === opcion.value;
        return (
          <div
            key={opcion.value}
            style={{
              ...styles.row,
              ...(isActive ? styles.rowActive : {}),
            }}
            onClick={() => setVistaSeleccionada(opcion.value)}
          >
            <span style={styles.icon}>{opcion.icon}</span>
            <span>{opcion.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ContabilidadIcons;
