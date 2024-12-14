import React, { useState } from 'react';
import FiltroReajuste from './FiltroReajuste';
import FiltroPagos from './FiltroPagos';
import Comentarios from './Comentarios';
import GraficoPensiones from './Certificados';
import RelacionSalariosGrafica from './SalariosMinimosConGrafica';
import GraficoPoderAdquisitivo from './GraficoPoderAdquisitivo';
import ChatPension from './pensionanalisis';
import VisorFacturas from './visorfacturas';
import TablaPrimerasMesadas from './TablaPrimerasMesadas';
import TablaProcesos from './TablaProcesos'; // Importamos el nuevo componente
import { useSelector } from 'react-redux';

const Eventos = () => {
  const { usuarioSeleccionado, loading, pensiones } = useSelector((state) => state.pensiones);
  const [vistaSeleccionada, setVistaSeleccionada] = useState('');

  const opcionesVista = [
    'Liquidaciones',
    'Pagos',
    'Detalles completo',
    'Certificado Pensional',
    'Consulta procesos', // Nueva opción para el componente TablaProcesos
  ];

  const formatearFondoSalud = (fondoSalud) =>
    fondoSalud ? fondoSalud.replace(/^Salud:\s*/, '') : 'Sin fondo de salud';

  const formatearDependencia = (dependencia) =>
    dependencia ? dependencia.split('-').slice(1).join('-').trim() : 'Sin dependencia';

  const handleSelectChange = (e) => {
    setVistaSeleccionada(e.target.value);
  };

  return (
    <div
      className="event-container"
      style={{
        display: 'flex',
        height: '100vh', 
        overflow: 'hidden',
      }}
    >
      {/* Contenedor principal */}
      <div
        style={{
          flex: '1',
          overflowX: 'auto', 
          overflowY: 'auto', 
          padding: '20px',
        }}
      >
        {usuarioSeleccionado ? (
          <div className="pensioner-details">
            <h1 className="chart-title">
              {usuarioSeleccionado.nombre} 
            </h1>
            <p><strong>Empresa:</strong> {usuarioSeleccionado.empresa} ({usuarioSeleccionado.nitEmpresa})</p>
            <p><strong>Dependencia:</strong> {formatearDependencia(usuarioSeleccionado.pnlDependencia)}</p>
            <p><strong>Centro de Costo:</strong> {usuarioSeleccionado.centroCosto}</p>
            <p><strong>Cargo:</strong> {usuarioSeleccionado.cargo}</p>
            <p><strong>Fondo de Salud:</strong> {formatearFondoSalud(usuarioSeleccionado.fondoSalud)}</p>
          </div>
        ) : (
          <h1 className="chart-title">Seleccione un usuario</h1>
        )}

        <div className="chart-section">
          {vistaSeleccionada === 'Liquidaciones' ? (
            loading ? (
              <div>Cargando...</div>
            ) : (
              <GraficoPensiones />
            )
          ) : vistaSeleccionada === 'Pagos' ? (
            <FiltroPagos />
          ) : vistaSeleccionada === 'Detalles completo' ? (
            <VisorFacturas
              usuarioSeleccionado={usuarioSeleccionado}
              formatearFondoSalud={formatearFondoSalud}
              formatearDependencia={formatearDependencia}
            />
          ) : vistaSeleccionada === 'Certificado Pensional' ? (
            <TablaPrimerasMesadas />
          ) : vistaSeleccionada === 'Consulta procesos' ? (
            <TablaProcesos cedula={usuarioSeleccionado?.documento} />
          ) : (
            <h2>Seleccione una opción</h2>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div
        style={{
          width: '400px',
          overflowY: 'auto',
          padding: '20px',
          borderLeft: '1px solid #ccc',
        }}
      >
        <Comentarios />
        <div className="selector-container" style={{ marginTop: '20px' }}>
          <label htmlFor="vista-select">Seleccione una vista:</label>
          <select
            id="vista-select"
            value={vistaSeleccionada}
            onChange={handleSelectChange}
            className="modern-select"
          >
            <option value="">Seleccione...</option>
            {opcionesVista.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default Eventos;
