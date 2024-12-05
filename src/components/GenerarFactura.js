import React from 'react';

const GenerarFactura = ({ cliente }) => {
  // Datos aleatorios de ejemplo
  const numeroFactura = Math.floor(Math.random() * 100000);
  const fecha = new Date().toLocaleDateString();
  const total = (Math.random() * 500).toFixed(2);

  return (
    <div className="generar-factura">
      <h2>Generar Factura</h2>
      <p><strong>Cliente:</strong> {cliente ? cliente.nombre : 'Selecciona un cliente'}</p>
      <p><strong>NIT:</strong> {cliente ? cliente.nit : '---'}</p>
      <p><strong>Fecha:</strong> {fecha}</p>
      <p><strong>Factura No:</strong> {numeroFactura}</p>
      <p><strong>Total:</strong> ${total}</p>
      <button className="btn-generar">Generar Factura</button>
    </div>
  );
};

export default GenerarFactura;
