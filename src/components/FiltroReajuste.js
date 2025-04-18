import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';



const TASAS_INTERES_MORATORIO = {
    2012: 29.50,
    2013: 28.00,
    2014: 27.50,
    2015: 29.00,
    2016: 31.00,
    2017: 32.00,
    2018: 30.00,
    2019: 29.00,
    2020: 28.00,
    2021: 27.00,
    2022: 26.00,
    2023: 25.00,
    2024: 24.00, // Valores estimados
  };

const SMMLV = {
  1999: 236460,
  2000: 260100,
  2001: 286000,
  2002: 309000,
  2003: 332000,
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
  2016: 689455,
  2017: 737717,
  2018: 781242,
  2019: 828116,
  2020: 877803,
  2021: 908526,
  2022: 1000000,
  2023: 1160000,
  2024: 1200000, // Estimado
};

const IPC = {
  1999: 16.70,
  2000: 9.23,
  2001: 8.75,
  2002: 7.65,
  2003: 6.99,
  2004: 6.49,
  2005: 5.50,
  2006: 4.85,
  2007: 4.48,
  2008: 5.69,
  2009: 7.67,
  2010: 2.00,
  2011: 3.17,
  2012: 3.73,
  2013: 2.44,
  2014: 1.94,
  2015: 3.66,
  2016: 6.77,
  2017: 5.75,
  2018: 4.09,
  2019: 3.18,
  2020: 3.80,
  2021: 5.62,
  2022: 5.62,
  2023: 5.62,
  2024: 5.62, // Valores estimados
};

const FiltroReajuste = () => {
    const { pensiones } = useSelector((state) => state.pensiones);
    const [lastThreeYearsResults, setLastThreeYearsResults] = useState([]);
    const [previousYearsResults, setPreviousYearsResults] = useState([]);
    const [lastThreeYearsTotal, setLastThreeYearsTotal] = useState(0);
    const [previousYearsTotal, setPreviousYearsTotal] = useState(0);
  
    // Fecha actual y fecha límite de prescripción (36 meses atrás)
    const fechaActual = new Date();
    const añoActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth() + 1; // Los meses en JavaScript van de 0 a 11
  
    const fechaLimite = new Date();
    fechaLimite.setFullYear(fechaActual.getFullYear() - 3);
  
    const agruparPagosPorAño = () => {
      const pagosPorAño = {};
  
      pensiones.forEach((pago) => {
        const { año, valorNeto } = pago;
        const neto = parseFloat(valorNeto.replace(/\./g, '').replace(',', '.'));
  
        if (!pagosPorAño[año]) {
          pagosPorAño[año] = neto;
        } else {
          pagosPorAño[año] += neto;
        }
      });
  
      return pagosPorAño;
    };
  
    const calcularReajustes = () => {
      const pagosPorAño = agruparPagosPorAño();
      const años = Object.keys(pagosPorAño).map(Number);
      const añoInicio = Math.min(...años);
  
      let valorNeto = pagosPorAño[añoInicio];
  
      // Calcular factores de ajuste acumulados para indexación
      const cumulativeAdjustmentFactor = {};
      cumulativeAdjustmentFactor[añoActual] = 1;
  
      for (let year = añoActual - 1; year >= añoInicio; year--) {
        const ipcNextYear = IPC[year + 1] / 100;
        cumulativeAdjustmentFactor[year] = cumulativeAdjustmentFactor[year + 1] * (1 + ipcNextYear);
      }
  
      let lastThreeYearsResultsTemp = [];
      let previousYearsResultsTemp = [];
      let lastThreeYearsTotalTemp = 0;
      let previousYearsTotalTemp = 0;
  
      // Número de mesadas al año (ajustar si es necesario)
      const mesadasAnuales = 14;
  
      // Iterar desde el año de inicio hasta el año actual
      for (let año = añoInicio; año <= añoActual; año++) {
        const smmlvAñoAnterior = SMMLV[año - 1];
        const ipcAñoAnterior = IPC[año - 1] / 100;
  
        if (!smmlvAñoAnterior) {
          console.warn(`SMMLV no definido para el año ${año - 1}`);
          continue;
        }
  
        const numSMMLV = valorNeto / smmlvAñoAnterior;
  
        let incremento = 0;
  
        if (numSMMLV <= 5) {
          incremento = 0.15; // 15%
        } else {
          incremento = ipcAñoAnterior; // Porcentaje del IPC
        }
  
        const valorAjustado = valorNeto * (1 + incremento);
  
        // Obtener el valor pagado en ese año, si está disponible
        const valorPagado = pagosPorAño[año] || valorNeto;
        const diferenciaMensual = valorAjustado - valorPagado;
  
        // Calcular la diferencia anual total
        const diferenciaAnual = diferenciaMensual * mesadasAnuales;
  
        // Determinar si el año está dentro de los últimos tres años
        const fechaAño = new Date(año, 0, 1); // Enero 1 del año actual
        let esUltimosTresAños = fechaAño >= fechaLimite;
  
        // Calcular intereses moratorios
        const tasaInteresAnual = TASAS_INTERES_MORATORIO[año] / 100 || 0;
        const tiempoEnAnios = añoActual - año;
        const interesesMoratorios = diferenciaAnual * tasaInteresAnual * tiempoEnAnios;
  
        const resultado = {
          año,
          valorPagado: valorPagado.toLocaleString('es-CO'),
          valorAjustado: valorAjustado.toLocaleString('es-CO'),
          diferenciaMensual: diferenciaMensual.toLocaleString('es-CO'),
          diferenciaAnual: diferenciaAnual.toLocaleString('es-CO'),
          interesesMoratorios: interesesMoratorios.toLocaleString('es-CO'),
          incrementoAplicado: (incremento * 100).toFixed(2) + '%',
          numSMMLV: numSMMLV.toFixed(2),
        };
  
        if (esUltimosTresAños) {
          lastThreeYearsResultsTemp.push(resultado);
          lastThreeYearsTotalTemp += diferenciaAnual + interesesMoratorios;
        } else {
          // Calcular diferencia anual indexada a la fecha actual
          const factorAjuste = cumulativeAdjustmentFactor[año];
          const diferenciaAnualIndexada = (diferenciaAnual + interesesMoratorios) * factorAjuste;
  
          resultado.diferenciaAnualIndexada = diferenciaAnualIndexada.toLocaleString('es-CO');
  
          previousYearsResultsTemp.push(resultado);
          previousYearsTotalTemp += diferenciaAnualIndexada;
        }
  
        // Actualizar valorNeto para el próximo año
        valorNeto = valorAjustado;
      }
  
      setLastThreeYearsResults(lastThreeYearsResultsTemp);
      setPreviousYearsResults(previousYearsResultsTemp);
      setLastThreeYearsTotal(lastThreeYearsTotalTemp);
      setPreviousYearsTotal(previousYearsTotalTemp);
    };
  
    useEffect(() => {
      calcularReajustes();
    }, [pensiones]);
  
    return (
      <div className="filtro-reajuste-container">
        <h2>Reajuste Pensional - Ley 4 de 1976</h2>
  
        {lastThreeYearsResults.length > 0 && (
          <div>
            <h3>
              Últimos Tres Años (De {fechaLimite.getFullYear()} a {añoActual})
            </h3>
            {lastThreeYearsResults.map((resultado) => (
              <div key={resultado.año} className="reajuste-card">
                <p>
                  <strong>Año:</strong> {resultado.año}
                </p>
                <p>
                  <strong>Valor Pagado Mensual:</strong> {resultado.valorPagado}
                </p>
                <p>
                  <strong>Valor Ajustado Mensual:</strong> {resultado.valorAjustado}
                </p>
                <p>
                  <strong>Diferencia Mensual Adeudada:</strong> {resultado.diferenciaMensual}
                </p>
                <p>
                  <strong>Diferencia Anual Adeudada:</strong> {resultado.diferenciaAnual}
                </p>
                <p>
                  <strong>Intereses Moratorios:</strong> {resultado.interesesMoratorios}
                </p>
                <p>
                  <strong>Incremento Aplicado:</strong> {resultado.incrementoAplicado}
                </p>
                <p>
                  <strong>Número de SMMLV:</strong> {resultado.numSMMLV}
                </p>
              </div>
            ))}
            <h4>Total Diferencias e Intereses Últimos Tres Años:</h4>
            <p>{lastThreeYearsTotal.toLocaleString('es-CO')}</p>
          </div>
        )}
  
        {previousYearsResults.length > 0 && (
          <div>
            <h3>Años Anteriores  (Hasta {fechaLimite.getFullYear() - 1})</h3>
            {previousYearsResults.map((resultado) => (
              <div key={resultado.año} className="reajuste-card">
                <p>
                  <strong>Año:</strong> {resultado.año}
                </p>
                <p>
                  <strong>Valor Pagado Mensual:</strong> {resultado.valorPagado}
                </p>
                <p>
                  <strong>Valor Ajustado Mensual:</strong> {resultado.valorAjustado}
                </p>
                <p>
                  <strong>Diferencia Mensual Adeudada:</strong> {resultado.diferenciaMensual}
                </p>
                <p>
                  <strong>Diferencia Anual Adeudada:</strong> {resultado.diferenciaAnual}
                </p>
                <p>
                  <strong>Intereses Moratorios:</strong> {resultado.interesesMoratorios}
                </p>
                <p>
                  <strong>Diferencia Anual Indexada a {añoActual}:</strong> {resultado.diferenciaAnualIndexada}
                </p>
                <p>
                  <strong>Incremento Aplicado:</strong> {resultado.incrementoAplicado}
                </p>
                <p>
                  <strong>Número de SMMLV:</strong> {resultado.numSMMLV}
                </p>
              </div>
            ))}
            <h4>Total Diferencias Indexadas e Intereses Años Anteriores:</h4>
            <p>{previousYearsTotal.toLocaleString('es-CO')}</p>
          </div>
        )}
      </div>
    );
  };
  
  export default FiltroReajuste;
