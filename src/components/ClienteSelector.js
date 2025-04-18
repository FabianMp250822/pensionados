import React from 'react';
import {
  FaUserPlus,
  FaMoneyCheckAlt,
  FaHistory,
  FaPlusSquare,
  FaUserEdit,
  FaFileAlt   
} from 'react-icons/fa';

const ClienteSelector = ({ onOptionChange }) => {
  const handleOptionClick = (opcion) => {
    onOptionChange(opcion);
  };

  return (
    <div className="cliente-selector-sidebar">
      <ul>
        <li onClick={() => handleOptionClick('crearCliente')}>
          <FaUserPlus className="icon" />
          <span>Crear Nuevo Cliente</span>
        </li>
        <li onClick={() => handleOptionClick('verPagosCliente')}>
          <FaMoneyCheckAlt className="icon" />
          <span>Ver Pagos de Cliente</span>
        </li>
        <li onClick={() => handleOptionClick('verHistorialPagos')}>
          <FaHistory className="icon" />
          <span>Ver Historial de Pagos</span>
        </li>
        <li onClick={() => handleOptionClick('agregarPago')}>
          <FaPlusSquare className="icon" />
          <span>Agregar Pago</span>
        </li>
        <li onClick={() => handleOptionClick('editarUsuario')}>
          <FaUserEdit className="icon" />
          <span>Editar Usuario</span>
        </li>
        <li onClick={() => handleOptionClick('documentosSoporte')}>
          <FaFileAlt className="icon" />
          <span>Documentos Soporte</span>
        </li>
      </ul>
    </div>
  );
};

export default ClienteSelector;
