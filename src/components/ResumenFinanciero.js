import React, { useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const ResumenFinanciero = ({ usuarios }) => {
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const MySwal = withReactContent(Swal);

  const obtenerDatosFiltrados = () => {
    if (!mesSeleccionado) return usuarios;

    return usuarios.map((usuario) => {
      const pagosFiltrados = usuario.pagos.filter((pago) => {
        const fecha = new Date(pago.fecha);
        return fecha.getMonth() + 1 === parseInt(mesSeleccionado); // Meses van de 0 a 11
      });
      return { ...usuario, pagos: pagosFiltrados };
    });
  };

  const calcularResumen = () => {
    const datosFiltrados = obtenerDatosFiltrados();

    let totalAPagar = 0;
    let totalPagado = 0;

    datosFiltrados.forEach((usuario) => {
      const cuotaMensual = parseFloat(usuario.cuotaMensual);
      const plazoMeses = parseInt(usuario.plazoMeses);
      const totalUsuarioAPagar = cuotaMensual * plazoMeses;
      const totalUsuarioPagado = usuario.pagos.reduce(
        (sum, pago) => sum + parseFloat(pago.montoNeto),
        0
      );

      totalAPagar += totalUsuarioAPagar;
      totalPagado += totalUsuarioPagado;
    });

    return {
      totalAPagar,
      totalPagado,
      deudaActual: totalAPagar - totalPagado,
      porcentajeRecaudado: ((totalPagado / totalAPagar) * 100).toFixed(2),
    };
  };

  const resumen = calcularResumen();

  const abrirCertificado = () => {
    MySwal.fire({
      title: '<strong>Certificación de Montos</strong>',
      html: `
        <div id="certificado" style="text-align: left; font-size: 14px; line-height: 1.5;">
          <p><strong>Dajusicia</strong></p>
          
          <p style="text-align: right;">[${new Date().toLocaleDateString()}]</p>
          
          <p><strong>Asunto:</strong> Informe de Estado Financiero y Recaudación</p>
          <p>Estimado/a Directiva</p>

          <p>
            Por medio de la presente, me permito presentar un resumen detallado del estado financiero correspondiente al período 
            ${
              mesSeleccionado
                ? new Date(0, mesSeleccionado - 1).toLocaleString('es-ES', { month: 'long' })
                : 'general'
            }, con el propósito de informar sobre los montos totales a recaudar, lo recaudado hasta la fecha, las deudas pendientes y el porcentaje de cumplimiento alcanzado.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #1976d2; color: white; text-align: left;">
                <th style="padding: 10px; border: 1px solid #ddd;">Descripción</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Monto/Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">Total a Pagar</td>
                <td style="padding: 10px; border: 1px solid #ddd;">$${resumen.totalAPagar.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">Total Recaudado</td>
                <td style="padding: 10px; border: 1px solid #ddd;">$${resumen.totalPagado.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">Deuda Actual</td>
                <td style="padding: 10px; border: 1px solid #ddd;">$${resumen.deudaActual.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">Porcentaje Recaudado</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${resumen.porcentajeRecaudado}%</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">Estado de la Caja</td>
                <td style="padding: 10px; border: 1px solid #ddd;">
                  ${
                    resumen.porcentajeRecaudado >= 75
                      ? 'Saneado'
                      : resumen.porcentajeRecaudado >= 50
                      ? 'Aceptable'
                      : 'Déficit'
                  }
                </td>
              </tr>
            </tbody>
          </table>

          <p><strong>Análisis y Observaciones</strong></p>
          <p>Total a Pagar: Representa el monto objetivo establecido como meta total de recaudación.</p>
          <p>Total Recaudado: Corresponde a los ingresos obtenidos hasta la fecha del presente informe.</p>
          <p>Deuda Actual: Muestra la diferencia entre el monto total a pagar y lo recaudado hasta ahora.</p>
          <p>Porcentaje Recaudado: Refleja el progreso en términos porcentuales respecto a la meta establecida.</p>
          <p>Estado de la Caja: Indica si la situación financiera está en equilibrio o presenta algún déficit.</p>

          <p style="margin-top: 40px;">Atentamente,</p>
          <p style="margin-top: 40px;">___________________________</p>
         <p style="margin-top: 40px;">Departamento de finanzas</p>
          
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
    <div style={{ margin: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Resumen Financiero</h2>

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <label htmlFor="mes" style={{ marginRight: '10px', fontWeight: 'bold' }}>Filtrar por mes:</label>
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

      <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ backgroundColor: '#1976d2', color: '#fff', textAlign: 'left' }}>
            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Descripción</th>
            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Monto</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}><strong>Total a Recaudar</strong></td>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>${resumen.totalAPagar.toLocaleString()}</td>
          </tr>
          <tr>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}><strong>Total Recaudado</strong></td>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>${resumen.totalPagado.toLocaleString()}</td>
          </tr>
          <tr>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}><strong>Monto pendiente</strong></td>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>${resumen.deudaActual.toLocaleString()}</td>
          </tr>
          <tr>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}><strong>Porcentaje Recaudado</strong></td>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{resumen.porcentajeRecaudado}%</td>
          </tr>
          <tr>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}><strong>Estado de la Caja</strong></td>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
              {resumen.porcentajeRecaudado >= 75
                ? 'Saneado'
                : resumen.porcentajeRecaudado >= 50
                ? 'Aceptable'
                : 'Déficit'}
            </td>
          </tr>
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
