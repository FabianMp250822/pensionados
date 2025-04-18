import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import './GraficoPensiones.css';
import Ley100 from './Ley100View';
import Escolastica from './escolastivaView';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

// Orden de los meses en secuencia cronológica.
const MESES_ORDENADOS = [
  'ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.',
  'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'
];

// Valores del IPC anual (para cálculos de proyección).
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

// Año final de la proyección.
const AÑO_FIN = 2024;

// Valores de SMLV (salario mínimo) por año.
const smlvValores = {
  1999: 236460,
  2000: 260100,
  2001: 286050,
  2002: 309000,
  2003: 332400,
  2004: 358000,
  2005: 381500,
  2006: 408000,
  2007: 433700,
  2008: 461500,
  2009: 496900,
  2010: 515000,
  2011: 535600,
  2012: 566700,
  2013: 589500,
  2014: 616000,
  2015: 644350,
  2016: 689454,
  2017: 737717,
  2018: 781242,
  2019: 828116,
  2020: 877803,
  2021: 908526,
  2022: 1000000,
  2023: 1160000,
  2024: 1300000,
  2025: 1423500
};

/**
 * Formatea un número a moneda colombiana (COP).
 */
function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(valor);
}

/**
 * Retorna la última mesada (valor > 0) en un año, recorriendo de diciembre a enero.
 */
function obtenerUltimaMesada(dataYear = {}) {
  const mesesOrdenadosReverso = [...MESES_ORDENADOS].reverse();
  for (const mes of mesesOrdenadosReverso) {
    if (dataYear[mes] && dataYear[mes].mesadaPensional > 0) {
      return dataYear[mes].mesadaPensional;
    }
  }
  return 0;
}

/**
 * Retorna la primera mesada (valor > 0) en un año, recorriendo de enero a diciembre.
 */
function obtenerPrimeraMesada(dataYear = {}) {
  for (const mes of MESES_ORDENADOS) {
    if (dataYear[mes] && dataYear[mes].mesadaPensional > 0) {
      return dataYear[mes].mesadaPensional;
    }
  }
  return 0;
}

/**
 * Ordena un arreglo de meses siguiendo el orden de MESES_ORDENADOS.
 */
function ordenarMeses(meses) {
  return meses.sort((a, b) => MESES_ORDENADOS.indexOf(a) - MESES_ORDENADOS.indexOf(b));
}

/**
 * Calcula la indexación acumulada de un valor desde (yearStart, mesStart) hasta (yearEnd, mesEnd),
 * aplicando la tasa anual convertida a tasa mensual.
 */
function calcularIndexacionCompleta(valorInicial, yearStart, mesStart, yearEnd, mesEnd) {
  let valor = valorInicial;
  for (let y = yearStart; y <= yearEnd; y++) {
    const mesInicio = y === yearStart ? mesStart : 'ene.';
    const mesFin = y === yearEnd ? mesEnd : 'dic.';
    const annualRate = (ipcValores[y] || 0) / 100;
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    const idxInicio = MESES_ORDENADOS.indexOf(mesInicio);
    const idxFin = MESES_ORDENADOS.indexOf(mesFin);
    for (let i = idxInicio; i <= idxFin; i++) {
      valor *= (1 + monthlyRate);
    }
  }
  return valor;
}

function Certificados() {
  const [vistaSeleccionada, setVistaSeleccionada] = useState('');
  const { pensiones } = useSelector((state) => state.pensiones);
  const [datosPorAnoMes, setDatosPorAnoMes] = useState({});
  const [anomalies, setAnomalies] = useState([]);
  const [primerDecrementoSignificativo, setPrimerDecrementoSignificativo] = useState(null);
  const [ipcDaneData, setIpcDaneData] = useState(null);
  const [mostrarDetallesMensuales, setMostrarDetallesMensuales] = useState(false);

  // Carga y organización de la información "pensiones".
  useEffect(() => {
    if (pensiones.length > 0) {
      const procesarDatos = () => {
        const pagosOrganizados = {};
        pensiones.forEach((pago) => {
          const año = pago.año;
          const mes = pago.periodoPago.split(' ')[1]; // Se asume "Periodo: ene." => extrae "ene."
          if (!pagosOrganizados[año]) {
            pagosOrganizados[año] = {};
          }
          if (!pagosOrganizados[año][mes]) {
            pagosOrganizados[año][mes] = { mesadaPensional: 0, totalNeto: 0 };
          }
          let mesadaPensional = pago.detalles.find(
            detalle => detalle.codigo === 'MESAD' || detalle.nombre === 'Mesada Pensional'
          )?.ingresos;
          // Caso especial para diciembre.
          if (mes === 'dic.' && !mesadaPensional) {
            mesadaPensional = pago.detalles.find(detalle => detalle.codigo === 'MESAD14')?.ingresos;
            if (!mesadaPensional) {
              mesadaPensional = pago.detalles.find(detalle => detalle.nombre === '285-Mesada Adicional')?.ingresos;
            }
          }
          mesadaPensional = mesadaPensional || 0;
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

  // Conexión opcional a la colección ipcDane.
  useEffect(() => {
    const fetchData = async () => {
      try {
        const ipcDaneCollection = collection(db, 'ipcDane');
        const ipcDaneSnapshot = await getDocs(ipcDaneCollection);
        const ipcDaneList = ipcDaneSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setIpcDaneData(ipcDaneList);
        console.log('Conexión exitosa a la colección ipcDane', ipcDaneList);
      } catch (error) {
        console.error('Error al conectar con la colección ipcDane:', error);
      }
    };
    fetchData();
  }, []);

  /**
   * Detecta anomalías cuando la mesada actual es menor al 70% de la mesada anterior.
   */
  const detectarAnomalias = (pagosOrganizados) => {
    const threshold = 0.7;
    const anomaliasEncontradas = [];
    Object.keys(pagosOrganizados).forEach(año => {
      const mesesOrdenados = ordenarMeses(Object.keys(pagosOrganizados[año]));
      for (let i = 1; i < mesesOrdenados.length; i++) {
        const mesAnterior = mesesOrdenados[i - 1];
        const mesActual = mesesOrdenados[i];
        const mesadaAnterior = pagosOrganizados[año][mesAnterior].mesadaPensional;
        const mesadaActual = pagosOrganizados[año][mesActual].mesadaPensional;
        if (mesadaAnterior > 0 && mesadaActual < mesadaAnterior * threshold) {
          anomaliasEncontradas.push({
            año,
            mes: mesActual,
            mesadaAnterior,
            mesadaActual,
            descuento: mesadaAnterior - mesadaActual,
            porcentajeDisminucion: (((mesadaAnterior - mesadaActual) / mesadaAnterior) * 100).toFixed(2),
          });
        }
      }
    });
    setAnomalies(anomaliasEncontradas);
  };

  /**
   * Determina el primer decremento significativo (cuando la mesada actual es ≤50% de la primera mesada).
   */
  useEffect(() => {
    if (Object.keys(datosPorAnoMes).length > 0) {
      const buscarPrimerDecremento = () => {
        const años = Object.keys(datosPorAnoMes).map(Number).sort((a, b) => a - b);
        if (años.length === 0) return null;
        const primerAño = años[0];
        const mesesOrden = ordenarMeses(Object.keys(datosPorAnoMes[primerAño]));
        if (mesesOrden.length === 0) return null;
        const primeraMesada = datosPorAnoMes[primerAño][mesesOrden[0]].mesadaPensional;
        let encontrado = null;
        outerLoop: for (let i = 0; i < años.length; i++) {
          const año = años[i];
          const mesesYear = ordenarMeses(Object.keys(datosPorAnoMes[año]));
          for (let j = 1; j < mesesYear.length; j++) {
            const mesAnterior = mesesYear[j - 1];
            const mes = mesesYear[j];
            const mesadaAnterior = datosPorAnoMes[año][mesAnterior].mesadaPensional;
            const mesadaActual = datosPorAnoMes[año][mes].mesadaPensional;
            if (mesadaActual <= primeraMesada * 0.5) {
              encontrado = {
                año,
                mes,
                mesadaAnterior,
                mesadaActual,
                descuento: mesadaAnterior - mesadaActual,
              };
              break outerLoop;
            }
          }
        }
        return encontrado;
      };
      setPrimerDecrementoSignificativo(buscarPrimerDecremento());
    }
  }, [datosPorAnoMes]);

  /**
   * ===========================================================================
   * CÁLCULO DE LAS FILAS CON DETALLE MENSUAL:
   *
   * Para cada año se calculan las columnas generales (primera mesada, última mesada, etc.)
   * y, además, para cada mes se realiza lo siguiente:
   *
   * 1. Se toma la mesada base (base).
   * 2. Se calcula el valor reajustado (valorConIpc):
   *      - Si base ≤ 5 SMLV, se aplica un incremento fijo del 15%.
   *      - Si no, se aplica (1 + (ipcValores[year - 1] / 100)).
   * 3. La diferencia (valorConIpc – base) es la que se indexará.
   * 4. Se indexa esa diferencia desde (year, mes) hasta (AÑO_FIN, 'dic.')
   *    utilizando la función calcularIndexacionCompleta().
   *
   * En mesDetails se guardan para cada mes los siguientes campos:
   *    - mayorValor: el valor reajustado (valorConIpc).
   *    - ipcMayorValor: la diferencia (valorConIpc – base).
   *    - valorIndexado: la diferencia indexada.
   */
  function calcularFilasBase() {
    const rows = [];
    const years = Object.keys(datosPorAnoMes).sort((a, b) => a - b);
    let issPrev = null;

    years.forEach((yearStr) => {
      const year = Number(yearStr);
      const dataYear = datosPorAnoMes[yearStr];
      const primeraMesada = obtenerPrimeraMesada(dataYear);
      const ultimaMesada = obtenerUltimaMesada(dataYear);
      const smlvDelAño = smlvValores[year] || 0;
      const cincoSmlv = smlvDelAño * 5;
      let maxDiff = 0;
      let obsMonth = '';
      MESES_ORDENADOS.forEach(m => {
        if (dataYear[m]) {
          const diff = dataYear[m].mesadaPensional - primeraMesada;
          if (Math.abs(diff) > Math.abs(maxDiff)) {
            maxDiff = diff;
            obsMonth = m;
          }
        }
      });
      const observation = obsMonth 
        ? (maxDiff > 0 
            ? `Incremento en ${obsMonth}: ${formatearMoneda(maxDiff)}`
            : `Decremento en ${obsMonth}: ${formatearMoneda(Math.abs(maxDiff))}`)
        : '';
      
      let proyeccionISS = 0;
      if (primerDecrementoSignificativo && year >= primerDecrementoSignificativo.año) {
        if (year === primerDecrementoSignificativo.año) {
          proyeccionISS = primerDecrementoSignificativo.descuento || 0;
          issPrev = proyeccionISS;
        } else {
          const ipcAnterior = ipcValores[year - 1] || 0;
          proyeccionISS = issPrev ? issPrev * (1 + ipcAnterior / 100) : 0;
          issPrev = proyeccionISS;
        }
      }
      
      // Cálculos generales anuales.
      const mayorValorAnual = ultimaMesada;
      const ipcAnteriorValue = ipcValores[year - 1] || 0;
      const ipcMayorValorAnual = mayorValorAnual * (ipcAnteriorValue / 100);
      const valorIndexadoAnual = mayorValorAnual + ipcMayorValorAnual;
      
      // Para cada mes se calculan los detalles según la metodología:
      const mesDetails = {};
      MESES_ORDENADOS.forEach(m => {
        const base = dataYear[m]?.mesadaPensional || 0;
        const smlvDelAño = smlvValores[year] || 0;
        let ipcMayorValor = 0;
        if (base <= (5 * smlvDelAño)) {
          ipcMayorValor = base * 0.15;
        } else {
          const ipcValue = ipcValores[year - 1] || 0;
          ipcMayorValor = base * (ipcValue / 100);
        }
        const valorIndexado = calcularIndexacionCompleta(ipcMayorValor, year, m, AÑO_FIN, 'dic.');
        
        // Nueva propiedad: mesadaReajustada con incremento del 15% si la base <= 5 SMLV.
        const mesadaReajustada = base <= (5 * smlvDelAño) ? base * 1.15 : base;
        
        mesDetails[m] = {
          mayorValor: base,         // Valor sin reajuste.
          mesadaReajustada,         // Valor reajustado.
          ipcMayorValor,            // Diferencia para cálculo de IPC.
          valorIndexado             // Valor indexado.
        };
      });
      
      rows.push({
        year,
        primeraMesada,
        ultimaMesada,
        proyeccionISS,
        mesadaSinReajuste: ultimaMesada,
        incrementoIPC: ipcMayorValorAnual,
        valorIndexado: valorIndexadoAnual,
        observation,
        mesDetails
      });
    });
    return rows;
  }

  const allRows = calcularFilasBase();
  const maxYearCalculated = allRows.length > 0 ? Math.max(...allRows.map(r => r.year)) : 0;
  const rowsUltimosAcum = allRows.filter(row => row.year >= maxYearCalculated - 2);
  const rowsAnterioresAcum = allRows.filter(row => row.year < maxYearCalculated - 2);

  // Datos para el gráfico.
  const datosDelGrafico = {
    labels: Object.keys(datosPorAnoMes).flatMap(año =>
      ordenarMeses(Object.keys(datosPorAnoMes[año])).map(mes => `${mes} ${año}`)
    ),
    datasets: [
      {
        label: 'Mesada Pensional',
        data: Object.keys(datosPorAnoMes).flatMap(año =>
          ordenarMeses(Object.keys(datosPorAnoMes[año])).map(
            mes => datosPorAnoMes[año][mes].mesadaPensional
          )
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Valor Neto',
        data: Object.keys(datosPorAnoMes).flatMap(año =>
          ordenarMeses(Object.keys(datosPorAnoMes[año])).map(
            mes => datosPorAnoMes[año][mes].totalNeto
          )
        ),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
      },
    ],
  };

  /**
   * Renderiza la tabla principal con opción de mostrar/ocultar detalles mensuales
   */
  function renderTabla(rows, tituloTotal) {
    // Total anual (de la columna general "Valor Indexado")
    const totalValorIndexado = rows.reduce((acc, row) => acc + (row.valorIndexado || 0), 0);
    const totalReclamo = 0;

    // Totales mensuales para "Valor Indexado" de cada mes.
    const monthlyTotals = {};
    MESES_ORDENADOS.forEach(m => {
      monthlyTotals[m] = rows.reduce((sum, row) => sum + (row.mesDetails[m]?.valorIndexado || 0), 0);
    });
    
    // Monto total pendiente a reclamar.
    const totalPendiente = Object.values(monthlyTotals).reduce((acc, val) => acc + val, 0);

    // Se ajusta el total de columnas (si se muestran detalles mensuales, ahora se agregan 5 columnas por mes):
    const totalColumns = mostrarDetallesMensuales 
      ? 10 + (MESES_ORDENADOS.length * 5) + 3 
      : 10 + 3;

    return (
      <div>
        <div style={{ marginBottom: '10px', textAlign: 'right' }}>
          <button 
            onClick={() => setMostrarDetallesMensuales(!mostrarDetallesMensuales)}
            style={{
              padding: '8px 15px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {mostrarDetallesMensuales ? 'Ocultar detalles mensuales' : 'Ver detalles mensuales'}
          </button>
        </div>
        
        <table id="styled-table">
          <thead>
            <tr>
              <th>Año</th>
              <th>tope 5 SMLMV</th>
              <th>Primera mesada</th>
              <th># SMLMV</th>
              <th>Última mesada</th>
              <th>Observación</th>
              <th>Proyección ISS</th>
              <th>Mayor Valor</th>
              {/* 
              <th>IPC mayor valor</th>
              <th>Valor Indexado (Anual)</th>
              */}
              
              {mostrarDetallesMensuales && MESES_ORDENADOS.map(mes => (
                <React.Fragment key={mes}>
                  <th>{mes} Mayor Valor</th>
                  <th>{mes} Mesada Reajustada</th>
                  <th>{mes} Diferencias</th>
                  <th>{mes} IPC mayor valor</th>
                  <th>{mes} Valor Indexado</th>
                </React.Fragment>
              ))}
              
              {/* Estas columnas siempre se muestran */}
              <th>Total Mayor Valor</th>
              <th>Total IPC mayor valor</th>
              <th>Total Valor Indexado (Mensual)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const tope5Smlmv = (smlvValores[row.year] || 0) * 5;
              const numeroSmlmv = (row.primeraMesada / (smlvValores[row.year] || 1)).toFixed(2);

              // Totales mensuales por fila.
              const totalMayorValor = MESES_ORDENADOS.reduce(
                (acc, mes) => acc + (row.mesDetails[mes]?.mayorValor || 0), 0
              );
              const totalIpcMayorValor = MESES_ORDENADOS.reduce(
                (acc, mes) => acc + (row.mesDetails[mes]?.ipcMayorValor || 0), 0
              );
              const totalValorIndexadoMes = MESES_ORDENADOS.reduce(
                (acc, mes) => acc + (row.mesDetails[mes]?.valorIndexado || 0), 0
              );

              return (
                <tr key={index}>
                  <td>{row.year}</td>
                  <td>{formatearMoneda(tope5Smlmv)}</td>
                  <td>{formatearMoneda(row.primeraMesada)}</td>
                  <td>{numeroSmlmv}</td>
                  <td>{formatearMoneda(row.ultimaMesada)}</td>
                  <td>{row.observation}</td>
                  <td>{formatearMoneda(row.proyeccionISS)}</td>
                  <td>{formatearMoneda(row.mesadaSinReajuste)}</td>
                  {/*
                  <td>{formatearMoneda(row.incrementoIPC)}</td>
                  <td>{formatearMoneda(row.valorIndexado)}</td>
                  */}
                  
                  {mostrarDetallesMensuales && MESES_ORDENADOS.map(m => {
                    const mesData = row.mesDetails[m] || { 
                      mayorValor: 0, 
                      mesadaReajustada: 0, 
                      ipcMayorValor: 0, 
                      valorIndexado: 0 
                    };
                    // Cálculo de la diferencia: Mesada Reajustada - Mayor Valor.
                    const diferencia = mesData.mesadaReajustada - mesData.mayorValor;

                    return (
                      <React.Fragment key={m}>
                        <td>{formatearMoneda(mesData.mayorValor)}</td>
                        <td>{formatearMoneda(mesData.mesadaReajustada)}</td>
                        <td>{formatearMoneda(diferencia)}</td>
                        <td>{formatearMoneda(mesData.ipcMayorValor)}</td>
                        <td>{formatearMoneda(mesData.valorIndexado)}</td>
                      </React.Fragment>
                    );
                  })}
                  <td>{formatearMoneda(totalIpcMayorValor)}</td>
                  <td>{formatearMoneda(totalValorIndexadoMes)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={10} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                Total Valor Indexado (Anual):
              </td>
              <td colSpan={mostrarDetallesMensuales ? (MESES_ORDENADOS.length * 5) + 3 : 3} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                {formatearMoneda(totalValorIndexado)}
              </td>
            </tr>
            
            {mostrarDetallesMensuales && (
              <tr>
                <td colSpan={10} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  Totales Mensuales (Valor Indexado):
                </td>
                {MESES_ORDENADOS.map(m => (
                  <React.Fragment key={m}>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {formatearMoneda(monthlyTotals[m] || 0)}
                    </td>
                  </React.Fragment>
                ))}
                <td></td>
                <td></td>
                <td></td>
              </tr>
            )}
            
            <tr>
              <td colSpan={totalColumns} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                Monto Total Pendiente a Reclamar: {formatearMoneda(totalPendiente)}
              </td>
            </tr>
            <tr>
              <td colSpan={totalColumns} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                {tituloTotal}: {formatearMoneda(totalReclamo)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  /**
   * Renderiza información adicional (primera mesada global, primer decremento, etc.).
   */
  function renderInfo() {
    let primeraMesadaGlobal = 0;
    const años = Object.keys(datosPorAnoMes);
    if (años.length > 0) {
      const primerAño = Math.min(...años.map(Number));
      primeraMesadaGlobal = obtenerPrimeraMesada(datosPorAnoMes[primerAño]);
    }
    let smlvDelAño = 0;
    let cincoSmlv = 0;
    let cumple = false;
    let equivalencia = 0;
    if (primerDecrementoSignificativo) {
      const añoDecremento = primerDecrementoSignificativo.año;
      smlvDelAño = smlvValores[añoDecremento] || 0;
      cincoSmlv = smlvDelAño * 5;
      cumple = primerDecrementoSignificativo.mesadaActual <= cincoSmlv;
      equivalencia = smlvDelAño ? (primerDecrementoSignificativo.mesadaActual / smlvDelAño).toFixed(2) : 0;
    }
    return (
      <>
        <h3 style={{ marginTop: '20px', marginBottom: '20px', textAlign: 'center' }}>
          Variables para cálculos pensionales
        </h3>
        <table id="info-table" style={{ marginBottom: '30px', borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ddd' }}>
                Primera mesada
              </td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                {formatearMoneda(primeraMesadaGlobal)}
              </td>
            </tr>
            {primerDecrementoSignificativo ? (
              <>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ddd' }}>
                    Primer decremento significativo
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {primerDecrementoSignificativo.mes} {primerDecrementoSignificativo.año}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ddd' }}>
                    Mesada del mes anterior
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {formatearMoneda(primerDecrementoSignificativo.mesadaAnterior)}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ddd' }}>
                    Mayor valor
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {formatearMoneda(primerDecrementoSignificativo.mesadaActual)}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ddd' }}>
                    Mesada ISS
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {formatearMoneda(primerDecrementoSignificativo.descuento)}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ddd' }}>
                    Año del decremento
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {primerDecrementoSignificativo.mes} {primerDecrementoSignificativo.año}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ddd' }}>
                    SMLV del año {primerDecrementoSignificativo.año}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {formatearMoneda(smlvDelAño)}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ddd' }}>
                    Verificación ≤ 5 SMLV
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {cumple ? 'Cumple' : 'No cumple'} - Equivale a {equivalencia} SMLV
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td style={{ padding: '8px', border: '1px solid #ddd' }} colSpan={2}>
                  No se ha detectado un decremento significativo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </>
    );
  }

  return (
    <div>
      <Bar data={datosDelGrafico} />
      {renderInfo()}
      <div id="button-container">
        <button id="btn-liquidacion" onClick={() => setVistaSeleccionada('Ley 100')}>
          Ley 100
        </button>
        <button id="btn-funcion2" onClick={() => setVistaSeleccionada('Escolastica')}>
          Escolastica
        </button>
        <button id="btn-funcion3" onClick={() => setVistaSeleccionada('Presedentes 4555')}>
          Presedentes 4555
        </button>
        <button id="btn-funcion4" onClick={() => setVistaSeleccionada('Unidad prestacional')}>
          Unidad prestacional
        </button>
      </div>
      {vistaSeleccionada === 'Ley 100' && (
        <Ley100
          rowsUltimosAcum={rowsUltimosAcum}
          rowsAnterioresAcum={rowsAnterioresAcum}
          renderTabla={renderTabla}
        />
      )}
      {vistaSeleccionada === 'Escolastica' && (
        <Escolastica
          rowsUltimosAcum={rowsUltimosAcum}
          rowsAnterioresAcum={rowsAnterioresAcum}
          renderTabla={renderTabla}
        />
      )}
      {vistaSeleccionada !== 'Ley 100' && vistaSeleccionada !== 'Escolastica' && vistaSeleccionada && (
        <p style={{ marginTop: '30px' }}>Funcionalidad en desarrollo para: {vistaSeleccionada}</p>
      )}
      {!vistaSeleccionada && (
        <div style={{ marginTop: '30px' }}>
          {renderTabla(allRows, 'Total a reclamar (Todos los años)')}
        </div>
      )}
    </div>
  );
}

export default Certificados;
