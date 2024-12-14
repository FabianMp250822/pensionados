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
    <div
      className="listado-pagos-container"
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Listado de Pagos
      </h2>
      <table
        className="table-pagos"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '20px',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#007bff', color: '#fff' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Concepto</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Monto</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {pagos.map((pago, index) => (
            <tr
              key={pago.id}
              style={{
                backgroundColor: index % 2 === 0 ? '#f2f2f2' : '#ffffff',
              }}
            >
              <td style={{ padding: '10px' }}>{pago.id}</td>
              <td style={{ padding: '10px' }}>{pago.concepto}</td>
              <td style={{ padding: '10px' }}>${pago.monto}</td>
              <td style={{ padding: '10px' }}>{pago.fecha}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div
        className="botones-acciones"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Descargar CSV
        </button>
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Generar Reporte
        </button>
      </div>
    </div>
  );
};

export default ListadoPagos;
