import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import FiltroReajuste from './FiltroReajuste';
import FiltroPagos from './FiltroPagos';
import Comentarios from './Comentarios';
import GraficoPensiones from './Certificados';
import RelacionSalariosGrafica from './SalariosMinimosConGrafica';
import GraficoPoderAdquisitivo from './GraficoPoderAdquisitivo';
import ChatPension from './pensionanalisis';
import VisorFacturas from './visorfacturas';
import TablaPrimerasMesadas from './TablaPrimerasMesadas'; // Importa el nuevo componente
import { useSelector } from 'react-redux';

const Eventos = () => {
  const { usuarioSeleccionado, loading, pensiones } = useSelector((state) => state.pensiones);
  const [vistaSeleccionada, setVistaSeleccionada] = useState('');

  // Opciones para el selector de vista
  const opcionesVista = [
    'Liquidaciones', 
    'Pagos', 
    'Detalles completo', 
    'Certificado Pensional', 
    'Salarios', 
    'Poder Adquisitivo', 
    'Análisis Pensión', 
    'Reajuste Pensional',
    // Nueva opción
  ];

  // Formato de fondo de salud para eliminar "Salud:"
  const formatearFondoSalud = (fondoSalud) => {
    return fondoSalud ? fondoSalud.replace(/^Salud:\s*/, '') : 'Sin fondo de salud';
  };

  // Formato de dependencia para eliminar prefijo antes de "-"
  const formatearDependencia = (dependencia) => {
    return dependencia ? dependencia.split('-').slice(1).join('-').trim() : 'Sin dependencia';
  };

  const handleSelectChange = (e) => {
    setVistaSeleccionada(e.target.value);
  };

  return (
    <div className="event-container">
      <Grid container spacing={2} direction="column">
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              {usuarioSeleccionado ? (
                <div className="pensioner-details">
                  <h1 className="chart-title">{usuarioSeleccionado.nombre}</h1>
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
                ) : vistaSeleccionada === 'Certificado Pensional' ? ( // Nuevo caso
                  <TablaPrimerasMesadas />
                ) : vistaSeleccionada === 'Salarios' ? (
                  <RelacionSalariosGrafica />
                ) : vistaSeleccionada === 'Poder Adquisitivo' ? (
                  <GraficoPoderAdquisitivo pagos={pensiones} />
                ) : vistaSeleccionada === 'Análisis Pensión' ? (
                  <ChatPension pagos={pensiones} />
                ) : vistaSeleccionada === 'Reajuste Pensional' ? (
                  <FiltroReajuste />
                )  : (
                  <h2>Seleccione una opción</h2>
                )}
              </div>
            </Grid>

            <Grid item xs={12} md={4}>
              <Comentarios />
              <Grid item xs={12}>
                <div className="selector-container">
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
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default Eventos;
