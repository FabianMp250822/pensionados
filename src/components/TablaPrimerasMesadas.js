import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import './TablaPrimerasMesadas.css';

const TablaPrimerasMesadas = () => {
  const facturas = useSelector((state) => state.pensiones.pensiones) || [];
  const [primerasMesadas, setPrimerasMesadas] = useState([]);
  const [fechaCertificado, setFechaCertificado] = useState('');

  useEffect(() => {
    const obtenerPrimerasMesadas = () => {
      const facturasPorAño = {};

      // Ordenar facturas por fecha para obtener la primera del año
      const facturasOrdenadas = [...facturas].sort((a, b) => {
        const fechaA = new Date(`${a.año}-${obtenerMesDePeriodoPago(a.periodoPago).mesNumero}-01`);
        const fechaB = new Date(`${b.año}-${obtenerMesDePeriodoPago(b.periodoPago).mesNumero}-01`);
        return fechaA - fechaB;
      });

      // Filtrar la primera mesada de cada año
      facturasOrdenadas.forEach((factura) => {
        if (!facturasPorAño[factura.año]) {
          const { mesNombre, mesNumero } = obtenerMesDePeriodoPago(factura.periodoPago);
          const mesadaPensional = factura.detalles.find(
            (detalle) => detalle.nombre === 'Mesada Pensional'
          )?.ingresos || 0; // Extraer el valor directamente

          facturasPorAño[factura.año] = {
            año: factura.año,
            mes: mesNombre,
            mesNumero,
            mesadaPensional,
          };
        }
      });

      // Convertir el objeto en un array y actualizar el estado
      setPrimerasMesadas(Object.values(facturasPorAño));
    };

    const obtenerFechaActual = () => {
      const fecha = new Date();
      const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
      const fechaFormateada = fecha.toLocaleDateString('es-CO', opciones);
      setFechaCertificado(fechaFormateada);
    };

    obtenerPrimerasMesadas();
    obtenerFechaActual();
  }, [facturas]);

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
  

  return (
    <div className="tabla-primeras-mesadas">
      <h1 className="certificado-titulo">Certificado de Mesadas Pensionales</h1>
      <p className="certificado-fecha">Fecha: {fechaCertificado}</p>
      <p className="certificado-texto">
        Por medio del presente, <strong>Consorcio Juridico Especializado Dajusticia S</strong> hace constar que las 
        personas a continuación relacionadas han recibido las mesadas pensionales correspondientes al 
        mes de enero de los años indicados, conforme a los registros de nuestra base de datos y la normativa vigente.
      </p>
      <table>
        <thead>
          <tr>
            <th>Año</th>
            <th>Mes</th>
            <th>Valor Mesada Pensional</th>
          </tr>
        </thead>
        <tbody>
          {primerasMesadas.map((mesada) => (
            <tr key={mesada.año}>
              <td>{mesada.año}</td>
              <td>{mesada.mes}</td>
              <td>{formatoMoneda(mesada.mesadaPensional)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="certificado-firma">
        Este certificado se expide para los fines legales y administrativos a los que haya lugar.
      </p>
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

export default TablaPrimerasMesadas;
