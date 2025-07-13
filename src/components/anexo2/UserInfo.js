import React from 'react';

const UserInfo = ({ usuarioSeleccionado }) => {
  if (!usuarioSeleccionado) return null;

  return (
    <div className="usuario-info-anexo2">
      <div className="info-item">
        <span className="label">Cédula:</span>
        <span className="value">{usuarioSeleccionado.documento}</span>
      </div>
      <div className="info-item">
        <span className="label">Nombre:</span>
        <span className="value">{usuarioSeleccionado.nombre}</span>
      </div>
    </div>
  );
};

export default UserInfo;
