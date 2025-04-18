import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './VisorFacturas.css';
import Swal from 'sweetalert2';
import { Select } from '@mui/material';

const VisorFacturas = ({ usuarioSeleccionado }) => {
  const facturas = useSelector((state) => state.pensiones.pensiones) || [];

  // Estados para filtros y datos
  const [añoSeleccionado, setAñoSeleccionado] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [facturasFiltradas, setFacturasFiltradas] = useState([]);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState([]);

  // Estado para controlar si ya hicimos la preselección (evitar re-asignar)
  const [defaultsAsignados, setDefaultsAsignados] = useState(false);

  const componentRef = useRef();

  const fechaActual = new Date();
  const fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
  const fechaFin = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

  // Descarga en PDF las facturas filtradas
  const handleDownloadPdf = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    for (const factura of facturasFiltradas) {
      const facturaElement = document.getElementById(`factura-${factura.id}`);
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
        console.warn(`No se encontró el elemento para factura: factura-${factura.id}`);
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

  // --- PRESELECCIONAR EL ÚLTIMO PAGO RECIBIDO ---
  useEffect(() => {
    // Sólo si no asignamos defaults todavía y hay facturas disponibles
    if (!defaultsAsignados && facturas.length > 0) {
      // Ordenamos para encontrar la factura más reciente
      const ordenadas = [...facturas].sort((a, b) => {
        const fechaA = new Date(`${a.año}-${obtenerMesDePeriodoPago(a.periodoPago).mesNumero}-01`);
        const fechaB = new Date(`${b.año}-${obtenerMesDePeriodoPago(b.periodoPago).mesNumero}-01`);
        return fechaA - fechaB;
      });
      const ultimaFactura = ordenadas[ordenadas.length - 1];
      if (ultimaFactura) {
        const { mesNumero } = obtenerMesDePeriodoPago(ultimaFactura.periodoPago);
        setAñoSeleccionado(ultimaFactura.año.toString());
        setMesSeleccionado(mesNumero);
        setDefaultsAsignados(true);
      }
    }
  }, [facturas, defaultsAsignados]);

  // Efecto: cada vez que cambie año, mes o facturas, se filtra
  useEffect(() => {
    filtrarFacturas();
  }, [añoSeleccionado, mesSeleccionado, facturas]);

  // Filtra las facturas según los criterios
  const filtrarFacturas = () => {
    let filtradas = facturas;

    // Filtro por año
    if (añoSeleccionado) {
      filtradas = filtradas.filter((factura) => factura.año === añoSeleccionado);
    }

    // Filtro por mes
    if (mesSeleccionado) {
      filtradas = filtradas.filter((factura) => {
        const { mesNumero } = obtenerMesDePeriodoPago(factura.periodoPago);
        return mesNumero === mesSeleccionado;
      });
    }

    // Filtro por detalle
    if (detalleSeleccionado.length > 0) {
      filtradas = filtradas.filter((factura) =>
        factura.detalles.some((detalle) => detalleSeleccionado.includes(detalle.nombre))
      );
    }

    // Eliminar duplicados (periodoPago-valorNeto)
    const uniqueFacturas = [];
    const facturasMap = new Map();

    for (const factura of filtradas) {
      const key = `${factura.periodoPago}-${factura.valorNeto}`;
      if (!facturasMap.has(key)) {
        facturasMap.set(key, true);
        uniqueFacturas.push(factura);
      }
    }

    // Ordenar por fecha (año-mes)
    uniqueFacturas.sort((a, b) => {
      const fechaA = new Date(`${a.año}-${obtenerMesDePeriodoPago(a.periodoPago).mesNumero}-01`);
      const fechaB = new Date(`${b.año}-${obtenerMesDePeriodoPago(b.periodoPago).mesNumero}-01`);
      return fechaA - fechaB;
    });

    setFacturasFiltradas(uniqueFacturas);
  };

  // Función para extraer {mesNumero, mesNombre} de un periodoPago
  const obtenerMesDePeriodoPago = (periodoPago) => {
    if (!periodoPago || typeof periodoPago !== 'string') {
      return { mesNumero: '', mesNombre: '' };
    }
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
      return {
        mesNumero: meses[mesAbreviado],
        mesNombre: nombresMeses[mesAbreviado],
      };
    }
    return { mesNumero: '', mesNombre: '' };
  };

  // Formatear valores como moneda
  const formatoMoneda = (valor) => {
    if (valor == null || valor === '') return '$ 0';
    const numero = parseFloat(valor.toString().replace(/[^0-9.-]+/g, '').replace(',', '.'));
    if (isNaN(numero)) return '$ 0';
    return numero.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    });
  };

  // Botón “Certificar” si lo usas
  const handleCertificar = async () => {
    // ... Lógica de certificación PDF o similar
    // p.e. Swal.fire('Certificado', 'Se creó un PDF', 'success');
  };

  return (
    <div className="visor-facturas">
      {/* Cabecera: Título y botón “Certificar” */}
      <div className="visor-cert-header">
        <div className="column-cert-title">
          <h2 className="visor-cert-title">Certificaciones de pagos Recibidos</h2>
        </div>
        <div className="column-cert-button">
          <button className="boton-certificar" onClick={handleCertificar}>
            Certificar
          </button>
        </div>
      </div>

      {/* Botón para descargar PDF */}
      <button className="boton-imprimir" onClick={handleDownloadPdf}>
        Descargar PDF
      </button>

      {/* Filtros */}
      <div className="filtros" style={{ marginTop: '20px' }}>
        <div className="filtro" style={{ marginBottom: '10px' }}>
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

        <div className="filtro" style={{ marginBottom: '10px' }}>
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

        {/* Ejemplo de filtro por detalle (selecciones múltiples) */}
        <div className="filtro" style={{ marginBottom: '10px' }}>
          <label htmlFor="filtro-detalle">Filtrar por detalle:</label>
          <div
            id="filtro-detalle"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              maxWidth: '300px',
              maxHeight: '150px',
              overflowY: 'auto',
              background: '#f9f9f9',
            }}
          >
            {facturas.length > 0 &&
              [...new Set(facturas.flatMap((f) => f.detalles.map((d) => d.nombre)))]
                .map((nombreDetalle) => (
                  <div
                    key={nombreDetalle}
                    onClick={() => {
                      // Agregar/quitar detalle
                      if (detalleSeleccionado.includes(nombreDetalle)) {
                        setDetalleSeleccionado(
                          detalleSeleccionado.filter((det) => det !== nombreDetalle)
                        );
                      } else {
                        setDetalleSeleccionado([...detalleSeleccionado, nombreDetalle]);
                      }
                    }}
                    onDoubleClick={() => {
                      // Doble clic para deseleccionar directamente
                      setDetalleSeleccionado(
                        detalleSeleccionado.filter((det) => det !== nombreDetalle)
                      );
                    }}
                    style={{
                      padding: '5px 10px',
                      border: '1px solid #007bff',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      background: detalleSeleccionado.includes(nombreDetalle)
                        ? '#007bff'
                        : '#ffffff',
                      color: detalleSeleccionado.includes(nombreDetalle) ? '#fff' : '#000',
                    }}
                  >
                    {nombreDetalle}
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* Render de facturas filtradas */}
      <div ref={componentRef} className="lista-facturas">
        {facturasFiltradas.map((factura) => {
          const { mesNombre } = obtenerMesDePeriodoPago(factura.periodoPago);
          return (
            <div key={factura.id} id={`factura-${factura.id}`} className="factura">
              <h3>
                Boletín de pago {mesNombre} {factura.año}
              </h3>
              <p>
                Periodo de Pago: {factura.periodoPago} - Valor Neto: {factura.valorNeto}
              </p>
              <table className="tabla-detalles">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Ingresos</th>
                    <th>Egresos</th>
                  </tr>
                </thead>
                <tbody>
                  {factura.detalles.map((detalle, index) => (
                    <tr key={index}>
                      <td>{detalle.nombre}</td>
                      <td>{formatoMoneda(detalle.ingresos)}</td>
                      <td>{formatoMoneda(detalle.egresos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
        {facturasFiltradas.length === 0 && (
          <p>No hay facturas para los criterios seleccionados.</p>
        )}
      </div>
    </div>
  );
};

export default VisorFacturas;
