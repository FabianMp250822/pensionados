import React, { useEffect, useState } from 'react';

// Función para procesar los datos por año y mes
const organizarPagosPorAnoMes = (pagos) => {
  const pagosOrganizados = {};

  pagos.forEach((pago) => {
    const año = pago.año; // Obtener el año desde el campo 'año'
    const mes = pago.periodoPago.split(' ')[1]; // Obtener el mes desde el campo 'periodoPago'

    if (!pagosOrganizados[año]) {
      pagosOrganizados[año] = {};
    }

    if (!pagosOrganizados[año][mes]) {
      pagosOrganizados[año][mes] = {
        totalLiquidado: 0,
        totalNeto: 0,
        pagos: []
      };
    }

    // Agregar el pago al mes correspondiente
    pagosOrganizados[año][mes].pagos.push(pago);

    // Convertir los valores a números para poder sumarlos
    const valorLiquidadoNumerico = parseFloat(pago.valorLiquidado.replace(/\./g, '').replace(',', '.')) || 0;
    const valorNetoNumerico = parseFloat(pago.valorNeto.replace(/\./g, '').replace(',', '.')) || 0;

    // Sumar los valores liquidados y netos
    pagosOrganizados[año][mes].totalLiquidado += valorLiquidadoNumerico;
    pagosOrganizados[año][mes].totalNeto += valorNetoNumerico;
  });

  return pagosOrganizados;
};

const ProcesarPagos = ({ pagos }) => {
  const [pagosOrganizados, setPagosOrganizados] = useState({});
  const [anoSeleccionado, setAnoSeleccionado] = useState(''); // Estado para manejar el año seleccionado

  useEffect(() => {
    if (pagos && pagos.length > 0) {
      const organizados = organizarPagosPorAnoMes(pagos);
      setPagosOrganizados(organizados);
    }
  }, [pagos]);

  // Obtener los años disponibles de los datos
  const obtenerAniosDisponibles = () => {
    return Object.keys(pagosOrganizados);
  };

  // Filtrar los datos por el año seleccionado
  const pagosFiltradosPorAno = anoSeleccionado
    ? { [anoSeleccionado]: pagosOrganizados[anoSeleccionado] }
    : pagosOrganizados; // Si no hay año seleccionado, mostrar todos

  return (
    <div>
      <h2>Pagos Organizados por Año y Mes</h2>

      {/* Agregar el select para filtrar por año */}
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

      {Object.keys(pagosFiltradosPorAno).length === 0 ? (
        <p>No hay pagos disponibles.</p>
      ) : (
        Object.keys(pagosFiltradosPorAno).map((año) => (
          <div key={año}>
            <h3>{año}</h3>
            {Object.keys(pagosFiltradosPorAno[año]).map((mes) => (
              <div key={mes} style={{ marginBottom: '20px' }}>
                <h4>{mes}</h4>
                <p>Total Liquidado: {pagosFiltradosPorAno[año][mes].totalLiquidado.toFixed(2)}</p>
                <p>Total Neto: {pagosFiltradosPorAno[año][mes].totalNeto.toFixed(2)}</p>
                <ul>
                  {pagosFiltradosPorAno[año][mes].pagos.map((pago, index) => (
                    <li key={index}>
                      <p>Periodo: {pago.periodoPago}</p>
                      <p>Valor Liquidado: {pago.valorLiquidado}</p>
                      <p>Valor Neto: {pago.valorNeto}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default ProcesarPagos;
