import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

// Importa el archivo de estilos (GraficoPensiones.css)
import './GraficoPensiones.css';

// Ordenar los meses en orden cronológico
const MESES_ORDENADOS = [
  'ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.',
  'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'
];

// Tabla de IPC anual en Colombia (utilizada para proyección, reajuste y acumulación de reclamos)
const ipcValores = {
  1999: 9.23,
  2000: 8.75,
  2001: 7.65,
  2002: 6.99,
  2003: 6.49,
  2004: 5.50,
  2005: 4.85,
  2006: 4.48,
  2007: 5.69,
  2008: 7.67,
  2009: 2.00,
  2010: 3.17,
  2011: 3.73,
  2012: 2.44,
  2013: 1.94,
  2014: 3.66,
  2015: 6.77,
  2016: 5.75,
  2017: 4.09,
  2018: 3.18,
  2019: 3.80,
  2020: 1.61,
  2021: 5.62,
  2022: 13.12,
  2023: 9.28,
  2024: 5.2,
};

const AÑO_FIN = 2024;

const GraficoPensiones = () => {
  // Estado para seleccionar la vista de tabla (vacío = no se muestra)
  const [vistaSeleccionada, setVistaSeleccionada] = useState('');
  
  const { pensiones } = useSelector((state) => state.pensiones);
  const [datosPorAnoMes, setDatosPorAnoMes] = useState({});
  const [anoSeleccionado, setAnoSeleccionado] = useState('');
  const [anomalies, setAnomalies] = useState([]);
  const [tablaMesadasISS, setTablaMesadasISS] = useState([]);

  // Procesar datos y detectar anomalías
  useEffect(() => {
    if (pensiones.length > 0) {
      const procesarDatos = () => {
        const pagosOrganizados = {};
        pensiones.forEach((pago) => {
          const año = pago.año;
          const mes = pago.periodoPago.split(' ')[1];
          if (!pagosOrganizados[año]) {
            pagosOrganizados[año] = {};
          }
          if (!pagosOrganizados[año][mes]) {
            pagosOrganizados[año][mes] = {
              mesadaPensional: 0,
              totalNeto: 0,
            };
          }
          const mesadaPensional = pago.detalles.find(
            (detalle) => detalle.codigo === 'MESAD'
          )?.ingresos || 0;
          const valorNetoNumerico = parseFloat(
            pago.valorNeto.replace(/\./g, '').replace(',', '.')
          ) || 0;
          pagosOrganizados[año][mes].mesadaPensional += mesadaPensional;
          pagosOrganizados[año][mes].totalNeto += valorNetoNumerico;
        });
        setDatosPorAnoMes(pagosOrganizados);
        detectarAnomalias(pagosOrganizados);
      };
      procesarDatos();
    }
  }, [pensiones]);

  // Función para ordenar los meses según MESES_ORDENADOS
  const ordenarMeses = (meses) =>
    meses.sort((a, b) => MESES_ORDENADOS.indexOf(a) - MESES_ORDENADOS.indexOf(b));

  const obtenerAniosDisponibles = () => {
    const años = Object.keys(datosPorAnoMes);
    return años.sort((a, b) => b - a);
  };

  const datosFiltradosPorAno = anoSeleccionado
    ? { [anoSeleccionado]: datosPorAnoMes[anoSeleccionado] }
    : datosPorAnoMes;

  const datosDelGrafico = {
    labels: Object.keys(datosFiltradosPorAno).flatMap((año) =>
      ordenarMeses(Object.keys(datosFiltradosPorAno[año])).map((mes) => `${mes} ${año}`)
    ),
    datasets: [
      {
        label: 'Mesada Pensional',
        data: Object.keys(datosFiltradosPorAno).flatMap((año) =>
          ordenarMeses(Object.keys(datosFiltradosPorAno[año])).map(
            (mes) => datosFiltradosPorAno[año][mes].mesadaPensional
          )
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Valor Neto',
        data: Object.keys(datosFiltradosPorAno).flatMap((año) =>
          ordenarMeses(Object.keys(datosFiltradosPorAno[año])).map(
            (mes) => datosFiltradosPorAno[año][mes].totalNeto
          )
        ),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
      },
    ],
  };

  // Detectar anomalías en la mesada pensional
  const detectarAnomalias = (pagosOrganizados) => {
    const anomaliasEncontradas = [];
    const threshold = 0.7;
    Object.keys(pagosOrganizados).forEach((año) => {
      const meses = ordenarMeses(Object.keys(pagosOrganizados[año]));
      for (let i = 1; i < meses.length; i++) {
        const mesAnterior = meses[i - 1];
        const mesActual = meses[i];
        const mesadaAnterior = pagosOrganizados[año][mesAnterior].mesadaPensional;
        const mesadaActual = pagosOrganizados[año][mesActual].mesadaPensional;
        if (mesadaAnterior > 0 && mesadaActual < mesadaAnterior * threshold) {
          anomaliasEncontradas.push({
            año,
            mes: mesActual,
            mesadaAnterior,
            mesadaActual,
            mesadaISS: mesadaAnterior - mesadaActual,
            añoInicio: año,
            porcentajeDisminucion: (((mesadaAnterior - mesadaActual) / mesadaAnterior) * 100).toFixed(2),
          });
        }
      }
    });
    setAnomalies(anomaliasEncontradas);
  };

  // Función para formatear números a moneda colombiana
  const formatearMoneda = (valor) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(valor);

  // Función para calcular la proyección de Mesada ISS según el IPC
  const calcularTablaMesadasISS = () => {
    if (anomalies.length === 0) return [];
    const sortedAnom = [...anomalies].sort((a, b) => a.año - b.año);
    const ISS_INICIAL = sortedAnom[0].mesadaISS;
    const AÑO_BASE = parseInt(sortedAnom[0].año);
    const tabla = [];
    let valorActual = ISS_INICIAL;
    tabla.push({ año: AÑO_BASE, mesadaISS: valorActual });
    for (let año = AÑO_BASE + 1; año <= AÑO_FIN; año++) {
      const incremento = ipcValores[año] || 0;
      valorActual = valorActual * (1 + incremento / 100);
      tabla.push({ año, mesadaISS: valorActual });
    }
    return tabla;
  };

  useEffect(() => {
    const tablaCalculada = calcularTablaMesadasISS();
    setTablaMesadasISS(tablaCalculada);
  }, [anomalies]);

  // Calcular filas base con todos los cálculos por año.
  const calcularFilasBase = () => {
    const rows = [];
    const years = Object.keys(datosPorAnoMes).sort((a, b) => a - b);
    years.forEach((year) => {
      const dataYear = datosPorAnoMes[year];
      const mesadaEne = dataYear['ene.'] ? dataYear['ene.'].mesadaPensional : 0;
      const mesadaDic = dataYear['dic.'] ? dataYear['dic.'].mesadaPensional : 0;
      let maxDiff = 0;
      let obsMonth = '';
      MESES_ORDENADOS.forEach((m) => {
        if (m !== 'ene.' && m !== 'dic.' && dataYear[m]) {
          const diff = dataYear[m].mesadaPensional - mesadaEne;
          if (Math.abs(diff) > Math.abs(maxDiff)) {
            maxDiff = diff;
            obsMonth = m;
          }
        }
      });
      let observation = '';
      if (obsMonth) {
        observation = maxDiff > 0
          ? `Incremento en ${obsMonth}: ${formatearMoneda(maxDiff)}`
          : `Decremento en ${obsMonth}: ${formatearMoneda(Math.abs(maxDiff))}`;
      }
      // Proyección ISS para este año
      const proyeccionObj = tablaMesadasISS.find((item) => Number(item.año) === Number(year));
      const proyeccionISS = proyeccionObj ? proyeccionObj.mesadaISS : 0;
      const mesadaSinReajuste = mesadaDic + proyeccionISS;
      const ipc = ipcValores[year] || 0;
      const mesadaReajustada = mesadaSinReajuste * (1 + ipc / 100);
      const extraAnual = (mesadaReajustada - mesadaSinReajuste) * 12;
      rows.push({
        year: Number(year),
        mesadaEne,
        mesadaDic,
        proyeccionISS,
        mesadaSinReajuste,
        mesadaReajustada,
        extraAnual,
        diffMoney: mesadaDic - mesadaEne,
        diffPercent: mesadaEne ? ((mesadaDic - mesadaEne) / mesadaEne) * 100 : 0,
        observation,
      });
    });
    return rows;
  };

  // Función para acumular reclamos en un grupo de años.
  // Si reset es true, se inicia desde 0 (para los últimos 3 años).
  const acumularReclamos = (rows, reset = false) => {
    let acumulado = reset ? 0 : null;
    return rows.map((row, index) => {
      if (index === 0) {
        acumulado = row.extraAnual;
      } else {
        const ipc = ipcValores[row.year] || 0;
        acumulado = acumulado * (1 + ipc / 100) + row.extraAnual;
      }
      return { ...row, reclamoAcumulado: acumulado };
    });
  };

  const allRows = calcularFilasBase();
  const maxYearCalculated = Math.max(...allRows.map((row) => row.year));
  const rowsUltimos = allRows.filter((row) => row.year >= maxYearCalculated - 2);
  const rowsAnteriores = allRows.filter((row) => row.year < maxYearCalculated - 2);
  const rowsUltimosAcum = acumularReclamos(rowsUltimos, true);
  const rowsAnterioresAcum = acumularReclamos(rowsAnteriores, false);

  const sumarReclamos = (rows) => rows.reduce((acc, row) => acc + row.reclamoAcumulado, 0);

  const renderTabla = (rows, tituloTotal) => {
    const totalReclamo = sumarReclamos(rows);
    return (
      <table id="styled-table">
        <thead>
          <tr>
            <th>Año</th>
            <th>Mesada Enero</th>
            <th>Mesada Diciembre</th>
            <th>Proyección ISS</th>
            <th>Mesada Sin Reajuste</th>
            <th>Mesada Reajustada</th>
            <th>Extra Anual</th>
            <th>Reclamo Acumulado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td>{row.year}</td>
              <td>{formatearMoneda(row.mesadaEne)}</td>
              <td>{formatearMoneda(row.mesadaDic)}</td>
              <td>{formatearMoneda(row.proyeccionISS)}</td>
              <td>{formatearMoneda(row.mesadaSinReajuste)}</td>
              <td>{formatearMoneda(row.mesadaReajustada)}</td>
              <td>{formatearMoneda(row.extraAnual)}</td>
              <td>{formatearMoneda(row.reclamoAcumulado)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={7} style={{ textAlign: 'right', fontWeight: 'bold' }}>
              {tituloTotal}
            </td>
            <td style={{ fontWeight: 'bold' }}>{formatearMoneda(totalReclamo)}</td>
          </tr>
        </tbody>
      </table>
    );
  };

  return (
    <div>
      {/* Siempre se muestra el gráfico */}
      <Bar data={datosDelGrafico} />

      {/* Botones debajo del gráfico */}
      <div id="button-container">
        <button id="btn-liquidacion" onClick={() => setVistaSeleccionada('Liquidación por IPC')}>
          Liquidación por IPC
        </button>
        <button id="btn-funcion2" onClick={() => setVistaSeleccionada('Función 2')}>
          Función 2
        </button>
        <button id="btn-funcion3" onClick={() => setVistaSeleccionada('Función 3')}>
          Función 3
        </button>
        <button id="btn-funcion4" onClick={() => setVistaSeleccionada('Función 4')}>
          Función 4
        </button>
      </div>

      {/* La tabla se muestra solo si se presiona "Liquidación por IPC" */}
      {vistaSeleccionada === 'Liquidación por IPC' && (
        <>
          {/* Subtabla: Últimos 3 Años */}
          <div style={{ marginTop: '30px' }}>
            <h3>Últimos 3 Años (Reclamos Recientes)</h3>
            {rowsUltimosAcum.length > 0
              ? renderTabla(rowsUltimosAcum, 'Total a reclamar (Últimos 3 Años)')
              : <p>No hay datos para los últimos 3 años.</p>}
          </div>

          {/* Subtabla: Años Anteriores */}
          <div style={{ marginTop: '30px' }}>
            <h3>Años Anteriores (Prescritos)</h3>
            {rowsAnterioresAcum.length > 0
              ? renderTabla(rowsAnterioresAcum, 'Total a reclamar (Años Anteriores)')
              : <p>No hay datos para años anteriores.</p>}
          </div>
        </>
      )}

      {vistaSeleccionada !== 'Liquidación por IPC' && (
        <p>Funcionalidad en desarrollo para: {vistaSeleccionada}</p>
      )}
    </div>
  );
};

export default GraficoPensiones;
