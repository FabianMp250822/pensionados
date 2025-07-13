import React from 'react';
import { formatearNumero } from '../utils/pensionFormatters';

const TablaComparticionMesada = ({ datosConProyeccion, pagosFinales }) => {
  
  if (!datosConProyeccion || datosConProyeccion.length === 0) {
    return null;
  }

  const calcularValorDespuesCaida = () => {
    const pagos2007 = pagosFinales.filter(pago => pago.año === 2007);
    if (pagos2007.length === 0) return 1014335;
    
    const mesesMap = {
      ene: 1, enero: 1, feb: 2, febrero: 2, mar: 3, marzo: 3,
      abr: 4, abril: 4, may: 5, mayo: 5, jun: 6, junio: 6,
      jul: 7, julio: 7, ago: 8, agosto: 8, sep: 9, sept: 9, septiembre: 9,
      oct: 10, octubre: 10, nov: 11, noviembre: 11, dic: 12, diciembre: 12
    };

    const obtenerMes = (periodo) => {
      if (!periodo) return 1;
      const periodoLower = periodo.toLowerCase();
      for (let [key, valor] of Object.entries(mesesMap)) {
        if (periodoLower.includes(key)) return valor;
      }
      return 1;
    };

    const pagosOrdenados = pagos2007.sort((a, b) => {
      return obtenerMes(a.periodoPago) - obtenerMes(b.periodoPago);
    });
    
    let valorAnterior = null;
    for (let i = 0; i < pagosOrdenados.length; i++) {
      const pago = pagosOrdenados[i];
      if (pago.detalles && Array.isArray(pago.detalles)) {
        const mesadaDetalle = pago.detalles.find(det => det.codigo === 'MESAD');
        if (mesadaDetalle && mesadaDetalle.ingresos > 0) {
          const valorActual = mesadaDetalle.ingresos;
          
          if (valorAnterior !== null) {
            const porcentajeCaida = ((valorAnterior - valorActual) / valorAnterior) * 100;
            if (porcentajeCaida >= 50) {
              return valorActual;
            }
          }
          valorAnterior = valorActual;
        }
      }
    }
    
    return 1014335;
  };

  const mesadaPlena = datosConProyeccion[datosConProyeccion.length - 1]?.proyeccionMesadaDinamica || 2952301;
  const mesadaPagadaConIPCs = datosConProyeccion[datosConProyeccion.length - 1]?.mesadaPagadaConIPC || 2607761;
  
  const diferencia = mesadaPlena - mesadaPagadaConIPCs;
  const valorDespuesCaida = calcularValorDespuesCaida();
  const valorEmpresa = diferencia + valorDespuesCaida;
  const valorColpensiones = mesadaPlena - valorEmpresa;
  
  const porcentajeColpensiones = ((mesadaPlena - valorEmpresa) / mesadaPlena) * 100;
  const porcentajeEmpresa = (valorEmpresa / mesadaPlena) * 100;

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
        borderLeft: '4px solid #007bff'
      }}>
        2. COMPARTICION DE LA MESADA REAJUSTADA ASÍ:
      </h3>
      
      <table className="tabla-anexo2" style={{fontSize: '13px'}}>
        <tbody>
          <tr>
            <td style={{
              backgroundColor: '#e9ecef',
              fontWeight: 'bold',
              textAlign: 'left',
              padding: '12px',
              borderRight: '2px solid #007bff'
            }}>
              MESADA PLENA DE LA PENSION CONVENCIONAL ANTES DE LA COMPARTICION
            </td>
            <td style={{
              backgroundColor: '#f8f9fa',
              fontWeight: 'bold',
              textAlign: 'right',
              padding: '12px'
            }}>
              {formatearNumero(Math.round(mesadaPlena))}
            </td>
            <td style={{
              backgroundColor: '#f8f9fa',
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '12px'
            }}>
              100.00 %
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={{
              backgroundColor: '#d4edda',
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '10px',
              color: '#155724'
            }}>
              CUOTAS PARTES EN QUE SE DISTRIBUYE EL MONTO DE MESADA PENSIONAL A PARTIR DE LA COMPARTICION
            </td>
          </tr>
          <tr>
            <td style={{
              backgroundColor: '#fff3cd',
              fontWeight: '500',
              textAlign: 'left',
              padding: '12px',
              paddingLeft: '30px'
            }}>
              MESADA RECONOCIDA POR COLPENSIONES
            </td>
            <td style={{
              backgroundColor: '#fff3cd',
              fontWeight: 'bold',
              textAlign: 'right',
              padding: '12px',
              color: '#856404'
            }}>
              {formatearNumero(Math.round(valorColpensiones))}
            </td>
            <td style={{
              backgroundColor: '#fff3cd',
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '12px',
              color: '#856404'
            }}>
              {porcentajeColpensiones.toFixed(2)} %
            </td>
          </tr>
          <tr>
            <td style={{
              backgroundColor: '#f8d7da',
              fontWeight: '500',
              textAlign: 'left',
              padding: '12px',
              paddingLeft: '30px'
            }}>
              MAYOR VALOR A CARGO DE LA EMPRESA
            </td>
            <td style={{
              backgroundColor: '#f8d7da',
              fontWeight: 'bold',
              textAlign: 'right',
              padding: '12px',
              color: '#721c24'
            }}>
              {formatearNumero(Math.round(valorEmpresa))}
            </td>
            <td style={{
              backgroundColor: '#f8d7da',
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '12px',
              color: '#721c24'
            }}>
              {porcentajeEmpresa.toFixed(2)} %
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TablaComparticionMesada;
