import React from 'react';
import './Anexo2.css';
import { usePensionData } from '../hooks/usePensionData';
import { usePensionCalculations } from '../hooks/usePensionCalculations';
import { useProyeccionDinamica } from '../hooks/useProyeccionDinamica';
import TablaProyeccionPrincipal from './TablaProyeccionPrincipal';
import TablaComparticionMesada from './TablaComparticionMesada';
import TablaProyeccionContinuada from './TablaProyeccionContinuada';
import NotaReajuste from './NotaReajuste';
import { formatearPagoReal } from '../utils/pensionFormatters';

const Anexo2 = ({ usuarioSeleccionado }) => {
  const { pensionesUnicas, pagosFinales } = usePensionData();
  const calculationUtils = usePensionCalculations(pagosFinales);
  const { 
    datosConProyeccionTabla1, 
    datosConProyeccionTabla3 
  } = useProyeccionDinamica(calculationUtils, pagosFinales);

  // Si no hay datos reales, mostrar mensaje
  if (!datosConProyeccionTabla1) {
    return (
      <div className="anexo2-container">
        <h2>PROYECCIÓN COMPARATIVA DE LA MESADA CONVENCIONAL CON INCREMENTOS DE SMLMV E IPC</h2>
        
        {usuarioSeleccionado && (
          <div className="usuario-info-anexo2">
            <div className="info-item">
              <span className="label">Cédula:</span>
              <span className="value">{usuarioSeleccionado.documento}</span>
            </div>
            <div className="info-item">
              <span className="label">Nombre:</span>
              <span className="value">{usuarioSeleccionado.nombre}</span>
            </div>
          </div>
        )}
        
        <div className="sin-datos-mensaje">
          <div className="alerta-sin-datos">
            <h3>⚠️ No hay datos de pagos disponibles</h3>
            <p>Para generar la proyección comparativa es necesario tener al menos un registro de pago del año 1999 (o año inicial de la pensión).</p>
            <p>Este usuario no tiene registros de pagos en el sistema, por lo que no es posible calcular las proyecciones dinámicas.</p>
            <p><strong>Por favor contacte al administrador para cargar los datos de pagos históricos.</strong></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="anexo2-container">
      <h2>PROYECCIÓN COMPARATIVA DE LA MESADA CONVENCIONAL CON INCREMENTOS DE SMLMV E IPC</h2>
      
      {usuarioSeleccionado && (
        <div className="usuario-info-anexo2">
          <div className="info-item">
            <span className="label">Cédula:</span>
            <span className="value">{usuarioSeleccionado.documento}</span>
          </div>
          <div className="info-item">
            <span className="label">Nombre:</span>
            <span className="value">{usuarioSeleccionado.nombre}</span>
          </div>
        </div>
      )}
      
      <TablaProyeccionPrincipal 
        datosConProyeccion={datosConProyeccionTabla1}
        {...calculationUtils}
      />

      <TablaComparticionMesada 
        datosConProyeccion={datosConProyeccionTabla1}
        pagosFinales={pagosFinales}
      />

      <TablaProyeccionContinuada 
        datosConProyeccion={datosConProyeccionTabla3}
        datosTabla1={datosConProyeccionTabla1}
        {...calculationUtils}
      />

      <NotaReajuste 
        pensionesUnicas={pensionesUnicas}
        obtenerPagoEnero={calculationUtils.obtenerPagoEnero}
        formatearPagoReal={formatearPagoReal}
      />
    </div>
  );
};

export default Anexo2;
