import React from 'react';
import './Ley100.css';

const Ley100 = ({ rowsUltimosAcum, rowsAnterioresAcum, renderTabla }) => {
  return (
    <div className="ley100-container">
      <section className="ley100-section">
        <h3 className="ley100-title">Años Anteriores (Prescritos)</h3>
        {rowsAnterioresAcum && rowsAnterioresAcum.length > 0
          ? renderTabla(rowsAnterioresAcum, 'Total a reclamar (Años Anteriores)')
          : <p className="ley100-no-data">No hay datos para años anteriores.</p>
        }
      </section>

      <section className="ley100-section">
        <h3 className="ley100-title">Últimos 3 Años (Reclamos Recientes)</h3>
        {rowsUltimosAcum && rowsUltimosAcum.length > 0
          ? renderTabla(rowsUltimosAcum, 'Total a reclamar (Últimos 3 Años)')
          : <p className="ley100-no-data">No hay datos para los últimos 3 años.</p>
        }
      </section>
    </div>
  );
};

export default Ley100;
