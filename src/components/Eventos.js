// Eventos.js
import React, { useState, useEffect } from 'react';
import FiltroPagos from './FiltroPagos';
import Comentarios from './Comentarios';
import GraficoPensiones from './Certificados';
// import FiltroReajuste from './FiltroReajuste';
// import RelacionSalariosGrafica from './SalariosMinimosConGrafica';
// import GraficoPoderAdquisitivo from './GraficoPoderAdquisitivo';
// import ChatPension from './pensionanalisis';
import VisorFacturas from './visorfacturas';
import TablaPrimerasMesadas from './TablaPrimerasMesadas';
import TablaProcesos from './TablaProcesos';
import VistasIcons from './VistasIcons';
import { useSelector, useDispatch } from 'react-redux';
import './Eventos.css';

// Función para formatear campos de fecha
const formatearCampoFecha = (campo) => {
  if (!campo) return ' - ';
  if (typeof campo === 'string') {
    return campo.trim() || ' - ';
  }
  if (campo.toDate) {
    // Esto se usa con datos de Firestore (por ejemplo). Ajusta según tus necesidades.
    return campo.toDate().toLocaleDateString();
  }
  return campo.toString();
};

// Función para extraer el mes (número y nombre) a partir de un string de periodoPago
const obtenerMesDePeriodoPago = (periodoPago) => {
  if (!periodoPago || typeof periodoPago !== 'string') {
    return { mesNumero: '', mesNombre: '' };
  }

  const meses = {
    ene: '01',
    feb: '02',
    mar: '03',
    abr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    ago: '08',
    sep: '09',
    sept: '09',
    oct: '10',
    nov: '11',
    dic: '12',
  };

  const nombresMeses = {
    ene: 'Enero',
    feb: 'Febrero',
    mar: 'Marzo',
    abr: 'Abril',
    may: 'Mayo',
    jun: 'Junio',
    jul: 'Julio',
    ago: 'Agosto',
    sep: 'Septiembre',
    sept: 'Septiembre',
    oct: 'Octubre',
    nov: 'Noviembre',
    dic: 'Diciembre',
  };

  const regex = /([a-z]{3,4})\.?/gi;
  const matches = periodoPago.toLowerCase().match(regex);

  if (matches && matches.length > 0) {
    const mesAbreviado = matches[0].replace('.', '').replace(/[^a-z]/g, '');
    return {
      mesNumero: meses[mesAbreviado],
      mesNombre: nombresMeses[mesAbreviado],
    };
  }

  return { mesNumero: '', mesNombre: '' };
};

// Función para obtener la mesada inicial (primer pago recibido)
const obtenerMesadaInicial = (pensiones = []) => {
  if (!pensiones || pensiones.length === 0) return null;

  const pensionesOrdenadas = [...pensiones].sort((a, b) => {
    const { mesNumero: mesA } = obtenerMesDePeriodoPago(a.periodoPago);
    const { mesNumero: mesB } = obtenerMesDePeriodoPago(b.periodoPago);
    const fechaA = new Date(`${a.año}-${mesA || '01'}-01`);
    const fechaB = new Date(`${b.año}-${mesB || '01'}-01`);
    return fechaA - fechaB;
  });

  const primerPago = pensionesOrdenadas[0];
  if (primerPago && Array.isArray(primerPago.detalles)) {
    const mesadaDetalle = primerPago.detalles.find((det) => det.codigo === 'MESAD');
    if (mesadaDetalle) {
      return mesadaDetalle.ingresos;
    }
  }
  return null;
};

const Eventos = () => {
  const dispatch = useDispatch();
  const { usuarioSeleccionado, loading, pensiones, parrisData } = useSelector(
    (state) => state.pensiones
  );

  // Estado para la vista seleccionada (los íconos serán la entrada)
  const [vistaSeleccionada, setVistaSeleccionada] = useState('');

  // Reinicia vistaSeleccionada cada vez que cambia el usuario
  useEffect(() => {
    setVistaSeleccionada('');
  }, [usuarioSeleccionado]);

  // Función para formatear el fondo de salud
  const formatearFondoSalud = (fondoSalud) =>
    fondoSalud ? fondoSalud.replace(/^Salud:\s*/, '') : 'Sin fondo de salud';

  // Función para formatear la dependencia
  const formatearDependencia = (dependencia) =>
    dependencia ? dependencia.split('-').slice(1).join('-').trim() : 'Sin dependencia';

  // Calculamos la mesada inicial para mostrar
  const mesadaInicial = obtenerMesadaInicial(pensiones);
  const mesadaInicialFormateada =
    mesadaInicial || mesadaInicial === 0
      ? new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
        }).format(mesadaInicial)
      : ' - ';

  // Efecto para actualizar la mesada inicial en la data de parris (si aplica)
  useEffect(() => {
    if (mesadaInicial != null && parrisData) {
      console.log('Actualizando mesada inicial en parris con el valor:', mesadaInicial);
      // dispatch(algunaAccion({ mesadaInicial }));
    }
  }, [mesadaInicial, parrisData, dispatch]);

  // Función para limpiar el nombre y quitar la parte (C.C. xxxxx)
  const limpiarNombre = (nombreCompleto) => {
    if (!nombreCompleto) return '';
    return nombreCompleto.replace(/\s*\(C\.C\..*\)/, '').trim();
  };

  return (
    <div className="eventos-container">
      {/* Fila de íconos siempre visible */}
      <VistasIcons
        vistaSeleccionada={vistaSeleccionada}
        setVistaSeleccionada={setVistaSeleccionada}
      />

      <div className="eventos-main-content">
        {vistaSeleccionada === 'Consulta procesos' ? (
          <TablaProcesos cedula={usuarioSeleccionado?.documento} />
        ) : usuarioSeleccionado ? (
          <>
            {vistaSeleccionada === '' ? (
  // Mostramos la tarjeta de datos del usuario
  <div className="usuario-info-card">
    <h2 className="usuario-nombre">
      Datos Laborales y de Pensión de {limpiarNombre(usuarioSeleccionado.nombre)}
    </h2>
    <div className="form-section">
      <div className="form-row">
        {/* Columna 1 */}
        <div className="col-md-4">
          <div className="form-group">
            <label>Empresa:</label>
            <span className="form-control-static">
              {usuarioSeleccionado.empresa} ({usuarioSeleccionado.nitEmpresa})
            </span>
          </div>
          <div className="form-group">
            <label>Dependencia:</label>
            <span className="form-control-static">
              {formatearDependencia(usuarioSeleccionado.pnlDependencia)}
            </span>
          </div>
          <div className="form-group">
            <label>Centro de Costo:</label>
            <span className="form-control-static">
              {usuarioSeleccionado.centroCosto}
            </span>
          </div>
          <div className="form-group">
            <label>Documento:</label>
            <span className="form-control-static">
              {usuarioSeleccionado.documento}
            </span>
          </div>
          {parrisData && (
            <>
              <div className="form-group">
                <label>Fecha Causa:</label>
                <span className="form-control-static">
                  {formatearCampoFecha(parrisData.fe_causa)}
                </span>
              </div>
              <div className="form-group">
                <label>Fecha Ingreso:</label>
                <span className="form-control-static">
                  {formatearCampoFecha(parrisData.fe_ingreso)}
                </span>
              </div>
              <div className="form-group">
                <label>Fecha Adquiere:</label>
                <span className="form-control-static">
                  {formatearCampoFecha(parrisData.fe_adquiere)}
                </span>
              </div>
              <div className="form-group">
                <label>Fecha Nacido:</label>
                <span className="form-control-static">
                  {formatearCampoFecha(parrisData.fe_nacido)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Columna 2 */}
        <div className="col-md-4">
          <div className="form-group">
            <label>Cargo:</label>
            <span className="form-control-static">
              {usuarioSeleccionado.cargo}
            </span>
          </div>
          <div className="form-group">
            <label>Fondo de Salud:</label>
            <span className="form-control-static">
              {formatearFondoSalud(usuarioSeleccionado.fondoSalud)}
            </span>
          </div>
          {parrisData && (
            <>
              <div className="form-group">
                <label>Código Afiliación:</label>
                <span className="form-control-static">
                  {parrisData.afilia}
                </span>
              </div>
              <div className="form-group">
                <label>Cédula:</label>
                <span className="form-control-static">
                  {parrisData.cedula}
                </span>
              </div>
              <div className="form-group">
                <label>Ciudad ISS:</label>
                <span className="form-control-static">
                  {parrisData.ciudad_iss}
                </span>
              </div>
              <div className="form-group">
                <label>Comparte:</label>
                <span className="form-control-static">
                  {formatearCampoFecha(parrisData.comparte)}
                </span>
              </div>
              <div className="form-group">
                <label>Dir ISS:</label>
                <span className="form-control-static">
                  {parrisData.dir_iss}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Columna 3 */}
        <div className="col-md-4">
          {parrisData && (
            <>
              <div className="form-group">
                <label>Fecha Vinculado:</label>
                <span className="form-control-static">
                  {formatearCampoFecha(parrisData.fe_vinculado)}
                </span>
              </div>
              <div className="form-group">
                <label>Mesada:</label>
                <span className="form-control-static">
                  {parrisData.mesada && typeof parrisData.mesada === 'number'
                    ? new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                      }).format(parrisData.mesada)
                    : parrisData.mesada
                    ? 'Valor de mesada no válido'
                    : ' - '}
                </span>
              </div>
              <div className="form-group">
                <label>Mesada Inicial:</label>
                <span className="form-control-static">
                  {mesadaInicialFormateada}
                </span>
              </div>
              <div className="form-group">
                <label>Régimen:</label>
                <span className="form-control-static">
                  {parrisData.regimen}
                </span>
              </div>
              <div className="form-group">
                <label>Resolución Año:</label>
                <span className="form-control-static">
                  {parrisData.res_ano}
                </span>
              </div>
              <div className="form-group">
                <label>Resolución Nro:</label>
                <span className="form-control-static">
                  {parrisData.res_nro}
                </span>
              </div>
              <div className="form-group">
                <label>Semanas:</label>
                <span className="form-control-static">
                  {parrisData.semanas}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
) : (
  // Si el usuario ya está seleccionado, pero la vista no es '' => en blanco
  <div className="usuario-info-card">
    <h2 className="usuario-nombre">Datos Laborales y de Pensión</h2>
  </div>
)}


            {/* Contenedor de la vista que se selecciona con los íconos */}
            <div className="vista-seleccionada-container">
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
              ) : (
                <p></p>
              )}
            </div>
          </>
        ) : (
          // Si NO hay un usuario seleccionado
          <div className="eventos-header">
            <h1>Sistema de Consulta de Pensiones y Pagos</h1>
            <p>
              Este sistema le permite consultar sus pensiones y pagos realizados a través del tiempo,
              así como los procesos gestionados por la compañía. Además, podrá acceder a la
              liquidación de pensiones según lo establecido en la ley.
            </p>
          </div>
        )}
      </div>

      <div className="eventos-sidebar">
        <Comentarios />
      </div>
    </div>
  );
};

export default Eventos;
