import React from 'react';

const ListadoPagos = () => {
  // Generar pagos aleatorios
  const pagos = Array.from({ length: 5 }, (_, index) => ({
    id: index + 1,
    concepto: `Pago ${index + 1}`,
    monto: (Math.random() * 1000).toFixed(2),
    fecha: new Date().toLocaleDateString(),
  }));

  return (
    <div className="listado-pagos">
      <h2>Listado de Pagos</h2>
      <table className="table-pagos">
        <thead>
          <tr>
            <th>ID</th>
            <th>Concepto</th>
            <th>Monto</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {pagos.map((pago) => (
            <tr key={pago.id}>
              <td>{pago.id}</td>
              <td>{pago.concepto}</td>
              <td>${pago.monto}</td>
              <td>{pago.fecha}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListadoPagos;
