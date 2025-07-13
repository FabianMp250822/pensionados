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

const Tabla1 = ({ 
  datosConProyeccionTabla1, 
  obtenerValorMesadaValidoAño, 
  contarPagosAño 
}) => {
  if (!datosConProyeccionTabla1 || datosConProyeccionTabla1.length === 0) {
    return null;
  }

  const calcularTotalRetroactivas = () => {
    return datosConProyeccionTabla1.reduce((total, row) => {
      const valorPagoReal = obtenerValorMesadaValidoAño(row.año);
      const diferenciaMesadas = row.proyeccionMesadaDinamica - valorPagoReal;
      const numeroPagosReales = contarPagosAño(row.año);
      const retroactivas = calcularRetroactivas(diferenciaMesadas, numeroPagosReales);
      return total + retroactivas;
    }, 0);
  };

  return (
    <div className="tabla-container">
      <table className="tabla-anexo2">
        <TableHeader />
        <tbody>
          {datosConProyeccionTabla1.map((row, index) => {
            // Obtener el valor real pagado válido (considerando caídas drásticas)
            const valorPagoReal = obtenerValorMesadaValidoAño(row.año);
            const mesadaPagadaIPCs = valorPagoReal;
            const smlmvEnReajusteIPCs = mesadaPagadaIPCs > 0 ? (mesadaPagadaIPCs / row.smlmv) : 0;
            
            // Obtener el IPC del año anterior para el reajuste
            const ipcAño = obtenerIPCAño(row.año);
            
            // Usar el número real de pagos del año (cortado por caídas drásticas)
            const numeroPagosReales = contarPagosAño(row.año);
            
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
              <tr key={index}>
                <td>{row.año}</td>
                <td>{formatearNumero(row.smlmv)}</td>
                <td>{reajusteSMLMV.toFixed(2)}</td>
                <td>{formatearNumero(Math.round(row.proyeccionMesadaDinamica))}</td>
                <td>{smlmvEnReajusteSMLMV.toFixed(2)}</td>
                <td>{ipcAño.toFixed(2)}</td>
                <td>{formatearPagoReal(mesadaPagadaIPCs)}</td>
                <td>{smlmvEnReajusteIPCs.toFixed(2)}</td>
                <td>{formatearDiferencia(diferenciaMesadas)}</td>
                <td>{numeroPagosReales}</td>
                <td>{formatearDiferencia(retroactivasCalculadas)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="total-row">
            <td colSpan={10}><strong>TOTAL</strong></td>
            <td><strong>{formatearDiferencia(calcularTotalRetroactivas())}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default Tabla1;
