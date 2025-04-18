import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const GraficoPoderAdquisitivo = ({ pagos }) => {
  const [datosLinea, setDatosLinea] = useState({});
  const [resultadoPoderAdquisitivo, setResultadoPoderAdquisitivo] = useState({});
  const [anoSeleccionado, setAnoSeleccionado] = useState(''); // Año seleccionado por el usuario
  const [anosDisponibles, setAnosDisponibles] = useState([]); // Lista de años disponibles

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

  // IPC real de Colombia desde 2012 hasta 2023
  const ipcAnual = {
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
  };

  useEffect(() => {
    const procesarDatos = () => {
      const datos = [];
      const etiquetas = [];
      const anos = new Set(); // Para almacenar los años únicos
      const resultados = {};

      pagos.forEach((pago) => {
        const año = pago.año;
        const valorNeto = parseFloat(pago.valorNeto.replace(/\./g, '').replace(',', '.')) || 0;
        const salarioMinimo = salariosMinimos[año];
        const ipcAjustado = (1 + ipcAnual[año] / 100);

        // Calcular el poder adquisitivo ajustado por IPC en términos de salarios mínimos
        const poderAdquisitivo = (valorNeto / salarioMinimo) / ipcAjustado;

        // Guardar los datos solo si no se ha seleccionado un año o si coincide con el año seleccionado
        if (!anoSeleccionado || anoSeleccionado === año.toString()) {
          etiquetas.push(año);
          datos.push(poderAdquisitivo.toFixed(2)); // Ajuste a 2 decimales
        }

        // Agrupar resultados por año
        if (!resultados[año]) {
          resultados[año] = { poderAdquisitivoTotal: 0, totalPagos: 0 };
        }
        resultados[año].poderAdquisitivoTotal += poderAdquisitivo;
        resultados[año].totalPagos += 1;

        // Agregar el año a la lista de años disponibles
        anos.add(año);
      });

      // Configurar los datos para el gráfico de líneas
      setDatosLinea({
        labels: etiquetas.sort((a, b) => a - b), // Ordenar los años
        datasets: [
          {
            label: 'Poder Adquisitivo (en términos de salarios mínimos ajustados por IPC)',
            data: datos,
            fill: false,
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.1,
          },
        ],
      });

      // Establecer los años disponibles en el filtro
      setAnosDisponibles([...anos].sort((a, b) => a - b)); // Ordenar años

      // Guardar resultados del poder adquisitivo agrupados por año
      setResultadoPoderAdquisitivo(resultados);
    };

    procesarDatos();
  }, [pagos, anoSeleccionado]);

  const opciones = {
    responsive: true,
    scales: {
      y: {
        title: {
          display: true,
          text: 'Salarios Mínimos (Ajustados por IPC)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Año',
        },
      },
    },
  };

  // Función para mostrar si ganó o perdió en cada año
  const mostrarResultadosAgrupados = () => {
    const resultadoAñoSeleccionado = resultadoPoderAdquisitivo[anoSeleccionado];
    if (anoSeleccionado && resultadoAñoSeleccionado) {
      const { poderAdquisitivoTotal, totalPagos } = resultadoAñoSeleccionado;
      const promedioPoderAdquisitivo = poderAdquisitivoTotal / totalPagos;

      return (
        <li key={anoSeleccionado}>
          En {anoSeleccionado}, {promedioPoderAdquisitivo < 1 ? 'perdió' : 'ganó'} poder adquisitivo.
        </li>
      );
    }

    return Object.keys(resultadoPoderAdquisitivo).map((año) => {
      const { poderAdquisitivoTotal, totalPagos } = resultadoPoderAdquisitivo[año];
      const promedioPoderAdquisitivo = poderAdquisitivoTotal / totalPagos;

      return (
        <li key={año}>
          En {año}, {promedioPoderAdquisitivo < 1 ? 'perdió' : 'ganó'} poder adquisitivo.
        </li>
      );
    });
  };

  return (
    <div>
      <h3>Gráfico de Poder Adquisitivo Ajustado por IPC</h3>

      {/* Filtro de selección de año */}
      <div style={{ marginBottom: '20px' }}>
        <label>Año:</label>
        <select value={anoSeleccionado} onChange={(e) => setAnoSeleccionado(e.target.value)} className="modern-select">
          <option value="">Todos los años</option>
          {anosDisponibles.map((ano) => (
            <option key={ano} value={ano}>
              {ano}
            </option>
          ))}
        </select>
      </div>

      {/* Mostrar gráfico de líneas */}
      {Object.keys(datosLinea).length > 0 ? (
        <Line data={datosLinea} options={opciones} />
      ) : (
        <p>No hay datos disponibles para mostrar.</p>
      )}

      {/* Mostrar los resultados agrupados de si ganó o perdió poder adquisitivo */}
      <div style={{ marginTop: '20px' }}>
        <h4>Resultados del Poder Adquisitivo:</h4>
        <ul>
          {mostrarResultadosAgrupados()}
        </ul>
      </div>
    </div>
  );
};

export default GraficoPoderAdquisitivo;
