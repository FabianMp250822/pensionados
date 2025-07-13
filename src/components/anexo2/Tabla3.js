import React from 'react';
import { formatearNumero, formatearDiferencia, formatearPagoReal, calcularRetroactivas, validarFormulas } from './utils';
import { obtenerIPCAño, obtenerDatosAño } from './dataConstants';

const TableHeader = () => (
  <thead>
    <tr>
      <th rowSpan={2}>Año</th>
      <th rowSpan={2}>SMLMV</th>
      <th rowSpan={2}>Reajuste en % SMLMV</th>
      <th rowSpan={2}>Proyección de Mesada Fiduprevisora con % SMLMV</th>
      <th rowSpan={2}># de SMLMV (En el Reajuste x SMLMV)</th>
      <th rowSpan={2}>Reajuste en % IPCs</th>
      <th rowSpan={2}>Mesada Pagada Fiduprevisora reajuste con IPCs</th>
      <th rowSpan={2}># de SMLMV (En el Reajuste x IPC)</th>
      <th rowSpan={2}>Diferencias de Mesadas</th>
      <th rowSpan={2}># de Mesadas</th>
      <th rowSpan={2}>Total Diferencias Retroactivas</th>
    </tr>
  </thead>
);

const Tabla3 = ({ 
  datosConProyeccionTabla3,
  datosConProyeccionTabla1,
  obtenerValorMesadaValidoAño, 
  contarPagosAño 
}) => {
  if (!datosConProyeccionTabla3 || datosConProyeccionTabla3.length === 0) {
    return null;
  }

  const calcularTotalRetroactivasTabla3 = () => {
    return datosConProyeccionTabla3.reduce((total, row) => {
      let valorPagoReal, numeroPagosReales;
      
      if (row.esContinuacion) {
        valorPagoReal = row.valorReal;
        numeroPagosReales = row.mesadasFaltantes;
      } else {
        valorPagoReal = obtenerValorMesadaValidoAño(row.año);
        numeroPagosReales = contarPagosAño(row.año);
      }
      
      const diferenciaMesadas = row.proyeccionMesadaDinamica - valorPagoReal;
      const retroactivas = calcularRetroactivas(diferenciaMesadas, numeroPagosReales);
      return total + retroactivas;
    }, 0);
  };

  const calcularTotalRetroactivasTabla1 = () => {
    return datosConProyeccionTabla1.reduce((total, row) => {
      const valorPagoReal = obtenerValorMesadaValidoAño(row.año);
      const diferenciaMesadas = row.proyeccionMesadaDinamica - valorPagoReal;
      const numeroPagosReales = contarPagosAño(row.año);
      const retroactivas = calcularRetroactivas(diferenciaMesadas, numeroPagosReales);
      return total + retroactivas;
    }, 0);
  };

  const totalGeneral = calcularTotalRetroactivasTabla1() + calcularTotalRetroactivasTabla3();

  return (
    <div className="tabla-container" style={{marginTop: '30px'}}>
      <h3 style={{
        textAlign: 'center',
        color: '#333',
        fontSize: '1.2rem',
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px',
        borderLeft: '4px solid #28a745'
      }}>
        3. PROYECCIÓN COMPARATIVA CONTINUADA DESDE 2008 EN ADELANTE
      </h3>
      
      <table className="tabla-anexo2">
        <TableHeader />
        <tbody>
          {datosConProyeccionTabla3.map((row, index) => {
            // Si es una continuación del año de corte, usar datos específicos del corte
            let valorPagoReal, numeroPagosReales, añoMostrar;
            
            if (row.esContinuacion) {
              valorPagoReal = row.valorReal;
              numeroPagosReales = row.mesadasFaltantes;
              añoMostrar = row.año;
            } else {
              valorPagoReal = obtenerValorMesadaValidoAño(row.año);
              numeroPagosReales = contarPagosAño(row.año);
              añoMostrar = row.año;
            }
            
            // Obtener el IPC del año anterior para el reajuste
            const ipcAño = obtenerIPCAño(row.año);
            
            const mesadaPagadaIPCs = valorPagoReal;
            const smlmvEnReajusteIPCs = mesadaPagadaIPCs > 0 ? (mesadaPagadaIPCs / row.smlmv) : 0;
            
            // Usar datos consolidados para mayor consistencia
            const datosAño = obtenerDatosAño(row.año);
            const reajusteSMLMV = datosAño.reajusteSMLMV || row.reajuste;
            
            // Calcular # de SMLMV (En el Reajuste x SMLMV) usando proyección dinámica
            const smlmvEnReajusteSMLMV = row.proyeccionMesadaDinamica / row.smlmv;
            
            // Cálculos de diferencias y retroactivas con validaciones
            const proyeccionMesadaFiduprevisora = row.proyeccionMesadaDinamica;
            const mesadaPagadaFiduprevisora = mesadaPagadaIPCs;
            const diferenciaMesadas = proyeccionMesadaFiduprevisora - mesadaPagadaFiduprevisora;
            const retroactivasCalculadas = calcularRetroactivas(diferenciaMesadas, numeroPagosReales);
            
            // Validar fórmulas (solo en modo desarrollo)
            if (process.env.NODE_ENV === 'development') {
              validarFormulas(row.año, proyeccionMesadaFiduprevisora, mesadaPagadaFiduprevisora, diferenciaMesadas, numeroPagosReales, retroactivasCalculadas);
            }
            
            return (
              <tr key={`${row.año}-${index}`} style={{
                backgroundColor: row.esContinuacion ? '#fff3cd' : 'transparent'
              }}>
                <td>{añoMostrar}</td>
                <td>{formatearNumero(row.smlmv)}</td>
                <td>{reajusteSMLMV.toFixed(2)}</td>
                <td>{formatearNumero(Math.round(row.proyeccionMesadaDinamica))}</td>
                <td>{smlmvEnReajusteSMLMV.toFixed(2)}</td>
                <td>{ipcAño.toFixed(2)}</td>
                <td>{formatearPagoReal(mesadaPagadaIPCs)}</td>
                <td>{smlmvEnReajusteIPCs.toFixed(2)}</td>
                <td>{formatearDiferencia(diferenciaMesadas)}</td>
                <td>
                  {numeroPagosReales}
                  {row.esContinuacion && (
                    <small style={{display: 'block', color: '#856404', fontSize: '0.8em'}}>
                      (mesadas faltantes)
                    </small>
                  )}
                </td>
                <td>{formatearDiferencia(retroactivasCalculadas)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="total-row">
            <td colSpan={10}><strong>TOTAL TABLA 3</strong></td>
            <td><strong>{formatearDiferencia(calcularTotalRetroactivasTabla3())}</strong></td>
          </tr>
        </tfoot>
      </table>

      {/* Total general de ambas tablas */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#d4edda',
        borderRadius: '5px',
        borderLeft: '4px solid #28a745'
      }}>
        <h4 style={{margin: '0 0 10px 0', color: '#155724'}}>
          TOTAL GENERAL (TABLA 1 + TABLA 3):
        </h4>
        <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#155724'}}>
          {formatearDiferencia(totalGeneral)}
        </div>
      </div>
    </div>
  );
};

export default Tabla3;
