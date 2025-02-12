import React, { useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const ResumenFinanciero = ({ usuarios }) => {
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [anoSeleccionado, setAnoSeleccionado] = useState('');
  const MySwal = withReactContent(Swal);

  // Función para generar la proyección de fechas de pago (una por cada cuota)
  const proyectarFechasDePago = (fechaInicio, plazoMeses) => {
    const fechasProyectadas = [];
    let fechaActual = new Date(fechaInicio);
    for (let i = 0; i < plazoMeses; i++) {
      fechasProyectadas.push(new Date(fechaActual));
      fechaActual.setMonth(fechaActual.getMonth() + 1);
    }
    return fechasProyectadas;
  };

  const calcularResumen = () => {
    // ----------------------------
    // RESUMEN GLOBAL (para todo el contrato)
    // ----------------------------
    let totalContractAmount = 0;   // Total que se debe recaudar (contrato completo)
    let totalCollectedGlobal = 0;  // Total recaudado (todos los pagos, sin filtrar por fecha)
    
    usuarios.forEach((usuario) => {
      const cuotaMensual = parseFloat(usuario.cuotaMensual);
      const plazoMeses = parseInt(usuario.plazoMeses);
      totalContractAmount += cuotaMensual * plazoMeses;
      
      // Sumar todos los pagos realizados por el usuario (globalmente)
      usuario.pagos.forEach((pago) => {
        totalCollectedGlobal += parseFloat(pago.montoNeto);
      });
    });
    
    const globalDeficit = totalContractAmount - totalCollectedGlobal;
    const porcentajeGlobal = totalContractAmount
      ? ((totalCollectedGlobal / totalContractAmount) * 100).toFixed(2)
      : 0;

    // ----------------------------
    // RESUMEN MENSUAL (solo si se selecciona mes y año)
    // ----------------------------
    let monthlyProjection = 0;  // Monto que se debería recaudar en el mes (según los acuerdos)
    let monthlyCollected = 0;   // Monto recaudado en el mes

    if (mesSeleccionado && anoSeleccionado) {
      usuarios.forEach((usuario) => {
        const cuotaMensual = parseFloat(usuario.cuotaMensual);
        const plazoMeses = parseInt(usuario.plazoMeses);
        // Se toma como fecha de inicio:
        // - Si el usuario realizó algún pago, usamos la fecha del primer pago.
        // - Si no, usamos la fecha actual (lo que implica que la proyección se basa en la fecha de hoy).
        const fechaInicio =
          usuario.pagos && usuario.pagos.length > 0
            ? new Date(usuario.pagos[0].fecha)
            : new Date();
        const fechasProyectadas = proyectarFechasDePago(fechaInicio, plazoMeses);
        // Se recorre la proyección: si alguna cuota se debe pagar en el mes/año seleccionado, se suma la cuota.
        fechasProyectadas.forEach((fecha) => {
          if (
            fecha.getMonth() + 1 === parseInt(mesSeleccionado) &&
            fecha.getFullYear() === parseInt(anoSeleccionado)
          ) {
            monthlyProjection += cuotaMensual;
          }
        });
        // Ahora se suman los pagos que se hayan realizado en el mes seleccionado
        usuario.pagos.forEach((pago) => {
          const pagoFecha = new Date(pago.fecha);
          if (
            pagoFecha.getMonth() + 1 === parseInt(mesSeleccionado) &&
            pagoFecha.getFullYear() === parseInt(anoSeleccionado)
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
    };
  };

  const resumen = calcularResumen();

  // Función para mostrar el certificado (con opción a imprimir)
  const abrirCertificado = () => {
    MySwal.fire({
      title: '<strong>Certificación de Montos</strong>',
      html: `
        <div id="certificado" style="text-align: left; font-size: 14px; line-height: 1.5;">
          <p><strong>Dajusicia</strong></p>
          <p style="text-align: right;">[${new Date().toLocaleDateString()}]</p>
          <p><strong>Asunto:</strong> Informe de Estado Financiero y Recaudación</p>
          <p>Estimado/a Directiva,</p>
          <p>
            Se presenta a continuación el resumen financiero:
          </p>
          <h3>Resumen Global</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total a Pagar (Contrato Completo)</strong></td>
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
          <h3>Resumen del Mes (${new Date(0, mesSeleccionado - 1).toLocaleString('es-ES', { month: 'long' })} ${anoSeleccionado})</h3>
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <div style={{ marginRight: '20px' }}>
          <label htmlFor="ano" style={{ marginRight: '10px', fontWeight: 'bold' }}>
            Filtrar por año:
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
            Filtrar por mes:
          </label>
          <select
            id="mes"
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">Todos</option>
            {[...Array(12)].map((_, index) => (
              <option key={index} value={index + 1}>
                {new Date(0, index).toLocaleString('es-ES', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#1976d2', color: '#fff', textAlign: 'left' }}>
            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Descripción</th>
            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Monto/Estado</th>
          </tr>
        </thead>
        <tbody>
          {/* Sección Global */}
          <tr>
            <td colSpan="2" style={{ padding: '10px', backgroundColor: '#e0e0e0', fontWeight: 'bold' }}>
              Resumen Global
            </td>
          </tr>
          <tr>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
              <strong>Total a Pagar (Contrato Completo)</strong>
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

          {/* Sección Mensual (solo si se selecciona mes y año) */}
          {mesSeleccionado && anoSeleccionado && (
            <>
              <tr>
                <td colSpan="2" style={{ padding: '10px', backgroundColor: '#e0e0e0', fontWeight: 'bold' }}>
                  Resumen del Mes ({new Date(0, mesSeleccionado - 1).toLocaleString('es-ES', { month: 'long' })} {anoSeleccionado})
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
            </>
          )}
        </tbody>
      </table>

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
    </div>
  );
};

export default ResumenFinanciero;
