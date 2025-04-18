import React, { useEffect, useState } from 'react';
import { Scatter } from 'react-chartjs-2';
import 'chart.js/auto';

const GraficoDispersion = ({ pagos }) => {
  const [datosScatter, setDatosScatter] = useState({});

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
    2024: 1280000,
  };

  useEffect(() => {
    const procesarDatos = () => {
      const datos = [];

      pagos.forEach((pago) => {
        const año = pago.año;
        const valorNeto = parseFloat(pago.valorNeto.replace(/\./g, '').replace(',', '.')) || 0;
        const salarioMinimo = salariosMinimos[año];

        // Añadir un punto al gráfico de dispersión
        datos.push({
          x: salarioMinimo, // Salario mínimo en el eje X
          y: valorNeto, // Valor neto en el eje Y
        });
      });

      setDatosScatter({
        datasets: [
          {
            label: 'Relación Valor Neto vs Salario Mínimo',
            data: datos,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            pointRadius: 5,
          },
        ],
      });
    };

    procesarDatos();
  }, [pagos]);

  const opciones = {
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Salario Mínimo (COP)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Valor Neto (COP)',
        },
      },
    },
  };

  return (
    <div>
      <h3>Gráfico de Dispersión: Valor Neto vs Salario Mínimo</h3>
      {Object.keys(datosScatter).length > 0 ? (
        <Scatter data={datosScatter} options={opciones} />
      ) : (
        <p>No hay datos disponibles para mostrar.</p>
      )}
    </div>
  );
};

export default GraficoDispersion;
