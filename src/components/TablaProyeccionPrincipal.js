import React from 'react';
import { formatearNumero, formatearDiferencia, formatearPagoReal, calcularRetroactivas, validarFormulas } from '../utils/pensionFormatters';

const TablaProyeccionPrincipal = ({ 
  datosConProyeccion, 
  obtenerValorMesadaValidoAño, 
  contarPagosAño, 
  obtenerIPCAño, 
  obtenerDatosAño 
}) => {
  
  if (!datosConProyeccion) {
    return null;
  }

  return (
    <div className="tabla-container">
      <table className="tabla-anexo2">
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
        <tbody>
          {datosConProyeccion.map((row, index) => {
            const valorPagoReal = obtenerValorMesadaValidoAño(row.año);
            const mesadaPagadaIPCs = valorPagoReal;
            const smlmvEnReajusteIPCs = mesadaPagadaIPCs > 0 ? (mesadaPagadaIPCs / row.smlmv) : 0;
            
            const ipcAño = obtenerIPCAño(row.año);
            const numeroPagosReales = contarPagosAño(row.año);
            
            const datosAño = obtenerDatosAño(row.año);
            const reajusteSMLMV = datosAño.reajusteSMLMV || row.reajuste;
            
            const smlmvEnReajusteSMLMV = row.proyeccionMesadaDinamica / row.smlmv;
            
            const proyeccionMesadaFiduprevisora = row.proyeccionMesadaDinamica;
            const mesadaPagadaFiduprevisora = mesadaPagadaIPCs;
            const diferenciaMesadas = proyeccionMesadaFiduprevisora - mesadaPagadaFiduprevisora;
            const retroactivasCalculadas = calcularRetroactivas(diferenciaMesadas, numeroPagosReales);
            
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
            <td><strong>{formatearDiferencia(datosConProyeccion.reduce((total, row) => {
              const valorPagoReal = obtenerValorMesadaValidoAño(row.año);
              const diferenciaMesadas = row.proyeccionMesadaDinamica - valorPagoReal;
              const numeroPagosReales = contarPagosAño(row.año);
              const retroactivas = calcularRetroactivas(diferenciaMesadas, numeroPagosReales);
              return total + retroactivas;
            }, 0))}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default TablaProyeccionPrincipal;
