import React from 'react';

const NoDataMessage = () => {
  return (
    <div className="sin-datos-mensaje">
      <div className="alerta-sin-datos">
        <h3>⚠️ No hay datos de pagos disponibles</h3>
        <p>Para generar la proyección comparativa es necesario tener al menos un registro de pago del año 1999 (o año inicial de la pensión).</p>
        <p>Este usuario no tiene registros de pagos en el sistema, por lo que no es posible calcular las proyecciones dinámicas.</p>
        <p><strong>Por favor contacte al administrador para cargar los datos de pagos históricos.</strong></p>
      </div>
    </div>
  );
};

export default NoDataMessage;
