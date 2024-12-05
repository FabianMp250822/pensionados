import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './VisorFacturas.css';
import Swal from 'sweetalert2';
import { Select } from '@mui/material';

const VisorFacturas = ({ usuarioSeleccionado }) => {
  const facturas = useSelector((state) => state.pensiones.pensiones) || [];

  const [añoSeleccionado, setAñoSeleccionado] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const fechaActual = new Date();
  const fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1); // Primer día del mes actual
  const fechaFin = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0); // Último día del mes actual
 

  const [facturasFiltradas, setFacturasFiltradas] = useState([]);
  const componentRef = useRef();
  const [detalleSeleccionado, setDetalleSeleccionado] = useState([]);
  

 
  const handleDownloadPdf = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;
  
    for (const factura of facturasFiltradas) {
      const facturaElement = document.getElementById(`factura-${factura.id}`);
      
      // Verificar si facturaElement existe antes de intentar usarlo
      if (facturaElement) {
        const canvas = await html2canvas(facturaElement, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
        if (position + imgHeight > pdf.internal.pageSize.height) {
          pdf.addPage();
          position = 0;
        }
  
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        position += imgHeight + 10;
      } else {
        console.warn(`No se encontró el elemento para factura con id: factura-${factura.id}`);
      }
    }
  
    pdf.save('facturas.pdf');
  };
  

  const MESES = [
    { nombre: 'Enero', valor: '01' },
    { nombre: 'Febrero', valor: '02' },
    { nombre: 'Marzo', valor: '03' },
    { nombre: 'Abril', valor: '04' },
    { nombre: 'Mayo', valor: '05' },
    { nombre: 'Junio', valor: '06' },
    { nombre: 'Julio', valor: '07' },
    { nombre: 'Agosto', valor: '08' },
    { nombre: 'Septiembre', valor: '09' },
    { nombre: 'Octubre', valor: '10' },
    { nombre: 'Noviembre', valor: '11' },
    { nombre: 'Diciembre', valor: '12' },
  ];

  const añosDisponibles = [...new Set(facturas.map((factura) => factura.año))].sort();

  const filtrarFacturas = () => {
    let filtradas = facturas;
  
    if (añoSeleccionado) {
      filtradas = filtradas.filter((factura) => factura.año === añoSeleccionado);
    }
    if (mesSeleccionado) {
      filtradas = filtradas.filter((factura) => {
        const { mesNumero } = obtenerMesDePeriodoPago(factura.periodoPago);
        return mesNumero === mesSeleccionado;
      });
    }
  
    if (detalleSeleccionado.length > 0) {
      filtradas = filtradas.filter((factura) =>
        factura.detalles.some((detalle) => detalleSeleccionado.includes(detalle.nombre))
      );
    }
  
    const uniqueFacturas = [];
    const facturasMap = new Map();
  
    for (const factura of filtradas) {
      const key = `${factura.periodoPago}-${factura.valorNeto}`;
      if (!facturasMap.has(key)) {
        facturasMap.set(key, true);
        uniqueFacturas.push(factura);
      }
    }
  
    uniqueFacturas.sort((a, b) => {
      const fechaA = new Date(`${a.año}-${obtenerMesDePeriodoPago(a.periodoPago).mesNumero}-01`);
      const fechaB = new Date(`${b.año}-${obtenerMesDePeriodoPago(b.periodoPago).mesNumero}-01`);
      return fechaA - fechaB;
    });
  
    setFacturasFiltradas(uniqueFacturas);
  };
  
  const calcularSumaDetalle = () => {
    let totalIngresos = 0;
    let totalEgresos = 0;
  
    facturasFiltradas.forEach((factura) => {
      factura.detalles.forEach((detalle) => {
        if (detalleSeleccionado.length === 0 || detalleSeleccionado.includes(detalle.nombre)) {
          totalIngresos += parseFloat(detalle.ingresos) || 0;
          totalEgresos += parseFloat(detalle.egresos) || 0;
        }
      });
    });
  
    return {
      ingresos: formatoMoneda(totalIngresos),
      egresos: formatoMoneda(totalEgresos),
    };
  };
  

  const obtenerMesDePeriodoPago = (periodoPago) => {
    const meses = {
      ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06',
      jul: '07', ago: '08', sep: '09', sept: '09', oct: '10', nov: '11', dic: '12',
    };
    const nombresMeses = {
      ene: 'Enero', feb: 'Febrero', mar: 'Marzo', abr: 'Abril', may: 'Mayo',
      jun: 'Junio', jul: 'Julio', ago: 'Agosto', sep: 'Septiembre', sept: 'Septiembre',
      oct: 'Octubre', nov: 'Noviembre', dic: 'Diciembre',
    };
    const regex = /([a-z]{3,4})\.?/gi;
    const matches = periodoPago.toLowerCase().match(regex);

    if (matches && matches.length > 0) {
      const mesAbreviado = matches[0].replace('.', '').replace(/[^a-z]/g, '');
      return { mesNumero: meses[mesAbreviado], mesNombre: nombresMeses[mesAbreviado] };
    }
    return { mesNumero: '', mesNombre: '' };
  };

  useEffect(() => {
    filtrarFacturas();
  }, [añoSeleccionado, mesSeleccionado, facturas]);

  const nombresDetallesDisponibles = [...new Set(facturas.flatMap(factura => factura.detalles.map(detalle => detalle.nombre)))];


  const handleCertificar = async () => {
    const tablaTotalesHtml = document.querySelector('.totales').outerHTML;
    const logoUrl = "https://dajusticia.com/web/wp-content/uploads/2024/01/logo-dajusticia-8.png";
    const contenidoCertificacion = `
      <div id="certificacion-pdf" style="
        width: 100%; 
        padding: 20px; 
        font-family: Arial, sans-serif; 
        font-size: 10px; 
        line-height: 1.5; 
        box-sizing: border-box;
        background-color: #fff;">
        
        <!-- Encabezado -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <img src="${logoUrl}" alt="Logotipo de la Empresa" style="max-width: 100px;">
            </div>
            <div style="text-align: left; font-size: 10px;">
             <p style="margin: 0; font-weight: bold;">Dajusticia</p>
<p style="margin: 0;">Edificio Distrito 90, oficina 5.1, Barranquilla, Atlántico, Colombia</p>
<p style="margin: 0;">Teléfonos: 300 805 9324, 320 569 8267, (605) 355 45 55, (605) 385 65 05</p>
<p style="margin: 0;">Correo: soporte@dajusticia.com</p>
<p style="margin: 0;">www.dajusticia.com</p>

            </div>
          </div>
          <div style="text-align: center; margin-top: 10px;">
            <h1 style="font-size: 16px; margin-bottom: 5px;">Estado de Cuenta</h1>
            <p style="font-size: 12px; margin: 0; color: #555;">Emitido por el Departamento de Contabilidad</p>
            <p style="font-size: 12px; margin: 0; color: #555;">Fecha de emisión: ${fechaActual.toLocaleDateString()}</p>
          </div>
        </div>
  
        <!-- Información del Cliente -->
        <div style="margin-bottom: 20px; text-align: left;">
          <p style="margin: 0;"><strong>Nombre del Cliente:</strong> ${usuarioSeleccionado.nombre || "Sin nombre"}</p>
          <p style="margin: 0;"><strong>Periodo del Informe:</strong> ${fechaInicio.toLocaleDateString()} a ${fechaFin.toLocaleDateString()}</p>
        </div>
  
        <!-- Tabla de Detalle de Pagos -->
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 14px; margin-bottom: 10px; text-align: left;">Detalle de Pagos Realizados</h2>
          <table style="
            width: 100%; 
            border-collapse: collapse; 
            font-size: 9px;
            text-align: left;">
            <thead>
              <tr style="background-color: #f2f2f2; border: 1px solid #ddd;">
                <th style="padding: 5px; border: 1px solid #ddd;">Fecha del Pago</th>
                <th style="padding: 5px; border: 1px solid #ddd;">Concepto</th>
                <th style="padding: 5px; border: 1px solid #ddd;">Referencia</th>
                <th style="padding: 5px; border: 1px solid #ddd;">Método de Pago</th>
                <th style="padding: 5px; border: 1px solid #ddd;">Monto Pagado</th>
                <th style="padding: 5px; border: 1px solid #ddd;">Saldo</th>
              </tr>
            </thead>
            <tbody>
              ${tablaTotalesHtml}
            </tbody>
          </table>
        </div>
  
        <!-- Pie de Página -->
        <div style="text-align: left;">
          <p style="margin-bottom: 10px;">
            <strong>Nota:</strong> Este documento certifica que los pagos indicados han sido registrados correctamente por nuestra institución desde el emisor aprobado FONECA.
          </p>
          <div style="margin-top: 40px;">
            <p><strong>Firma Autorizada:</strong></p>
            <p>____________________________</p>
            <p style="font-size: 10px; color: #555;">Departamento de Contabilidad</p>
          </div>
        </div>
      </div>
    `;

    // Crear contenedor temporal para convertir en PDF
    const container = document.createElement('div');
    container.id = 'pdf-container';
    container.innerHTML = contenidoCertificacion;
    document.body.appendChild(container);

    // Capturar el contenido como imagen y generar PDF
    const pdfElement = document.getElementById('pdf-container');
    const canvas = await html2canvas(pdfElement, { scale: 2 }); // Ajustar escala para alta calidad
    const imgData = canvas.toDataURL('image/png');

    // Configurar jsPDF con tamaño ajustable
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`estado_de_cuenta_${usuarioSeleccionado.nombre || "cliente"}.pdf`);

    // Limpiar contenedor temporal
    document.body.removeChild(container);
  };
  
  const sumaDetalle = calcularSumaDetalle();

  const agruparPorAñoYMes = () => {
    const agrupados = {};

    facturasFiltradas.forEach((factura) => {
      const { año, periodoPago, detalles } = factura;
      const { mesNumero, mesNombre } = obtenerMesDePeriodoPago(periodoPago);

      if (!agrupados[año]) agrupados[año] = {};

      if (!agrupados[año][mesNombre]) {
        agrupados[año][mesNombre] = {
          ingresos: 0,
          egresos: 0,
        };
      }

      detalles.forEach((detalle) => {
        if (
          detalleSeleccionado.length === 0 ||
          detalleSeleccionado.includes(detalle.nombre)
        ) {
          agrupados[año][mesNombre].ingresos += parseFloat(detalle.ingresos) || 0;
          agrupados[año][mesNombre].egresos += parseFloat(detalle.egresos) || 0;
        }
      });
    });
    return agrupados;
  };
  const opcionesDetalles = nombresDetallesDisponibles.map((nombreDetalle) => ({
    value: nombreDetalle,
    label: nombreDetalle,
  }));
  return (
    <div className="visor-facturas">
      <h2>Certificaciones de pagos Recibidos</h2>
   
      <button className="boton-certificar" onClick={handleCertificar}>
        Certificar
      </button>
  
      <div className="filtros" style={{ marginTop: "20px" }}>
        <div className="filtro" style={{ marginBottom: "10px" }}>
          <label htmlFor="filtro-año">Filtrar por año:</label>
          <select
            id="filtro-año"
            value={añoSeleccionado}
            onChange={(e) => setAñoSeleccionado(e.target.value)}
          >
            <option value="">Todos</option>
            {añosDisponibles.map((año) => (
              <option key={año} value={año}>
                {año}
              </option>
            ))}
          </select>
        </div>
        <div className="filtro" style={{ marginBottom: "10px" }}>
          <label htmlFor="filtro-mes">Filtrar por mes:</label>
          <select
            id="filtro-mes"
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
          >
            <option value="">Todos</option>
            {MESES.map((mes) => (
              <option key={mes.valor} value={mes.valor}>
                {mes.nombre}
              </option>
            ))}
          </select>
        </div>
       
        <div className="filtro" style={{ marginBottom: "10px" }}>
  <label htmlFor="filtro-detalle">Filtrar por detalle:</label>
  <div
    id="filtro-detalle"
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      padding: "10px",
      border: "1px solid #ccc",
      borderRadius: "5px",
      maxWidth: "300px",
      maxHeight: "150px", // Altura máxima para mostrar tres elementos aproximadamente
      overflowY: "auto", // Activa el scroll vertical
      background: "#f9f9f9",
    }}
  >
    {nombresDetallesDisponibles.map((nombreDetalle) => (
      <div
        key={nombreDetalle}
        onClick={() => {
          // Agregar o quitar el elemento seleccionado
          if (detalleSeleccionado.includes(nombreDetalle)) {
            setDetalleSeleccionado(
              detalleSeleccionado.filter((detalle) => detalle !== nombreDetalle)
            );
          } else {
            setDetalleSeleccionado([...detalleSeleccionado, nombreDetalle]);
          }
        }}
        style={{
          padding: "5px 10px",
          border: "1px solid #007bff",
          borderRadius: "5px",
          cursor: "pointer",
          background: detalleSeleccionado.includes(nombreDetalle)
            ? "#007bff"
            : "#ffffff",
          color: detalleSeleccionado.includes(nombreDetalle) ? "#fff" : "#000",
        }}
        onDoubleClick={() => {
          // Doble clic para deseleccionar directamente
          setDetalleSeleccionado(
            detalleSeleccionado.filter((detalle) => detalle !== nombreDetalle)
          );
        }}
      >
        {nombreDetalle}
      </div>
    ))}
  </div>
</div>



      </div>
  
      {/* Tabla agrupada por año y meses en un contenedor con scroll horizontal */}
      <div className="totales" style={{ marginTop: "20px", overflowX: "auto" }}>
        <table className="tabla-agrupada">
          <thead>
            <tr>
              <th>Año</th>
              {MESES.map((mes) => (
                <th key={mes.valor}>{mes.nombre}</th>
              ))}
              <th>Total del Año</th>
            </tr>
          </thead>
          <tbody>
            {facturasFiltradas.length > 0 ? (
              Object.entries(
                facturasFiltradas.reduce((agrupados, factura) => {
                  const { año, periodoPago, detalles } = factura;
                  const { mesNumero } = obtenerMesDePeriodoPago(periodoPago);
  
                  if (!agrupados[año]) agrupados[año] = {};
                  if (!agrupados[año][mesNumero])
                    agrupados[año][mesNumero] = { ingresos: 0, egresos: 0 };
  
                  detalles.forEach((detalle) => {
                    if (
                      detalleSeleccionado.length === 0 ||
                      detalleSeleccionado.includes(detalle.nombre)
                    ) {
                      agrupados[año][mesNumero].ingresos +=
                        parseFloat(detalle.ingresos) || 0;
                      agrupados[año][mesNumero].egresos +=
                        parseFloat(detalle.egresos) || 0;
                    }
                  });
  
                  return agrupados;
                }, {})
              ).map(([año, meses]) => {
                const totalIngresosAño = Object.values(meses).reduce(
                  (acc, valores) => acc + (valores.ingresos || 0),
                  0
                );
                const totalEgresosAño = Object.values(meses).reduce(
                  (acc, valores) => acc + (valores.egresos || 0),
                  0
                );
  
                return (
                  <tr key={año}>
                    <td>{año}</td>
                    {MESES.map((mes) => {
                      const valores = meses[mes.valor];
                      const ingresos =
                        valores && valores.ingresos > 0
                          ? formatoMoneda(valores.ingresos)
                          : null;
                      const egresos =
                        valores && valores.egresos > 0
                          ? formatoMoneda(valores.egresos)
                          : null;
  
                      return (
                        <td key={mes.valor}>
                          {ingresos && egresos
                            ? `${ingresos} / ${egresos}`
                            : ingresos || egresos || '-'}
                        </td>
                      );
                    })}
                    <td>
                      {`${formatoMoneda(totalIngresosAño)} / ${formatoMoneda(
                        totalEgresosAño
                      )}`}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={MESES.length + 2}>
                  No hay facturas para los criterios seleccionados.
                </td>
              </tr>
            )}
          </tbody>
          {/* Fila de sumas totales */}
          <tfoot>
            <tr>
              <td>Totales</td>
              {MESES.map((mes) => {
                const totalIngresosMes = facturasFiltradas.reduce((acc, factura) => {
                  const { mesNumero } = obtenerMesDePeriodoPago(factura.periodoPago);
                  if (mes.valor === mesNumero) {
                    return (
                      acc +
                      factura.detalles.reduce(
                        (sum, detalle) =>
                          detalleSeleccionado.length === 0 ||
                          detalleSeleccionado.includes(detalle.nombre)
                            ? sum + (detalle.ingresos || 0)
                            : sum,
                        0
                      )
                    );
                  }
                  return acc;
                }, 0);
  
                const totalEgresosMes = facturasFiltradas.reduce((acc, factura) => {
                  const { mesNumero } = obtenerMesDePeriodoPago(factura.periodoPago);
                  if (mes.valor === mesNumero) {
                    return (
                      acc +
                      factura.detalles.reduce(
                        (sum, detalle) =>
                          detalleSeleccionado.length === 0 ||
                          detalleSeleccionado.includes(detalle.nombre)
                            ? sum + (detalle.egresos || 0)
                            : sum,
                        0
                      )
                    );
                  }
                  return acc;
                }, 0);
  
                return (
                  <td key={mes.valor}>
                    {`${formatoMoneda(totalIngresosMes)} / ${formatoMoneda(
                      totalEgresosMes
                    )}`}
                  </td>
                );
              })}
              <td>
                {`${formatoMoneda(
                  facturasFiltradas.reduce(
                    (acc, factura) =>
                      acc +
                      factura.detalles.reduce(
                        (sum, detalle) =>
                          detalleSeleccionado.length === 0 ||
                          detalleSeleccionado.includes(detalle.nombre)
                            ? sum + (detalle.ingresos || 0)
                            : sum,
                        0
                      ),
                    0
                  )
                )} / ${formatoMoneda(
                  facturasFiltradas.reduce(
                    (acc, factura) =>
                      acc +
                      factura.detalles.reduce(
                        (sum, detalle) =>
                          detalleSeleccionado.length === 0 ||
                          detalleSeleccionado.includes(detalle.nombre)
                            ? sum + (detalle.egresos || 0)
                            : sum,
                        0
                      ),
                    0
                  )
                )}`}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
  
  
};

// Función para formatear números como moneda
const obtenerMesDePeriodoPago = (periodoPago) => {
  const meses = {
    ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06',
    jul: '07', ago: '08', sep: '09', sept: '09', oct: '10', nov: '11', dic: '12',
  };
  const nombresMeses = {
    ene: 'Enero', feb: 'Febrero', mar: 'Marzo', abr: 'Abril', may: 'Mayo',
    jun: 'Junio', jul: 'Julio', ago: 'Agosto', sep: 'Septiembre', sept: 'Septiembre',
    oct: 'Octubre', nov: 'Noviembre', dic: 'Diciembre',
  };
  const regex = /([a-z]{3,4})\.?/gi;
  const matches = periodoPago.toLowerCase().match(regex);

  if (matches && matches.length > 0) {
    const mesAbreviado = matches[0].replace('.', '').replace(/[^a-z]/g, '');
    return { mesNumero: meses[mesAbreviado], mesNombre: nombresMeses[mesAbreviado] };
  }
  return { mesNumero: '', mesNombre: '' };
};

// Función para formatear números como moneda
const formatoMoneda = (valor) => {
  if (valor == null || valor === '') return '$ 0';
  const numero = parseFloat(valor.toString().replace(/[^0-9.-]+/g, '').replace(',', '.'));
  if (isNaN(numero)) return '$ 0';
  return numero.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
};

export default VisorFacturas;
