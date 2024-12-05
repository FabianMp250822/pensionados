import React, { useState } from 'react';

const ClienteSelector = ({ onOptionChange }) => {
  const [opcionSeleccionada, setOpcionSeleccionada] = useState('');

  const opciones = [
    { value: '', label: 'Seleccione una opción' },
    { value: 'crearCliente', label: 'Crear Nuevo Cliente' },
    { value: 'verPagosCliente', label: 'Ver Pagos de Cliente' },
    { value: 'verHistorialPagos', label: 'Ver Historial de Pagos' },
  ];

  const handleSelectChange = (e) => {
    const opcion = e.target.value;
    setOpcionSeleccionada(opcion);
    onOptionChange(opcion); // Notifica al componente Contabilidad sobre la opción seleccionada
  };

  return (
    <div className="cliente-selector">
      <label htmlFor="cliente-select">Opciones de Cliente:</label>
      <select
        id="cliente-select"
        value={opcionSeleccionada}
        onChange={handleSelectChange}
        className="modern-select"
      >
        {opciones.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ClienteSelector;
