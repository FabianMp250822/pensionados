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
 * Calcula el reajuste anual según la fórmula principal de la Ley 4 de 1976, Art. 1, Inciso 2.
 * @param {number} pensionAnterior - La mesada pensional del año anterior.
 * @param {number} smlmvAnterior - Salario Mínimo Mensual Legal Vigente del año anterior.
 * @param {number} smlmvNuevo - Salario Mínimo Mensual Legal Vigente del año actual del reajuste.
 * @returns {number} - La pensión reajustada según la fórmula. Devuelve pensionAnterior si los SMLMV no son válidos.
 */
function calcularPensionReajustadaLey4_FormulaPrincipal(pensionAnterior, smlmvAnterior, smlmvNuevo) {
  if (!smlmvAnterior || !smlmvNuevo || smlmvAnterior <= 0 || smlmvNuevo <= smlmvAnterior) {
    // No hay incremento o datos inválidos, no se aplica fórmula principal basada en incremento.
    // En un escenario real, se aplicaría la fórmula alternativa (incisos 3 y 4),
    // pero por simplicidad y dado que el SMLMV usualmente sube, retornamos la pensión anterior.
    // OJO: La ley original tenía un cálculo alternativo si no subía el SMLMV.
    return pensionAnterior;
  }

  const diferenciaAbsolutaSMLMV = smlmvNuevo - smlmvAnterior;

  // Componente Absoluto (X)
  const X = 0.5 * diferenciaAbsolutaSMLMV;

  // Factor Porcentual (R)
  const R = 0.5 * (diferenciaAbsolutaSMLMV / smlmvAnterior);

  // Pensión Reajustada (PR)
  const PR = pensionAnterior + X + (R * pensionAnterior);

  return PR;
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
    // Asegurarse de que ipcValores[y] existe, si no, usar una tasa de 0 o manejar el error.
    const annualRate = (ipcValores[y] || 0) / 100;
    // Evitar NaN si annualRate es -1 (IPC -100%)
    const monthlyRate = annualRate === -1 ? -1 : Math.pow(1 + annualRate, 1 / 12) - 1;
    const idxInicio = MESES_ORDENADOS.indexOf(mesInicio);
    const idxFin = MESES_ORDENADOS.indexOf(mesFin);

    // Validar índices
    if (idxInicio === -1 || idxFin === -1) {
        console.error(`Mes inválido encontrado: inicio=${mesInicio}, fin=${mesFin} en año ${y}`);
        continue; // O manejar el error de otra forma
    }

    for (let i = idxInicio; i <= idxFin; i++) {
      // Si la tasa mensual es -1, el valor se vuelve 0.
      valor = monthlyRate === -1 ? 0 : valor * (1 + monthlyRate);
    }
  }
  // Asegurarse de no retornar NaN si algo salió mal
  return isNaN(valor) ? 0 : valor;
}

function Certificados() {
  const [vistaSeleccionada, setVistaSeleccionada] = useState('');
  const { pensiones } = useSelector((state) => state.pensiones);
  const [datosPorAnoMes, setDatosPorAnoMes] = useState({});
  const [anomalies, setAnomalies] = useState([]);
  const [primerDecrementoSignificativo, setPrimerDecrementoSignificativo] = useState(null);
  const [ipcDaneData, setIpcDaneData] = useState(null);
  const [mostrarDetallesMensuales, setMostrarDetallesMensuales] = useState(false);
  const [calculosAnualesLey4, setCalculosAnualesLey4] = useState({}); // Estado para guardar cálculos anuales

  // Carga y organización de la información "pensiones".
  useEffect(() => {
    if (pensiones.length > 0) {
      const procesarDatos = () => {
        const pagosOrganizados = {};
        pensiones.forEach((pago) => {
          const año = pago.año;
          let mes = pago.periodoPago.split(' ')[1]?.toLowerCase();
          if (mes && !mes.endsWith('.')) {
            mes += '.';
          }
          if (!MESES_ORDENADOS.includes(mes)) {
            console.warn(`Mes inválido o formato inesperado en periodoPago: ${pago.periodoPago}, año: ${año}`);
             return;
          }

          if (!pagosOrganizados[año]) {
            pagosOrganizados[año] = {};
          }
          if (!pagosOrganizados[año][mes]) {
            // Inicializar con descuentoSalud
            pagosOrganizados[año][mes] = { mesadaPensional: 0, totalNeto: 0, descuentoSalud: 0, count: 0 };
          }

          let mesadaPensional = pago.detalles.find(
            detalle => detalle.codigo === 'MESAD' || detalle.nombre === 'Mesada Pensional'
          )?.ingresos || 0; // Asegurar que sea número

          let mesadaAdicional = 0;
          if (mes === 'dic.') {
             mesadaAdicional = pago.detalles.find(detalle => detalle.codigo === 'MESAD14' || detalle.nombre === '285-Mesada Adicional')?.ingresos || 0;
             if (mesadaPensional === 0 && mesadaAdicional > 0) { // Corrección: usar === 0
                 mesadaPensional = mesadaAdicional;
                 mesadaAdicional = 0;
             }
          }

          // Buscar y sumar el descuento de salud (código 1001)
          const descSalud = pago.detalles.find(
              detalle => detalle.codigo === '1001' // Asumiendo que el código es '1001'
                         // || detalle.nombre.toLowerCase().includes('descuento salud') // Alternativa por nombre
          )?.deducciones || 0; // Asumiendo que está en deducciones

          const valorNetoNumerico = parseFloat(
            pago.valorNeto.replace(/\./g, '').replace(',', '.')
          ) || 0;

          // Acumular valores
          pagosOrganizados[año][mes].mesadaPensional += mesadaPensional + mesadaAdicional;
          pagosOrganizados[año][mes].totalNeto += valorNetoNumerico;
          pagosOrganizados[año][mes].descuentoSalud += descSalud; // Acumular descuento salud
          pagosOrganizados[año][mes].count += 1;
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

        // Encontrar la primera mesada registrada en todo el historial
        let primeraMesadaGlobal = 0;
        let primerAñoConDatos = años[0];
        let primerMesConDatos = '';
        for (const año of años) {
            const mesesYear = ordenarMeses(Object.keys(datosPorAnoMes[año]));
            for (const mes of mesesYear) {
                if (datosPorAnoMes[año][mes]?.mesadaPensional > 0) {
                    primeraMesadaGlobal = datosPorAnoMes[año][mes].mesadaPensional;
                    primerAñoConDatos = año;
                    primerMesConDatos = mes;
                    break; // Salir de los bucles internos una vez encontrada
                }
            }
            if (primeraMesadaGlobal > 0) break; // Salir del bucle externo
        }

        if (primeraMesadaGlobal === 0) return null; // No hay datos válidos

        let encontrado = null;
        outerLoop: for (let i = 0; i < años.length; i++) {
          const año = años[i];
          const mesesYear = ordenarMeses(Object.keys(datosPorAnoMes[año]));
          // Empezar la comparación desde el mes siguiente al primer mes con datos si es el primer año
          const startIndex = (año === primerAñoConDatos) ? mesesYear.indexOf(primerMesConDatos) + 1 : 0;

          for (let j = startIndex; j < mesesYear.length; j++) {
            const mes = mesesYear[j];
            const mesadaActual = datosPorAnoMes[año][mes]?.mesadaPensional || 0;
            const mesAnterior = mesesYear[j - 1]; // Puede ser undefined si j=0
            const mesadaAnterior = (j > 0 && datosPorAnoMes[año][mesAnterior])
                                     ? datosPorAnoMes[año][mesAnterior].mesadaPensional
                                     : (i > 0 ? obtenerUltimaMesada(datosPorAnoMes[años[i-1]]) : primeraMesadaGlobal); // Usar la del mes/año anterior si es el inicio del año

            // La condición es que la mesada actual sea <= 50% de la PRIMERA mesada GLOBAL
            if (mesadaActual > 0 && mesadaActual <= primeraMesadaGlobal * 0.5) {
              encontrado = {
                año,
                mes,
                mesadaAnterior: mesadaAnterior, // La mesada justo antes del decremento
                mesadaActual,
                // El 'descuento' aquí es la diferencia con la mesada anterior inmediata
                descuento: mesadaAnterior - mesadaActual,
                primeraMesadaReferencia: primeraMesadaGlobal // Guardar la referencia usada
              };
              break outerLoop; // Detenerse en el primer decremento encontrado
            }
          }
        }
        return encontrado;
      };
      setPrimerDecrementoSignificativo(buscarPrimerDecremento());
    }
  }, [datosPorAnoMes]);

  // Nuevo useEffect para calcular los valores anuales esperados según Ley 4/76
  useEffect(() => {
    if (Object.keys(datosPorAnoMes).length > 0) {
      const calculos = {};
      const years = Object.keys(datosPorAnoMes).map(Number).sort((a, b) => a - b);
      let pensionBaseParaReajuste = 0;

      years.forEach((year, index) => {
        const dataYear = datosPorAnoMes[year];
        const smlmvActual = smlvValores[year];
        const smlmvAnterior = smlvValores[year - 1];

        // Determinar la base para el reajuste anual
        if (index === 0) {
          // Para el primer año, usar la primera mesada registrada como base inicial
          pensionBaseParaReajuste = obtenerPrimeraMesada(dataYear);
        } else {
          // Para años siguientes, la base es la pensión *esperada* del año anterior
          // según nuestro cálculo de Ley 4/76.
          const yearAnterior = years[index - 1];
          pensionBaseParaReajuste = calculos[yearAnterior]?.pensionEsperadaAnual || obtenerUltimaMesada(datosPorAnoMes[yearAnterior]); // Fallback por si acaso
        }

        // Aplicar reajuste Ley 4/1976 para este año
        let pensionEsperadaAnual = pensionBaseParaReajuste; // Por defecto, si no hay reajuste aplicable

        if (smlmvAnterior && smlmvActual && smlmvActual > smlmvAnterior) {
           // Calcular reajuste según fórmula principal
           const pensionReajustadaFormula = calcularPensionReajustadaLey4_FormulaPrincipal(pensionBaseParaReajuste, smlmvAnterior, smlmvActual);

           // Calcular reajuste mínimo del 15%
           const reajusteMinimo15 = pensionBaseParaReajuste * 0.15;
           const pensionConReajusteMinimo = pensionBaseParaReajuste + reajusteMinimo15;

           // Verificar si aplica la garantía del 15% (pensión base <= 5 SMLMV del año ANTERIOR)
           const limite5SMLMV = 5 * smlmvAnterior;
           if (pensionBaseParaReajuste <= limite5SMLMV) {
             // Aplicar el mayor entre la fórmula y el 15%
             pensionEsperadaAnual = Math.max(pensionReajustadaFormula, pensionConReajusteMinimo);
           } else {
             // Aplicar solo la fórmula principal
             pensionEsperadaAnual = pensionReajustadaFormula;
           }
        } else {
             // Si SMLMV no subió o datos inválidos, mantenemos la pensión base
             // (Aquí iría la lógica del cálculo alternativo si fuera necesaria)
             pensionEsperadaAnual = pensionBaseParaReajuste;
        }


        // Guardar el cálculo anual
        calculos[year] = {
          pensionBaseParaReajuste,
          pensionEsperadaAnual,
          smlmvDelAño: smlmvActual,
          smlmvAñoAnterior: smlmvAnterior
        };
      });
      setCalculosAnualesLey4(calculos);
    }
  }, [datosPorAnoMes]); // Depende de datosPorAnoMes

  /**
   * ===========================================================================
   * CÁLCULO DE LAS FILAS CON DETALLE MENSUAL (MODIFICADO):
   *
   * 1. Obtiene la pensión anual esperada según Ley 4/76 (calculada previamente).
   * 2. Para cada mes del año:
   *    a. Obtiene la pensión efectivamente pagada ese mes.
   *    b. Calcula la diferencia: Pensión Esperada Anual - Pensión Pagada Mes.
   *    c. Indexa esa diferencia mensual desde (año, mes) hasta (AÑO_FIN, 'dic.').
   *
   * Guarda en mesDetails: pensionEsperadaAnual, diferenciaMes, diferenciaIndexadaMes.
   */
  function calcularFilasBase() {
    const rows = [];
    const years = Object.keys(datosPorAnoMes).map(Number).sort((a, b) => a - b);

    years.forEach((year) => {
      const dataYear = datosPorAnoMes[year];
      const calculoAnual = calculosAnualesLey4[year] || {}; // Obtener cálculos precalculados
      const pensionEsperadaAnual = calculoAnual.pensionEsperadaAnual || 0;

      const primeraMesadaPagada = obtenerPrimeraMesada(dataYear); // Real pagada
      const ultimaMesadaPagada = obtenerUltimaMesada(dataYear);   // Real pagada
      const smlvDelAño = calculoAnual.smlmvDelAño || smlvValores[year] || 0; // Usar el del cálculo o fallback

      // Lógica de observación (puede mantenerse o adaptarse)
      let maxDiff = 0;
      let obsMonth = '';
      MESES_ORDENADOS.forEach(m => {
        if (dataYear[m]) {
          // Comparar mes actual pagado con primera mesada pagada del año
          const diff = (dataYear[m].mesadaPensional || 0) - primeraMesadaPagada;
          if (Math.abs(diff) > Math.abs(maxDiff)) {
            maxDiff = diff;
            obsMonth = m;
          }
        }
      });
      const observation = obsMonth
        ? (maxDiff > 0
            ? `Incremento (pagado) en ${obsMonth}: ${formatearMoneda(maxDiff)}`
            : `Decremento (pagado) en ${obsMonth}: ${formatearMoneda(Math.abs(maxDiff))}`)
        : '';

      // Lógica de proyeccionISS (puede mantenerse o adaptarse si es necesaria)
      let proyeccionISS = 0;
      // ... (mantener lógica existente si se requiere para otra finalidad) ...
      // Ejemplo simplificado si se basa en el decremento detectado:
       if (primerDecrementoSignificativo && year >= primerDecrementoSignificativo.año) {
           // Esta lógica puede necesitar revisión profunda dependiendo de qué representa 'proyeccionISS'
           // Si es el descuento por Colpensiones, debería basarse en datos reales, no en la 'primeraMesada'
           // Podría ser la diferencia entre la pensión esperada ANTES de la compartición y la pagada DESPUÉS.
           // Por ahora, la dejamos como estaba, pero advertir que puede ser incorrecta.
           // const ipcAnterior = ipcValores[year - 1] || 0;
           // proyeccionISS = (calculosAnualesLey4[year-1]?.pensionEsperadaAnual || 0) * (1 + ipcAnterior / 100); // Ejemplo alternativo
       }


      // Calcular detalles mensuales basados en la diferencia y la indexación
      const mesDetails = {};
      MESES_ORDENADOS.forEach(m => {
        const pensionPagadaMes = dataYear[m]?.mesadaPensional || 0;
        const descuentoSaludMes = dataYear[m]?.descuentoSalud || 0; // Obtener descuento salud del mes
        let diferenciaMes = 0;
        if (pensionPagadaMes > 0) { // Solo calcular diferencia si hubo pago registrado
             diferenciaMes = pensionEsperadaAnual - pensionPagadaMes;
             // Ajuste simple para diciembre si se pagó más por mesada adicional:
             // Si la diferencia es muy negativa en diciembre, podría ser por la mesada adicional.
             // Una heurística simple (puede fallar): si pagado > esperado * 1.5, asumir que la diferencia es 0.
             if (m === 'dic.' && pensionPagadaMes > pensionEsperadaAnual * 1.5) {
                 diferenciaMes = 0; // Asumir que el extra es la adicional
             }
             // Considerar diferencias negativas (pagos en exceso) - Establecer en 0 si es negativa.
             if (diferenciaMes < 0) {
                 diferenciaMes = 0;
             }
        }


        // Indexar la diferencia (ahora siempre >= 0)
        const diferenciaIndexadaMes = calcularIndexacionCompleta(diferenciaMes, year, m, AÑO_FIN, 'dic.');

        mesDetails[m] = {
          pensionPagada: pensionPagadaMes,
          pensionEsperada: pensionEsperadaAnual, // Guardamos la esperada para mostrarla
          diferencia: diferenciaMes, // Ya es 0 si era negativa
          diferenciaIndexada: diferenciaIndexadaMes,
          descuentoSalud: descuentoSaludMes // Guardar descuento salud mensual
        };
      });

      // Calcular totales anuales
      const totalDiferenciaAnual = MESES_ORDENADOS.reduce(
        (acc, mes) => acc + (mesDetails[mes]?.diferencia || 0), 0
      );
      const totalDiferenciaIndexadaAnual = MESES_ORDENADOS.reduce(
        (acc, mes) => acc + (mesDetails[mes]?.diferenciaIndexada || 0), 0
      );
      // Calcular Total Descuento Salud Anual (suma nominal de los descuentos mensuales)
      const totalDescuentoSaludAnual = MESES_ORDENADOS.reduce(
        (acc, mes) => acc + (mesDetails[mes]?.descuentoSalud || 0), 0
      );
      // Calcular Valor Final Neto Anual
      const valorFinalNetoAnual = totalDiferenciaIndexadaAnual - totalDescuentoSaludAnual;


      rows.push({
        year,
        primeraMesadaPagada,
        ultimaMesadaPagada,
        proyeccionISS,
        observation,
        mesDetails,
        pensionBaseAnual: calculoAnual.pensionBaseParaReajuste || 0,
        pensionEsperadaAnual: pensionEsperadaAnual,
        smlmvDelAño: smlvDelAño,
        // Añadir totales anuales calculados
        totalDiferenciaAnual,
        totalDiferenciaIndexadaAnual,
        totalDescuentoSaludAnual,
        valorFinalNetoAnual
      });
    });
    return rows;
  }

  const allRows = calcularFilasBase();
  const maxYearCalculated = allRows.length > 0 ? Math.max(...allRows.map(r => r.year)) : 0;
  const allRowsFiltered = allRows.filter(row => row.year >= 2000); // Ejemplo filtro
  const rowsUltimosAcum = allRowsFiltered.filter(row => row.year >= maxYearCalculated - 2);
  const rowsAnterioresAcum = allRowsFiltered.filter(row => row.year < maxYearCalculated - 2);

  // Datos para el gráfico.
  const datosDelGrafico = {
    labels: Object.keys(datosPorAnoMes).flatMap(año =>
      ordenarMeses(Object.keys(datosPorAnoMes[año])).map(mes => `${mes} ${año}`)
    ),
    datasets: [
      {
        label: 'Mesada Pensional (Pagada)', // Aclarar que es la pagada
        data: Object.keys(datosPorAnoMes).flatMap(año =>
          ordenarMeses(Object.keys(datosPorAnoMes[año])).map(
            mes => datosPorAnoMes[año][mes]?.mesadaPensional || 0 // Usar valor procesado
          )
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      // Podríamos añadir la pensión esperada al gráfico
       {
         label: 'Pensión Esperada (Ley 4/76)',
         data: Object.keys(datosPorAnoMes).flatMap(año => {
           const calculoAnual = calculosAnualesLey4[año] || {};
           const pensionEsperada = calculoAnual.pensionEsperadaAnual || 0;
           return ordenarMeses(Object.keys(datosPorAnoMes[año])).map(
             mes => pensionEsperada // El valor esperado es anual, se repite para cada mes
           );
         }),
         backgroundColor: 'rgba(255, 99, 132, 0.6)', // Otro color
         type: 'line', // Mostrar como línea para diferenciar
         fill: false,
         borderColor: 'rgba(255, 99, 132, 1)',
         tension: 0.1
       },
    ],
  };

  /**
   * Renderiza la tabla principal con opción de mostrar/ocultar detalles mensuales
   * Adaptada para mostrar los nuevos cálculos basados en Ley 4/76 y descuento salud.
   */
  function renderTabla(rows, tituloTotal) {
    // Calcular totales generales
    const monthlyTotalsIndexedDiff = {};
    const monthlyTotalsHealthDiscount = {};
    MESES_ORDENADOS.forEach(m => {
      monthlyTotalsIndexedDiff[m] = rows.reduce((sum, row) => sum + (row.mesDetails[m]?.diferenciaIndexada || 0), 0);
      monthlyTotalsHealthDiscount[m] = rows.reduce((sum, row) => sum + (row.mesDetails[m]?.descuentoSalud || 0), 0);
    });

    const totalGeneralDiferenciaIndexada = rows.reduce((sum, row) => sum + row.totalDiferenciaIndexadaAnual, 0);
    const totalGeneralDescSalud = rows.reduce((sum, row) => sum + row.totalDescuentoSaludAnual, 0);
    const totalGeneralNetoFinal = rows.reduce((sum, row) => sum + row.valorFinalNetoAnual, 0);


    // Ajustar el número de columnas
    // Columnas fijas: Año, Base Reajuste, Esperada Anual, 1ra Pagada, Últ Pagada, #SMLMV Pagada, Obs, Proy ISS = 8
    // Columnas por mes (si detallado): Pagada, Esperada, Diferencia, Dif. Indexada, Desc. Salud = 5
    // Columnas totales fila: Total Dif, Total Dif Indexada, Total Desc Salud, Total Neto Final = 4
    const totalColumnsFijas = 8;
    const columnsPerMonth = 5; // Aumentó en 1
    const totalColumnsTotales = 4; // Aumentó en 2
    const totalColumns = mostrarDetallesMensuales
      ? totalColumnsFijas + (MESES_ORDENADOS.length * columnsPerMonth) + totalColumnsTotales
      : totalColumnsFijas + totalColumnsTotales;

    return (
      <div>
        {/* Botón para mostrar/ocultar detalles */}
        <div style={{ marginBottom: '10px', textAlign: 'right' }}>
          <button
            onClick={() => setMostrarDetallesMensuales(!mostrarDetallesMensuales)}
            style={{ /* ... (estilos existentes) ... */ }}
          >
            {mostrarDetallesMensuales ? 'Ocultar detalles mensuales' : 'Ver detalles mensuales'}
          </button>
        </div>

        <table id="styled-table">
          <thead>
            <tr>
              {/* Columnas fijas */}
              <th>Año</th>
              <th>Base Reajuste Anual</th>
              <th>Pensión Esperada Anual (Ley 4/76)</th>
              <th>Primera Mesada Pagada</th>
              <th>Última Mesada Pagada</th>
              <th># SMLMV (Últ. Pagada)</th>
              <th>Observación (Pagos)</th>
              <th>Proyección ISS (?)</th>

              {/* Columnas mensuales (si aplica) */}
              {mostrarDetallesMensuales && MESES_ORDENADOS.map(mes => (
                <React.Fragment key={mes}>
                  <th>{mes} Pagada</th>
                  <th>{mes} Esperada</th>
                  <th>{mes} Diferencia</th>
                  <th>{mes} Dif. Indexada</th>
                  <th>{mes} Desc. Salud</th> {/* Nueva columna mensual */}
                </React.Fragment>
              ))}

              {/* Columnas de totales por fila */}
              <th>Total Diferencia Anual</th>
              <th>Total Diferencia Indexada Anual</th>
              <th>Total Desc. Salud Anual</th> {/* Nueva columna total */}
              <th>Valor Final Neto Anual</th> {/* Nueva columna total */}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const smlvDelAño = row.smlmvDelAño || 1;
              const numeroSmlmvPagado = (row.ultimaMesadaPagada / smlvDelAño).toFixed(2);

              // Los totales anuales ya están calculados en la fila
              const {
                totalDiferenciaAnual,
                totalDiferenciaIndexadaAnual,
                totalDescuentoSaludAnual,
                valorFinalNetoAnual
              } = row;

              return (
                <tr key={index}>
                  {/* Datos fijos */}
                  <td>{row.year}</td>
                  <td>{formatearMoneda(row.pensionBaseAnual)}</td>
                  <td>{formatearMoneda(row.pensionEsperadaAnual)}</td>
                  <td>{formatearMoneda(row.primeraMesadaPagada)}</td>
                  <td>{formatearMoneda(row.ultimaMesadaPagada)}</td>
                  <td>{numeroSmlmvPagado}</td>
                  <td>{row.observation}</td>
                  <td>{formatearMoneda(row.proyeccionISS)}</td>

                  {/* Datos mensuales (si aplica) */}
                  {mostrarDetallesMensuales && MESES_ORDENADOS.map(m => {
                    const mesData = row.mesDetails[m] || {
                      pensionPagada: 0,
                      pensionEsperada: row.pensionEsperadaAnual,
                      diferencia: 0,
                      diferenciaIndexada: 0,
                      descuentoSalud: 0 // Default
                    };
                    return (
                      <React.Fragment key={m}>
                        <td>{formatearMoneda(mesData.pensionPagada)}</td>
                        <td>{formatearMoneda(mesData.pensionEsperada)}</td>
                        <td style={{ color: mesData.diferencia === 0 && mesData.pensionPagada > mesData.pensionEsperada ? 'red' : 'green' }}> {/* Ajuste color diferencia */}
                          {formatearMoneda(mesData.diferencia)}
                        </td>
                        <td>{formatearMoneda(mesData.diferenciaIndexada)}</td>
                        <td>{formatearMoneda(mesData.descuentoSalud)}</td> {/* Mostrar desc salud mensual */}
                      </React.Fragment>
                    );
                  })}

                  {/* Totales por fila */}
                  <td style={{ fontWeight: 'bold' }}>{formatearMoneda(totalDiferenciaAnual)}</td>
                  <td style={{ fontWeight: 'bold' }}>{formatearMoneda(totalDiferenciaIndexadaAnual)}</td>
                  <td style={{ fontWeight: 'bold' }}>{formatearMoneda(totalDescuentoSaludAnual)}</td> {/* Mostrar total desc salud anual */}
                  <td style={{ fontWeight: 'bold', color: valorFinalNetoAnual < 0 ? 'red' : 'inherit' }}> {/* Mostrar valor final neto anual */}
                    {formatearMoneda(valorFinalNetoAnual)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {/* Fila de totales mensuales (opcional, mostrando diferencia indexada y desc salud) */}
            {mostrarDetallesMensuales && (
              <>
                <tr>
                  <td colSpan={totalColumnsFijas} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    Totales Mensuales (Diferencia Indexada):
                  </td>
                  {MESES_ORDENADOS.map(m => (
                    <React.Fragment key={m}>
                      <td></td><td></td><td></td> {/* Pag, Esp, Dif */}
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {formatearMoneda(monthlyTotalsIndexedDiff[m] || 0)}
                      </td> {/* Dif. Indexada */}
                      <td></td> {/* Desc Salud */}
                    </React.Fragment>
                  ))}
                  <td></td><td></td><td></td><td></td> {/* Totales Fila */}
                </tr>
                <tr>
                  <td colSpan={totalColumnsFijas} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    Totales Mensuales (Desc. Salud):
                  </td>
                  {MESES_ORDENADOS.map(m => (
                    <React.Fragment key={m}>
                      <td></td><td></td><td></td><td></td> {/* Pag, Esp, Dif, Dif Index */}
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {formatearMoneda(monthlyTotalsHealthDiscount[m] || 0)}
                      </td> {/* Desc Salud */}
                    </React.Fragment>
                  ))}
                  <td></td><td></td><td></td><td></td> {/* Totales Fila */}
                </tr>
              </>
            )}

            {/* Fila de totales generales */}
             <tr>
              <td colSpan={totalColumns - 3} style={{ textAlign: 'right', fontWeight: 'bold' }}> {/* Ajustar colSpan */}
                Total General Diferencia Indexada:
              </td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                {formatearMoneda(totalGeneralDiferenciaIndexada)}
              </td>
              <td></td>{/* Desc Salud */}
              <td></td>{/* Neto Final */}
            </tr>
             <tr>
              <td colSpan={totalColumns - 2} style={{ textAlign: 'right', fontWeight: 'bold' }}> {/* Ajustar colSpan */}
                Total General Descuento Salud:
              </td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                {formatearMoneda(totalGeneralDescSalud)}
              </td>
               <td></td>{/* Neto Final */}
            </tr>
            <tr>
              <td colSpan={totalColumns - 1} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                {tituloTotal} (Monto Total Neto Final): {/* Cambiar etiqueta */}
              </td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', color: totalGeneralNetoFinal < 0 ? 'red' : 'inherit' }}>
                {formatearMoneda(totalGeneralNetoFinal)} {/* Mostrar total neto final */}
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
    let primeraMesadaGlobalPagada = 0;
    const años = Object.keys(datosPorAnoMes);
    if (años.length > 0) {
      const primerAño = Math.min(...años.map(Number));
      if (datosPorAnoMes[primerAño]) {
         primeraMesadaGlobalPagada = obtenerPrimeraMesada(datosPorAnoMes[primerAño]);
      }
    }

    // La lógica del 'primerDecrementoSignificativo' se basa en los datos PAGADOS,
    // por lo que puede seguir siendo útil para identificar eventos históricos.
    let smlvDelAñoDecremento = 0;
    let cincoSmlvDecremento = 0;
    let cumple5SMLV = false;
    let equivalenciaSMLV = 0;

    if (primerDecrementoSignificativo) {
      const añoDecremento = primerDecrementoSignificativo.año;
      smlvDelAñoDecremento = smlvValores[añoDecremento] || 0;
      cincoSmlvDecremento = smlvDelAñoDecremento * 5;
      // Comparar la mesada PAGADA en el momento del decremento con 5 SMLMV de ESE año
      cumple5SMLV = primerDecrementoSignificativo.mesadaActual <= cincoSmlvDecremento;
      equivalenciaSMLV = smlvDelAñoDecremento ? (primerDecrementoSignificativo.mesadaActual / smlvDelAñoDecremento).toFixed(2) : 0;
    }

    return (
      <>
        <h3 style={{ marginTop: '20px', marginBottom: '20px', textAlign: 'center' }}>
          Variables Informativas (Basadas en Pagos Registrados)
        </h3>
        <table id="info-table" style={{ marginBottom: '30px', borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ddd' }}>
                Primera mesada registrada (pagada)
              </td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                {formatearMoneda(primeraMesadaGlobalPagada)}
              </td>
            </tr>
            {primerDecrementoSignificativo ? (
              <>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ddd' }}>
                    Primer decremento significativo (pagado)
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {primerDecrementoSignificativo.mes} {primerDecrementoSignificativo.año}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ddd' }}>
                    Mesada pagada mes anterior al decremento
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {formatearMoneda(primerDecrementoSignificativo.mesadaAnterior)}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ddd' }}>
                    Mesada pagada en mes del decremento
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {formatearMoneda(primerDecrementoSignificativo.mesadaActual)}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ddd' }}>
                    Diferencia (decremento pagado)
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {formatearMoneda(primerDecrementoSignificativo.descuento)}
                  </td>
                </tr>
                 <tr>
                  <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ddd' }}>
                    SMLV del año {primerDecrementoSignificativo.año}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {formatearMoneda(smlvDelAñoDecremento)}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ddd' }}>
                    Verificación mesada pagada ≤ 5 SMLV (año {primerDecrementoSignificativo.año})
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {cumple5SMLV ? 'Cumple' : 'No cumple'} - Mesada pagada equivale a {equivalenciaSMLV} SMLV
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td style={{ padding: '8px', border: '1px solid #ddd' }} colSpan={2}>
                  No se ha detectado un decremento significativo en los pagos registrados.
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
        <button id="btn-ley4" onClick={() => setVistaSeleccionada('')}>
          Reclamo Ley 4/1976
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
          <h3>Detalle del Reclamo basado en Ley 4 de 1976 (Aplicación Anual)</h3>
          {renderTabla(allRowsFiltered, 'Total a reclamar (Desde 2000)')}
        </div>
      )}
    </div>
  );
}

export default Certificados;
