import React from 'react';
import { useSelector } from 'react-redux';
import './Anexo2.css';

// Componentes modulares
import UserInfo from './anexo2/UserInfo';
import NoDataMessage from './anexo2/NoDataMessage';
import Tabla1 from './anexo2/Tabla1';
import TablaComparticion from './anexo2/TablaComparticion';
import Tabla3 from './anexo2/Tabla3';
import NotaReajuste from './anexo2/NotaReajuste';

// Lógica de datos
import { deduplicarPagos, obtenerPagoEnero, obtenerValorMesadaValidoAño, contarPagosAño } from './anexo2/dataProcessing';
import { generarProyeccionDinamicaTabla1, generarProyeccionDinamicaTabla3 } from './anexo2/proyeccionLogic';

const Anexo2 = ({ usuarioSeleccionado }) => {
  // Obtener los datos de pensiones del estado Redux
  const { pensiones } = useSelector((state) => state.pensiones);

  // Aplicar deduplicación
  const pensionesUnicas = deduplicarPagos(pensiones);
  
  // Usar todos los pagos (incluyendo quincenales)
  const pagosFinales = pensiones;

  // Funciones auxiliares que pasan pagosFinales como parámetro
  const obtenerPagoEneroWrapper = (año) => obtenerPagoEnero(año, pagosFinales);
  const obtenerValorMesadaValidoAñoWrapper = (año) => obtenerValorMesadaValidoAño(año, pagosFinales);
  const contarPagosAñoWrapper = (año) => contarPagosAño(año, pagosFinales);

  // Calcular los datos con proyección dinámica para ambas tablas
  const datosConProyeccionTabla1 = generarProyeccionDinamicaTabla1(pagosFinales);
  const datosConProyeccionTabla3 = generarProyeccionDinamicaTabla3(pagosFinales, datosConProyeccionTabla1);

  // Si no hay datos reales, mostrar mensaje
  if (!datosConProyeccionTabla1) {
    return (
      <div className="anexo2-container">
        <h2>PROYECCIÓN COMPARATIVA DE LA MESADA CONVENCIONAL CON INCREMENTOS DE SMLMV E IPC</h2>
        
        <UserInfo usuarioSeleccionado={usuarioSeleccionado} />
        <NoDataMessage />
      </div>
    );
  }

  return (
    <div className="anexo2-container">
      <h2>PROYECCIÓN COMPARATIVA DE LA MESADA CONVENCIONAL CON INCREMENTOS DE SMLMV E IPC</h2>
      
      <UserInfo usuarioSeleccionado={usuarioSeleccionado} />
      
      <Tabla1 
        datosConProyeccionTabla1={datosConProyeccionTabla1}
        obtenerValorMesadaValidoAño={obtenerValorMesadaValidoAñoWrapper}
        contarPagosAño={contarPagosAñoWrapper}
      />

      <TablaComparticion 
        datosConProyeccionTabla1={datosConProyeccionTabla1}
        pagosFinales={pagosFinales}
      />

      {datosConProyeccionTabla3 && datosConProyeccionTabla3.length > 0 && (
        <Tabla3 
          datosConProyeccionTabla3={datosConProyeccionTabla3}
          datosConProyeccionTabla1={datosConProyeccionTabla1}
          obtenerValorMesadaValidoAño={obtenerValorMesadaValidoAñoWrapper}
          contarPagosAño={contarPagosAñoWrapper}
        />
      )}

      <NotaReajuste 
        pensionesUnicas={pensionesUnicas}
        obtenerPagoEnero={obtenerPagoEneroWrapper}
      />
    </div>
  );
};

export default Anexo2;
