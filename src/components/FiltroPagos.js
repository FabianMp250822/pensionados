import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './VisorFacturas.css'; // Asegúrate de tener los estilos adecuados

const VisorFacturas = () => {
  const facturas = useSelector((state) => state.pensiones.pensiones) || [];

  const [añoSeleccionado, setAñoSeleccionado] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [facturasFiltradas, setFacturasFiltradas] = useState([]);
  const componentRef = useRef();

  const handleDownloadPdf = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    for (const factura of facturasFiltradas) {
      const facturaElement = document.getElementById(`factura-${factura.id}`);
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

  const añosDisponibles = [...new Set(facturas.map((factura) => factura.año))].sort();

  const filtrarFacturas = () => {
    // Hacer una copia del array para evitar modificar el estado original
    let filtradas = [...facturas];
  
    if (añoSeleccionado) {
      filtradas = filtradas.filter((factura) => factura.año === añoSeleccionado);
    }
    if (mesSeleccionado) {
      filtradas = filtradas.filter((factura) => {
        const { mesNumero } = obtenerMesDePeriodoPago(factura.periodoPago);
        return mesNumero === mesSeleccionado;
      });
    }
  
    // Eliminar duplicados basados en periodoPago y valorNeto
    const facturasUnicas = [];
    const keys = new Set();
  
    filtradas.forEach((factura) => {
      const key = `${factura.periodoPago}-${factura.valorNeto}`;
      if (!keys.has(key)) {
        keys.add(key);
        facturasUnicas.push(factura);
      }
    });
  
    // Ordenar primero por año y luego por mes dentro de cada año
    facturasUnicas.sort((a, b) => {
      const fechaA = new Date(`${a.año}-${obtenerMesDePeriodoPago(a.periodoPago).mesNumero}-01`);
      const fechaB = new Date(`${b.año}-${obtenerMesDePeriodoPago(b.periodoPago).mesNumero}-01`);
      return fechaA - fechaB;
    });
  
    setFacturasFiltradas(facturasUnicas);
  };
  
  

  const obtenerMesDePeriodoPago = (periodoPago) => {
    // Verifica que periodoPago sea una cadena válida
    if (!periodoPago || typeof periodoPago !== 'string') {
      return { mesNumero: '', mesNombre: '' }; // Retorna valores por defecto si no es válido
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
      return { mesNumero: meses[mesAbreviado], mesNombre: nombresMeses[mesAbreviado] };
    }
    
    return { mesNumero: '', mesNombre: '' }; // Retorna valores por defecto si no hay coincidencias
  };
  

  useEffect(() => {
    filtrarFacturas();
  }, [añoSeleccionado, mesSeleccionado, facturas]);


  const agruparFacturasPorPeriodo = (facturas) => {
    const facturasAgrupadas = {};
  
    facturas.forEach((factura) => {
      if (!facturasAgrupadas[factura.periodoPago]) {
        facturasAgrupadas[factura.periodoPago] = {
          ...factura,
          detalles: [...factura.detalles],
          valorNeto: factura.valorNeto,
        };
      } else {
        // Agrupa los detalles y suma los valores
        facturasAgrupadas[factura.periodoPago].detalles.push(...factura.detalles);
        facturasAgrupadas[factura.periodoPago].valorNeto += factura.valorNeto;
      }
    });
  
    // Convierte el objeto en un array
    return Object.values(facturasAgrupadas);
  };
  
  return (
    <div className="visor-facturas">
      <h2>Mesadas pensionales recibidas</h2>
      <button className="boton-imprimir" onClick={handleDownloadPdf}>Descargar PDF</button>
      <div className="filtros">
        <div className="filtro">
          <label htmlFor="filtro-año">Filtrar por año:</label>
          <select id="filtro-año" value={añoSeleccionado} onChange={(e) => setAñoSeleccionado(e.target.value)}>
            <option value="">Todos</option>
            {añosDisponibles.map((año) => (
              <option key={año} value={año}>{año}</option>
            ))}
          </select>
        </div>
        <div className="filtro">
          <label htmlFor="filtro-mes">Filtrar por mes:</label>
          <select id="filtro-mes" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)}>
            <option value="">Todos</option>
            {MESES.map((mes) => (
              <option key={mes.valor} value={mes.valor}>{mes.nombre}</option>
            ))}
          </select>
        </div>
      </div>
      <div ref={componentRef}>
        <div className="lista-facturas">
          {facturasFiltradas.map((factura) => {
            const { mesNombre } = obtenerMesDePeriodoPago(factura.periodoPago);
            return (
              <div key={factura.id} id={`factura-${factura.id}`} className="factura" style={{ marginBottom: '20px' }}>
                <h3>Factura de {mesNombre} {factura.año}</h3>
                <p>Periodo de Pago: {factura.periodoPago} - Valor Neto: {factura.valorNeto}</p>
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
          {facturasFiltradas.length === 0 && <p>No hay facturas para los criterios seleccionados.</p>}
        </div>
      </div>
    </div>
  );
};

// Función para formatear números como moneda
const formatoMoneda = (valor) => {
  if (valor == null || valor === '') return '$ 0';
  const numero = parseFloat(valor.toString().replace(/[^0-9.-]+/g, '').replace(',', '.'));
  if (isNaN(numero)) return '$ 0';
  return numero.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
};

export default VisorFacturas;
