import React, { useState, useEffect } from 'react';
import FiltroPagos from './FiltroPagos';
import Comentarios from './Comentarios';
import GraficoPensiones from './Certificados';
import VisorFacturas from './visorfacturas';
import TablaPrimerasMesadas from './TablaPrimerasMesadas';
import TablaProcesos from './TablaProcesos';
import VistasIcons from './VistasIcons';
import Anexo2 from './Anexo2';

import { useSelector, useDispatch } from 'react-redux';
import './Eventos.css';

// Importar la acción para verificar si la cédula es causante o beneficiario
import { fetchCausanteOrBeneficiario } from '../redux/causantesSlice';

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

// Función para obtener la última mesada registrada en pagos
const obtenerUltimaMesada = (pensiones = []) => {
  if (!pensiones || pensiones.length === 0) return null;

  const pensionesOrdenadas = [...pensiones].sort((a, b) => {
    const { mesNumero: mesA } = obtenerMesDePeriodoPago(a.periodoPago);
    const { mesNumero: mesB } = obtenerMesDePeriodoPago(b.periodoPago);
    const fechaA = new Date(`${a.año}-${mesA || '01'}-01`);
    const fechaB = new Date(`${b.año}-${mesB || '01'}-01`);
    return fechaA - fechaB;
  });

  const ultimaPension = pensionesOrdenadas[pensionesOrdenadas.length - 1];
  if (ultimaPension && Array.isArray(ultimaPension.detalles)) {
    const mesadaDetalle = ultimaPension.detalles.find((det) => det.codigo === 'MESAD');
    if (mesadaDetalle) {
      return mesadaDetalle.ingresos;
    }
  }
  return null;
};

const Eventos = () => {
  const dispatch = useDispatch();

  // Estados de pensiones
  const { usuarioSeleccionado, loading, pensiones, parrisData } = useSelector(
    (state) => state.pensiones
  );

  // Estado de causantes
  const {
    status: causanteStatus,
    error: causanteError,
    userType,
    causanteData,
  } = useSelector((state) => state.causantes);

  // Extraemos el rol del usuario autenticado desde el store de auth
  const { userRole } = useSelector((state) => state.auth);

  // Estado para la vista seleccionada (los íconos serán la entrada)
  const [vistaSeleccionada, setVistaSeleccionada] = useState('');

  // Reinicia vistaSeleccionada cada vez que cambia el usuario
  useEffect(() => {
    setVistaSeleccionada('');
  }, [usuarioSeleccionado]);

  // Cuando tengamos un usuario con documento, consultamos si es causante o beneficiario
  useEffect(() => {
    if (usuarioSeleccionado?.documento) {
      dispatch(fetchCausanteOrBeneficiario(usuarioSeleccionado.documento));
    }
  }, [usuarioSeleccionado, dispatch]);

  // Funciones de formateo
  const formatearFondoSalud = (fondoSalud) =>
    fondoSalud ? fondoSalud.replace(/^Salud:\s*/, '') : 'Sin fondo de salud';

  const formatearDependencia = (dependencia) =>
    dependencia ? dependencia.split('-').slice(1).join('-').trim() : 'Sin dependencia';

  const mesadaInicial = obtenerMesadaInicial(pensiones);
  const mesadaInicialFormateada =
    mesadaInicial !== null
      ? new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
        }).format(mesadaInicial)
      : ' - ';

  const ultimeMesada = obtenerUltimaMesada(pensiones);
  const ultimeMesadaFormateada =
    ultimeMesada !== null
      ? new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
        }).format(ultimeMesada)
      : ' - ';

  useEffect(() => {
    if (mesadaInicial != null && parrisData) {
      console.log('Actualizando mesada inicial en parris con el valor:', mesadaInicial);
      // dispatch(algunaAccion({ mesadaInicial }));
    }
  }, [mesadaInicial, parrisData, dispatch]);

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
              // Tarjeta de datos del usuario
              <div className="usuario-info-card">
                <div className="eventos-header">
                  <h1>Sistema de Consulta de Pensiones y Pagos</h1>
                  <div className="header-role">
                    {userRole && <span>Bienvenido: {userRole}</span>}
                  </div>
                  <p>
                    Este sistema le permite consultar sus pensiones y pagos realizados a través del tiempo,
                    así como los procesos gestionados por la compañía. Además, podrá acceder a la
                    liquidación de pensiones según lo establecido en la ley.
                  </p>
                </div>
                <div className="form-section">
                  <div className="form-row">
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
                            <label>Ultima Mesada:</label>
                            <span className="form-control-static">
                              {ultimeMesada && typeof ultimeMesada === 'number'
                                ? new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP',
                                  }).format(ultimeMesada)
                                : ultimeMesada
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

                <hr />
                <h3>Información de Causante / Beneficiario</h3>
                {causanteStatus === 'loading' && (
                  <p>Cargando datos de causante/beneficiario...</p>
                )}
                {causanteStatus === 'failed' && (
                  <p style={{ color: 'red' }}>Error: {causanteError}</p>
                )}
                {causanteStatus === 'succeeded' && userType !== 'NONE' && causanteData && (
                  <div id="causanteInfo" style={{ marginBottom: '20px' }}>
                    <p>
                      Este usuario es: <strong>{userType}</strong>
                      <br />
                      Cédula causante: {causanteData.cedula_causante}
                    </p>
                    <table
                      id="causanteTable"
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        marginBottom: '20px'
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: '#f2f2f2' }}>
                          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Fecha Desde</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Fecha Hasta</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Observación</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Tipo Aum.</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Valor Empresa</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Valor ISS</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Beneficiario</th>
                        </tr>
                      </thead>
                      <tbody>
                        {causanteData.records?.map((item, index) => {
                          const fechaDesde = item.fecha_desde?.toDate
                            ? item.fecha_desde.toDate().toLocaleDateString()
                            : item.fecha_desde;
                          const fechaHasta = item.fecha_hasta?.toDate
                            ? item.fecha_hasta.toDate().toLocaleDateString()
                            : item.fecha_hasta;
                          return (
                            <tr key={index} style={{ border: '1px solid #ddd' }}>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{fechaDesde}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{fechaHasta}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.observacion}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.tipo_aum}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                {typeof item.valor_empresa === 'number'
                                  ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.valor_empresa)
                                  : item.valor_empresa}
                              </td>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                {typeof item.valor_iss === 'number'
                                  ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.valor_iss)
                                  : item.valor_iss}
                              </td>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.cedula_beneficiario}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {causanteStatus === 'succeeded' && userType === 'NONE' && (
                  <p>No se encontró información de causante/beneficiario para esta cédula.</p>
                )}
              </div>
            ) : (
              <div className="usuario-info-card">
                <h2 className="usuario-nombre">Datos Laborales y de Pensión</h2>
              </div>
            )}

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
              ) : vistaSeleccionada === 'Anexo 2' ? (
                <Anexo2 usuarioSeleccionado={usuarioSeleccionado} />
              ) : (
                <p></p>
              )}
            </div>
          </>
        ) : (
          <div className="eventos-header">
            <h1>Sistema de Consulta de Pensiones y Pagos</h1>
            <div className="header-role">
              {userRole && <span>Bienvenido: {userRole}</span>}
            </div>
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
