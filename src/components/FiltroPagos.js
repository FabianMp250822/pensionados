import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './VisorFacturas.css';

const VisorFacturas = () => {
  const facturas = useSelector((state) => state.pensiones.pensiones) || [];
  const [añoSeleccionado, setAñoSeleccionado] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [facturasFiltradas, setFacturasFiltradas] = useState([]);
  const componentRef = useRef();

  // Estado para controlar si ya hicimos la preselección
  const [defaultsAsignados, setDefaultsAsignados] = useState(false);

  const handleDownloadPdf = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    for (const factura of facturasFiltradas) {
      const facturaElement = document.getElementById(`factura-${factura.id}`);
      if (!facturaElement) continue;
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

  // Lista de años según los datos
  const añosDisponibles = [...new Set(facturas.map((factura) => factura.año))].sort();

  // Efecto para preseleccionar año y mes del último pago
  useEffect(() => {
    if (!defaultsAsignados && facturas.length > 0) {
      // Ordena las facturas para encontrar la más reciente
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
        setDefaultsAsignados(true); // Para que no se vuelva a re-asignar
      }
    }
  }, [facturas, defaultsAsignados]);

  // Cada vez que cambie año, mes o facturas, filtramos
  useEffect(() => {
    filtrarFacturas();
  }, [añoSeleccionado, mesSeleccionado, facturas]);

  const filtrarFacturas = () => {
    let filtradas = [...facturas];

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

    // Eliminar duplicados en base a periodoPago y valorNeto
    const facturasUnicas = [];
    const keys = new Set();

    filtradas.forEach((factura) => {
      const key = `${factura.periodoPago}-${factura.valorNeto}`;
      if (!keys.has(key)) {
        keys.add(key);
        facturasUnicas.push(factura);
      }
    });

    // Ordenar por año y luego por mes
    facturasUnicas.sort((a, b) => {
      const fechaA = new Date(
        `${a.año}-${obtenerMesDePeriodoPago(a.periodoPago).mesNumero}-01`
      );
      const fechaB = new Date(
        `${b.año}-${obtenerMesDePeriodoPago(b.periodoPago).mesNumero}-01`
      );
      return fechaA - fechaB;
    });

    setFacturasFiltradas(facturasUnicas);
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

  return (
    <div className="visor-facturas">
      {/* Encabezado con título */}
      <div className="visor-facturas-header">
        <div className="column-title">
          <h2 className="visor-facturas-title">Mesadas pensionales recibidas</h2>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros">
        <div className="filtro">
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
        <div className="filtro">
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

        {/* Botón para descargar PDF con margen-top */}
        <div className="filtro">
          <button 
            className="boton-imprimir"
            style={{ marginTop: '15px' }}
            onClick={handleDownloadPdf}
          >
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Listado de facturas */}
      <div ref={componentRef} className="lista-facturas">
        {facturasFiltradas.length > 0 ? (
          facturasFiltradas.map((factura) => {
            const { mesNombre } = obtenerMesDePeriodoPago(factura.periodoPago);
            return (
              <div
                key={factura.id}
                id={`factura-${factura.id}`}
                className="factura"
              >
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
          })
        ) : (
          <p>No hay facturas para los criterios seleccionados.</p>
        )}
      </div>
    </div>
  );
};

export default VisorFacturas;
