import React from 'react';

const Escolastica = ({ rowsUltimosAcum, rowsAnterioresAcum, renderTabla }) => {
  return (
    <>
      <div style={{ marginTop: '30px' }}>
        <h3>Últimos 3 Años (Reclamos Recientes)</h3>
        {rowsUltimosAcum.length > 0
          ? renderTabla(rowsUltimosAcum, 'Total a reclamar (Últimos 3 Años)')
          : <p>No hay datos para los últimos 3 años.</p>}
      </div>
      <div style={{ marginTop: '30px' }}>
        <h3>Años Anteriores (Prescritos)</h3>
        {rowsAnterioresAcum.length > 0
          ? renderTabla(rowsAnterioresAcum, 'Total a reclamar (Años Anteriores)')
          : <p>No hay datos para años anteriores.</p>}
      </div>
    </>
  );
};

export default Escolastica;
