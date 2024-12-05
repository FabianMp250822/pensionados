import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

// Ordenar los meses en orden cronológico
const MESES_ORDENADOS = [
  'ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 
  'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'
];

const GraficoPensiones = () => {
  const { pensiones } = useSelector((state) => state.pensiones);
  const [datosPorAnoMes, setDatosPorAnoMes] = useState({});
  const [anoSeleccionado, setAnoSeleccionado] = useState('');

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
      };

      procesarDatos();
    }
  }, [pensiones]);

  const obtenerAniosDisponibles = () => {
    const años = Object.keys(datosPorAnoMes);
    return años.sort((a, b) => b - a); // Ordenar años en orden descendente
  };

  const ordenarMeses = (meses) => {
    return meses.sort((a, b) => MESES_ORDENADOS.indexOf(a) - MESES_ORDENADOS.indexOf(b));
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

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <label>Año:</label>
        <select value={anoSeleccionado} onChange={(e) => setAnoSeleccionado(e.target.value)} className="modern-select">
          <option value="">Todos los años</option>
          {obtenerAniosDisponibles().map((ano) => (
            <option key={ano} value={ano}>
              {ano}
            </option>
          ))}
        </select>
      </div>

      {Object.keys(datosFiltradosPorAno).length > 0 ? (
        <Bar data={datosDelGrafico} />
      ) : (
        <p>No hay datos de pensiones disponibles para graficar.</p>
      )}
    </div>
  );
};

export default GraficoPensiones;
