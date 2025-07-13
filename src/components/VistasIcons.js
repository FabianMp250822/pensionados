// VistasIcons.js
import React from 'react';
import { 
  FaChartLine, 
  FaMoneyCheckAlt, 
  FaFileInvoiceDollar, 
  FaCertificate, 
  FaSearch,
  FaFileAlt 
} from 'react-icons/fa';
import './VistasIcons.css';

const VistasIcons = ({ vistaSeleccionada, setVistaSeleccionada }) => {
  return (
    <div className="vistas-icons-container">
      <div 
        className={`vistas-icon-item ${vistaSeleccionada === 'Liquidaciones' ? 'active' : ''}`}
        onClick={() => setVistaSeleccionada('Liquidaciones')}
      >
        <FaChartLine size={32} />
        <span>Liquidaciones</span>
      </div>
      <div 
        className={`vistas-icon-item ${vistaSeleccionada === 'Pagos' ? 'active' : ''}`}
        onClick={() => setVistaSeleccionada('Pagos')}
      >
        <FaMoneyCheckAlt size={32} />
        <span>Pagos</span>
      </div>
      <div 
        className={`vistas-icon-item ${vistaSeleccionada === 'Detalles completo' ? 'active' : ''}`}
        onClick={() => setVistaSeleccionada('Detalles completo')}
      >
        <FaFileInvoiceDollar size={32} />
        <span>Detalles</span>
      </div>
      <div 
        className={`vistas-icon-item ${vistaSeleccionada === 'Certificado Pensional' ? 'active' : ''}`}
        onClick={() => setVistaSeleccionada('Certificado Pensional')}
      >
        <FaCertificate size={32} />
        <span>Certificado</span>
      </div>
      <div 
        className={`vistas-icon-item ${vistaSeleccionada === 'Anexo 2' ? 'active' : ''}`}
        onClick={() => setVistaSeleccionada('Anexo 2')}
      >
        <FaFileAlt size={32} />
        <span>Anexo 2</span>
      </div>
      <div 
        className={`vistas-icon-item ${vistaSeleccionada === 'Consulta procesos' ? 'active' : ''}`}
        onClick={() => setVistaSeleccionada('Consulta procesos')}
      >
        <FaSearch size={32} />
        <span>Procesos</span>
      </div>
    </div>
  );
};

export default VistasIcons;
