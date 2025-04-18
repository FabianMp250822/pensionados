import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const GraficoBarrasApiladas = ({ pagos }) => {
  const [datosBarras, setDatosBarras] = useState({});

  useEffect(() => {
    const procesarDatos = () => {
      const pagosAgrupadosPorAno = {};

      pagos.forEach((pago) => {
        const año = pago.año;
        const mes = pago.periodoPago.split(' ')[1]; // Obtener el mes desde 'periodoPago'
        const valorLiquidado = parseFloat(pago.valorLiquidado.replace(/\./g, '').replace(',', '.')) || 0;
        const valorNeto = parseFloat(pago.valorNeto.replace(/\./g, '').replace(',', '.')) || 0;
        const basico = parseFloat(pago.basico.replace(/\./g, '').replace(',', '.')) || 0;

        // Si el año no existe en el agrupamiento, lo inicializamos
        if (!pagosAgrupadosPorAno[año]) {
          pagosAgrupadosPorAno[año] = {
            meses: {},
            totalBasico: 0,
            totalValorLiquidado: 0,
            totalValorNeto: 0,
          };
        }

        // Si el mes no existe, lo inicializamos
        if (!pagosAgrupadosPorAno[año].meses[mes]) {
          pagosAgrupadosPorAno[año].meses[mes] = {
            totalBasico: 0,
            totalValorLiquidado: 0,
            totalValorNeto: 0,
          };
        }

        // Sumar los valores correspondientes al mes
        pagosAgrupadosPorAno[año].meses[mes].totalBasico += basico;
        pagosAgrupadosPorAno[año].meses[mes].totalValorLiquidado += valorLiquidado;
        pagosAgrupadosPorAno[año].meses[mes].totalValorNeto += valorNeto;
      });

      // Procesar los datos para el gráfico de barras apiladas
      const labels = Object.keys(pagosAgrupadosPorAno);
      const dataBasico = [];
      const dataValorLiquidado = [];
      const dataValorNeto = [];

      labels.forEach((año) => {
        const meses = pagosAgrupadosPorAno[año].meses;
        let totalBasico = 0;
        let totalValorLiquidado = 0;
        let totalValorNeto = 0;

        Object.keys(meses).forEach((mes) => {
          totalBasico += meses[mes].totalBasico;
          totalValorLiquidado += meses[mes].totalValorLiquidado;
          totalValorNeto += meses[mes].totalValorNeto;
        });

        dataBasico.push(totalBasico);
        dataValorLiquidado.push(totalValorLiquidado);
        dataValorNeto.push(totalValorNeto);
      });

      // Crear los datos para la gráfica
      setDatosBarras({
        labels: labels,
        datasets: [
          {
            label: 'Básico',
            data: dataBasico,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          },
          {
            label: 'Valor Liquidado',
            data: dataValorLiquidado,
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
          },
          {
            label: 'Valor Neto',
            data: dataValorNeto,
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
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
        stacked: true,
      },
      y: {
        stacked: true,
      },
    },
  };

  return (
    <div>
      <h3>Gráfico de Barras Apiladas de Componentes del Pago</h3>
      {Object.keys(datosBarras).length > 0 ? (
        <Bar data={datosBarras} options={opciones} />
      ) : (
        <p>No hay datos disponibles para mostrar.</p>
      )}
    </div>
  );
};

export default GraficoBarrasApiladas;
