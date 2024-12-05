import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

// Salarios mínimos en Colombia desde 2012 hasta 2024
const salariosMinimos = {
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
  2024: 1300000,
};

// Lista de meses en español en el orden correcto
const listaMeses = [
  'ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.',
  'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'
];

const RelacionSalariosGrafica = () => {
  const { pensiones } = useSelector((state) => state.pensiones);
  const [anoSeleccionado, setAnoSeleccionado] = useState('');
  const [datosGrafica, setDatosGrafica] = useState(null);

  // Procesar los datos según el año seleccionado
  const procesarDatos = (ano) => {
    const salarioMinimo = salariosMinimos[ano];
    const pagosAno = pensiones.filter((pago) => pago.año === ano);

    const datosPorMes = listaMeses.map((mes) => {
      const pagoMes = pagosAno.find((pago) =>
        pago.periodoPago.split(' ')[1]?.toLowerCase() === mes.toLowerCase()
      );

      if (pagoMes) {
        const mesada = pagoMes.detalles.find(d => d.nombre === 'Mesada Pensional')?.ingresos || 0;
        const egresos = pagoMes.detalles.reduce((acc, d) => acc + (d.egresos || 0), 0);
        const valorAjustado = mesada + egresos;
        const salariosEquivalentes = (valorAjustado / salarioMinimo).toFixed(2);

        return {
          mes,
          mesada,
          egresos,
          valorAjustado,
          salariosEquivalentes,
        };
      } else {
        return { mes, mesada: 0, egresos: 0, valorAjustado: 0, salariosEquivalentes: 0 };
      }
    });

    setDatosGrafica(datosPorMes);
  };

  // Generar los datos para la gráfica
  const generarDatosDelGrafico = () => {
    if (!datosGrafica) return null;

    const labels = datosGrafica.map((dato) => dato.mes);
    const mesadaData = datosGrafica.map((dato) => dato.mesada);
    const egresosData = datosGrafica.map((dato) => dato.egresos);
    const valorAjustadoData = datosGrafica.map((dato) => dato.valorAjustado);
    const salariosEquivalentesData = datosGrafica.map((dato) => dato.salariosEquivalentes);

    return {
      labels,
      datasets: [
        {
          label: 'Mesada Pensional (COP)',
          data: mesadaData,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
        {
          label: 'Egresos (COP)',
          data: egresosData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
        },
        {
          label: 'Mesada + Egresos (COP)',
          data: valorAjustadoData,
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
        },
        {
          label: 'Equivalente en Salarios Mínimos',
          data: salariosEquivalentesData,
          type: 'line',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: false,
        },
      ],
    };
  };

  useEffect(() => {
    if (anoSeleccionado) {
      procesarDatos(anoSeleccionado);
    }
  }, [anoSeleccionado, pensiones]);

  return (
    <div>
      <h2>Comparación de Mesada, Egresos y Salario Mínimo</h2>

      <div style={{ marginBottom: '20px' }}>
        <label>Año:</label>
        <select value={anoSeleccionado} onChange={(e) => setAnoSeleccionado(e.target.value)} className="modern-select">
          <option value="">Seleccione un año</option>
          {Object.keys(salariosMinimos).map((ano) => (
            <option key={ano} value={ano}>
              {ano}
            </option>
          ))}
        </select>
      </div>

      {datosGrafica ? (
        <Bar data={generarDatosDelGrafico()} />
      ) : (
        <p>Seleccione un año para ver la gráfica.</p>
      )}
    </div>
  );
};

export default RelacionSalariosGrafica;
