import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const ResumenFinanciero = () => {
  // Obtenemos los usuarios del slice de contabilidad
  const usuarios = useSelector((state) => state.contabilidad.usuarios || []);
  console.log("ResumenFinanciero - usuarios:", usuarios);

  // Estados para los filtros del resumen principal
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [anoSeleccionado, setAnoSeleccionado] = useState('');

  // Estado para controlar el año de visualización en la tabla de estado de pagos
  const [yearDisplay, setYearDisplay] = useState(new Date().getFullYear());

  const MySwal = withReactContent(Swal);

  // Array de nombres de meses
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Función auxiliar para parsear el valor del salario en cualquiera de sus formatos
  const parseFormattedNumber = (value) => {
    if (typeof value !== 'string') {
      return Number(value);
    }
    value = value.trim();
    const parts = value.split('.');
    if (parts.length === 1) {
      // No hay separador, se parsea normalmente
      return parseFloat(value);
    }
    // Si el último segmento tiene dos dígitos, lo consideramos la parte decimal
    if (parts.length > 1 && parts[parts.length - 1].length === 2) {
      const decimalPart = parts.pop();
      const integerPart = parts.join('');
      return parseFloat(integerPart + '.' + decimalPart);
    } else {
      // De lo contrario, se asume que los puntos son separadores de miles y se eliminan
      return parseFloat(value.replace(/\./g, ''));
    }
  };

  // Función para proyectar la cuota esperada en un mes, teniendo en cuenta pagos anteriores
  const calcularCuotaProyectada = (usuario, fechaObjetivo) => {
    const salary = parseFormattedNumber(usuario.salario) || 0;
    const cuotaMensual = parseFloat(usuario.cuotaMensual) || 0;
    // Sumar pagos realizados antes de la fecha objetivo
    let totalPagadoAntes = 0;
    (usuario.pagos || []).forEach((pago) => {
      const pagoFecha = new Date(pago.fecha);
      if (pagoFecha < fechaObjetivo) {
        totalPagadoAntes += parseFloat(pago.montoNeto);
      }
    });
    if (totalPagadoAntes >= salary) {
      return 0; // Ya pagó todo, no se espera cuota en el mes objetivo.
    } else {
      const restante = salary - totalPagadoAntes;
      return Math.min(cuotaMensual, restante);
    }
  };

  const calcularResumen = () => {
    let totalContractAmount = 0;
    let totalCollectedGlobal = 0;
    
    // Resumen Global: Total a pagar y total recaudado
    usuarios.forEach((usuario) => {
      const totalDue = parseFormattedNumber(usuario.salario) || 0;
      totalContractAmount += totalDue;
      (usuario.pagos || []).forEach((pago) => {
        totalCollectedGlobal += parseFloat(pago.montoNeto);
      });
    });
    
    const globalDeficit = totalContractAmount - totalCollectedGlobal;
    const porcentajeGlobal = totalContractAmount
      ? ((totalCollectedGlobal / totalContractAmount) * 100).toFixed(2)
      : 0;

    // Resumen Mensual
    let monthlyProjection = 0;
    let monthlyCollected = 0;

    if (mesSeleccionado && anoSeleccionado) {
      const fechaObjetivo = new Date(parseInt(anoSeleccionado, 10), parseInt(mesSeleccionado, 10) - 1, 1);
      usuarios.forEach((usuario) => {
        // Calcular la cuota proyectada para el mes (tomando en cuenta pagos anteriores)
        const cuotaProyectada = calcularCuotaProyectada(usuario, fechaObjetivo);
        monthlyProjection += cuotaProyectada;

        // Sumar pagos realizados en el mes objetivo
        (usuario.pagos || []).forEach((pago) => {
          const pagoFecha = new Date(pago.fecha);
          if (
            pagoFecha.getMonth() + 1 === parseInt(mesSeleccionado, 10) &&
            pagoFecha.getFullYear() === parseInt(anoSeleccionado, 10)
          ) {
            monthlyCollected += parseFloat(pago.montoNeto);
          }
        });
      });
    }

    const monthlyDeficit = monthlyProjection - monthlyCollected;
    const porcentajeMonthly = monthlyProjection
      ? ((monthlyCollected / monthlyProjection) * 100).toFixed(2)
      : 0;

    // Resumen del Mes Anterior
    let monthlyProjectionAnterior = 0;
    let monthlyCollectedAnterior = 0;
    if (mesSeleccionado && anoSeleccionado) {
      const mesSel = parseInt(mesSeleccionado, 10);
      const anoSel = parseInt(anoSeleccionado, 10);
      let mesAnterior, anoMesAnterior;
      if (mesSel === 1) {
        mesAnterior = 12;
        anoMesAnterior = anoSel - 1;
      } else {
        mesAnterior = mesSel - 1;
        anoMesAnterior = anoSel;
      }
      const fechaObjetivoAnterior = new Date(anoMesAnterior, mesAnterior - 1, 1);
      usuarios.forEach((usuario) => {
        const cuotaProyectadaAnterior = calcularCuotaProyectada(usuario, fechaObjetivoAnterior);
        monthlyProjectionAnterior += cuotaProyectadaAnterior;
        (usuario.pagos || []).forEach((pago) => {
          const pagoFecha = new Date(pago.fecha);
          if (
            pagoFecha.getMonth() + 1 === mesAnterior &&
            pagoFecha.getFullYear() === anoMesAnterior
          ) {
            monthlyCollectedAnterior += parseFloat(pago.montoNeto);
          }
        });
      });
    }
    const monthlyDeficitAnterior = monthlyProjectionAnterior - monthlyCollectedAnterior;
    const porcentajeMonthlyAnterior = monthlyProjectionAnterior
      ? ((monthlyCollectedAnterior / monthlyProjectionAnterior) * 100).toFixed(2)
      : 0;

    return {
      // Global
      totalContractAmount,
      totalCollectedGlobal,
      globalDeficit,
      porcentajeGlobal,
      // Mensual
      monthlyProjection,
      monthlyCollected,
      monthlyDeficit,
      porcentajeMonthly,
      // Mes Anterior
      monthlyProjectionAnterior,
      monthlyCollectedAnterior,
      monthlyDeficitAnterior,
      porcentajeMonthlyAnterior,
    };
  };

  const resumen = calcularResumen();

  // Función para abrir la certificación en SweetAlert (opción de imprimir)
  const abrirCertificado = () => {
    MySwal.fire({
      title: '<strong>Certificación de Montos</strong>',
      html: `
        <div id="certificado" style="text-align: left; font-size: 14px; line-height: 1.5;">
          <p><strong>Dajusicia</strong></p>
          <p style="text-align: right;">[${new Date().toLocaleDateString()}]</p>
          <p><strong>Asunto:</strong> Informe de Estado Financiero y Recaudación</p>
          <p>Estimado/a Directiva,</p>
          <p>Se presenta a continuación el resumen financiero:</p>
          <h3>Resumen Global</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total a Pagar</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">$${resumen.totalContractAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Recaudado</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">$${resumen.totalCollectedGlobal.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Déficit/Ganancia Global</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">$${resumen.globalDeficit.toLocaleString()} (${resumen.porcentajeGlobal}%)</td>
            </tr>
          </table>
          ${
            mesSeleccionado && anoSeleccionado
              ? `
          <h3>Resumen del Mes (${monthNames[parseInt(mesSeleccionado, 10) - 1]} ${anoSeleccionado})</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Meta a Recaudar</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">$${resumen.monthlyProjection.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Recaudado</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">$${resumen.monthlyCollected.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Déficit/Ganancia del Mes</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">$${resumen.monthlyDeficit.toLocaleString()} (${resumen.porcentajeMonthly}%)</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Déficit del Mes Anterior</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">$${resumen.monthlyDeficitAnterior.toLocaleString()} (${resumen.porcentajeMonthlyAnterior}%)</td>
            </tr>
          </table>
          `
              : ''
          }
          <p style="margin-top: 20px;">Atentamente,</p>
          <p>Departamento de Finanzas</p>
        </div>
      `,
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      confirmButtonText: 'Imprimir',
      preConfirm: () => {
        const contenido = document.getElementById('certificado');
        const vent = window.open('', 'PRINT', 'height=600,width=800');
        vent.document.write(`<html><head><title>Certificación de Montos</title></head><body>${contenido.innerHTML}</body></html>`);
        vent.document.close();
        vent.print();
      },
    });
  };

  return (
    <div
      style={{
        margin: '20px',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Resumen Financiero</h2>
      
      {/* Filtros para año y mes (Resumen Global/Mensual) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          gap: '20px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <label htmlFor="ano" style={{ marginRight: '10px', fontWeight: 'bold' }}>
            Filtrar por año (Resumen):
          </label>
          <select
            id="ano"
            value={anoSeleccionado}
            onChange={(e) => setAnoSeleccionado(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">Todos</option>
            {[...Array(10)].map((_, index) => (
              <option key={index} value={2024 + index}>
                {2024 + index}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="mes" style={{ marginRight: '10px', fontWeight: 'bold' }}>
            Filtrar por mes (Resumen):
          </label>
          <select
            id="mes"
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">Todos</option>
            {monthNames.map((month, index) => (
              <option key={index} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de resumen global y mensual */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#1976d2', color: '#fff', textAlign: 'left' }}>
            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Descripción</th>
            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Monto/Estado</th>
          </tr>
        </thead>
        <tbody>
          {/* Resumen Global */}
          <tr>
            <td colSpan="2" style={{ padding: '10px', backgroundColor: '#e0e0e0', fontWeight: 'bold' }}>
              Resumen Global
            </td>
          </tr>
          <tr>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
              <strong>Total a Pagar</strong>
            </td>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
              ${resumen.totalContractAmount.toLocaleString()}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
              <strong>Total Recaudado</strong>
            </td>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
              ${resumen.totalCollectedGlobal.toLocaleString()}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
              <strong>Déficit/Ganancia Global</strong>
            </td>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
              ${resumen.globalDeficit.toLocaleString()} ({resumen.porcentajeGlobal}%)
            </td>
          </tr>

          {/* Resumen Mensual (si se selecciona mes y año) */}
          {mesSeleccionado && anoSeleccionado && (
            <>
              <tr>
                <td colSpan="2" style={{ padding: '10px', backgroundColor: '#e0e0e0', fontWeight: 'bold' }}>
                  Resumen del Mes ({monthNames[parseInt(mesSeleccionado, 10) - 1]} {anoSeleccionado})
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                  <strong>Meta a Recaudar</strong>
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                  ${resumen.monthlyProjection.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                  <strong>Total Recaudado</strong>
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                  ${resumen.monthlyCollected.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                  <strong>Déficit/Ganancia del Mes</strong>
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                  ${resumen.monthlyDeficit.toLocaleString()} ({resumen.porcentajeMonthly}%)
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                  <strong>Déficit del Mes Anterior</strong>
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                  ${resumen.monthlyDeficitAnterior.toLocaleString()} ({resumen.porcentajeMonthlyAnterior}%)
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      {/* Botón para imprimir/certificar */}
      <button
        onClick={abrirCertificado}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#1976d2',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Certificar Montos
      </button>

      {/* Tabla: Estado de Pagos Mensual por Usuario */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>
          Estado de Pagos Mensual por Usuario
        </h3>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <label htmlFor="yearDisplay" style={{ marginRight: '10px', fontWeight: 'bold' }}>
            Año:
          </label>
          <select
            id="yearDisplay"
            value={yearDisplay}
            onChange={(e) => setYearDisplay(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            {[...Array(10)].map((_, index) => {
              const year = 2024 + index;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>

        {/* Estilo para efecto hover en filas */}
        <style>{`
          .hover-row:hover {
            background-color: #e0f7fa !important;
          }
        `}</style>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#1976d2', color: '#fff', textAlign: 'center' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Usuario</th>
              {monthNames.map((month, index) => (
                <th key={index} style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {month}
                </th>
              ))}
              {/* Columna final */}
              <th style={{
                padding: '10px',
                border: '1px solid #ddd',
                boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)'
              }}>
                Total Consignado (Año)
              </th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario, rowIndex) => {
              const fullName = `${usuario.nombres} ${usuario.apellidos}`;
              // Utilizamos parseFormattedNumber para obtener el valor correcto del salario
              const salary = parseFormattedNumber(usuario.salario) || 0;
              
              // Sumar pagos realizados en años anteriores al año de visualización
              let pagosAnteriores = 0;
              (usuario.pagos || []).forEach((pago) => {
                const pagoFecha = new Date(pago.fecha);
                if (pagoFecha.getFullYear() < parseInt(yearDisplay, 10)) {
                  pagosAnteriores += parseFloat(pago.montoNeto);
                }
              });

              let cumulative = pagosAnteriores;
              let totalPaidThisYear = 0;

              // Estilo alterno para filas
              const rowStyle = {
                backgroundColor: rowIndex % 2 === 0 ? '#f1f1f1' : 'transparent'
              };

              return (
                <tr key={usuario.id} style={rowStyle} className="hover-row">
                  {/* Nombre del usuario */}
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {fullName}
                  </td>

                  {/* Una celda por cada mes */}
                  {monthNames.map((_, index) => {
                    const monthNumber = index + 1;
                    // Modificar el cálculo de pagosMes para evitar duplicados
                    const pagosMes = (usuario.pagos || []).reduce((sum, pago) => {
                      const pagoFecha = new Date(pago.fecha);
                      if (
                        pagoFecha.getFullYear() === parseInt(yearDisplay, 10) &&
                        (pagoFecha.getMonth() + 1) === monthNumber
                      ) {
                        // Solo sumamos el montoNeto una vez
                        return parseFloat(pago.montoNeto);
                      }
                      return sum;
                    }, 0);

                    cumulative += pagosMes;
                    totalPaidThisYear += pagosMes;

                    let displayText = '';
                    let cellStyle = {
                      padding: '10px',
                      border: '1px solid #ddd',
                      textAlign: 'center'
                    };

                    if (cumulative >= salary) {
                      if (pagosMes > 0) {
                        displayText = `$${pagosMes.toLocaleString()}`;
                      } else {
                        displayText = 'Completado';
                      }
                      cellStyle.backgroundColor = '#c8e6c9';
                    } else {
                      displayText = pagosMes > 0 ? `$${pagosMes.toLocaleString()}` : 'No Pago';
                      cellStyle.backgroundColor = pagosMes > 0 ? 'transparent' : '#ffe6e6';
                    }

                    return (
                      <td key={index} style={cellStyle}>
                        {displayText}
                      </td>
                    );
                  })}

                  {/* Columna: Total Consignado (Año) */}
                  <td
                    style={{
                      padding: '10px',
                      border: '1px solid #ddd',
                      textAlign: 'center',
                      boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)'
                    }}
                  >
                    {totalPaidThisYear > 0 ? `$${totalPaidThisYear.toLocaleString()}` : 'No Pago'}
                  </td>
                </tr>
              );
            })}
            {/* Después del último usuario, agregar fila de totales */}
            <tr style={{ 
              backgroundColor: '#e3f2fd',
              fontWeight: 'bold',
              borderTop: '2px solid #1976d2'
            }}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                Total Mensual
              </td>
              {monthNames.map((_, index) => {
                const monthNumber = index + 1;
                // Calcular el total de todos los pagos del mes
                const totalMes = usuarios.reduce((total, usuario) => {
                  return total + (usuario.pagos || []).reduce((sum, pago) => {
                    const pagoFecha = new Date(pago.fecha);
                    if (
                      pagoFecha.getFullYear() === parseInt(yearDisplay, 10) &&
                      (pagoFecha.getMonth() + 1) === monthNumber
                    ) {
                      return sum + parseFloat(pago.montoNeto);
                    }
                    return sum;
                  }, 0);
                }, 0);

                return (
                  <td key={index} style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    textAlign: 'center',
                    backgroundColor: totalMes > 0 ? '#e3f2fd' : '#ffe6e6'
                  }}>
                    {totalMes > 0 ? `$${totalMes.toLocaleString()}` : 'No Pagos'}
                  </td>
                );
              })}
              {/* Total anual */}
              <td style={{
                padding: '10px',
                border: '1px solid #ddd',
                textAlign: 'center',
                boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)',
                backgroundColor: '#e3f2fd'
              }}>
                ${usuarios.reduce((total, usuario) => {
                  return total + (usuario.pagos || []).reduce((sum, pago) => {
                    const pagoFecha = new Date(pago.fecha);
                    if (pagoFecha.getFullYear() === parseInt(yearDisplay, 10)) {
                      return sum + parseFloat(pago.montoNeto);
                    }
                    return sum;
                  }, 0);
                }, 0).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResumenFinanciero;
