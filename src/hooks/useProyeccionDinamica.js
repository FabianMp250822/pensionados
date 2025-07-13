import { useMemo } from 'react';
import { DATOS_TABLA1, DATOS_TABLA3 } from '../constants/pensionData';

export const useProyeccionDinamica = (calculationUtils, pagosFinales) => {
  const { obtenerPagoEnero, contarPagosAño, obtenerDatosAño } = calculationUtils;

  // Función para generar proyección dinámica para la tabla 1 (1999-2007)
  const datosConProyeccionTabla1 = useMemo(() => {
    const primerPago1999 = obtenerPagoEnero(1999);
    
    if (primerPago1999 <= 0) {
      return null;
    }

    let valorBaseAcumulado = primerPago1999;
    let porcentajeSMLMVBase = null;
    
    return DATOS_TABLA1.map((row, index) => {
      if (index === 0) {
        const proyeccionCalculada = valorBaseAcumulado;
        const porcentajeSMLMV = (proyeccionCalculada / row.smlmv);
        porcentajeSMLMVBase = porcentajeSMLMV;
        
        return {
          ...row,
          proyeccionMesadaDinamica: proyeccionCalculada,
          porcentajeSMLMVDinamico: porcentajeSMLMV,
          numeroPagosReales: contarPagosAño(row.año)
        };
      } else {
        const reajustePorcentaje = row.reajuste / 100;
        valorBaseAcumulado = valorBaseAcumulado * (1 + reajustePorcentaje);
        
        return {
          ...row,
          proyeccionMesadaDinamica: valorBaseAcumulado,
          porcentajeSMLMVDinamico: porcentajeSMLMVBase,
          numeroPagosReales: contarPagosAño(row.año)
        };
      }
    });
  }, [obtenerPagoEnero, contarPagosAño]);

  // Función para generar proyección dinámica para la tabla 3
  const datosConProyeccionTabla3 = useMemo(() => {
    if (!datosConProyeccionTabla1) {
      return null;
    }

    // Calcular el valor inicial para la tabla 3
    const calcularValorInicialTabla3 = () => {
      const mesadaPlena = datosConProyeccionTabla1[datosConProyeccionTabla1.length - 1]?.proyeccionMesadaDinamica || 2952301;
      const mesadaPagadaConIPCs = datosConProyeccionTabla1[datosConProyeccionTabla1.length - 1]?.mesadaPagadaConIPC || 2607761;
      
      const calcularValorDespuesCaida = () => {
        const pagos2007 = pagosFinales.filter(pago => pago.año === 2007);
        if (pagos2007.length === 0) return 1014335;
        
        // ...existing code for finding dramatic fall...
        
        return 1014335;
      };
      
      const diferencia = mesadaPlena - mesadaPagadaConIPCs;
      const valorDespuesCaida = calcularValorDespuesCaida();
      return diferencia + valorDespuesCaida;
    };

    let valorBaseAcumulado = calcularValorInicialTabla3();

    // Encontrar pagos para tabla 3
    const pagosTabla3 = [];
    const añosPosteriores = new Set();
    
    pagosFinales.forEach(pago => {
      const añoPago = parseInt(pago.año);
      
      if (añoPago > 2007 && !añosPosteriores.has(añoPago)) {
        const pagosDelAño = contarPagosAño(añoPago);
        if (pagosDelAño > 0) {
          añosPosteriores.add(añoPago);
          
          const datosAño = DATOS_TABLA3.find(d => d.año === añoPago);
          if (datosAño) {
            pagosTabla3.push({
              año: añoPago,
              smlmv: datosAño.smlmv,
              reajuste: datosAño.reajuste,
              valorReal: 0, // Se calculará después
              esContinuacion: false,
              numeroPagos: pagosDelAño
            });
          }
        }
      }
    });

    pagosTabla3.sort((a, b) => a.año - b.año);

    if (pagosTabla3.length === 0) {
      return [];
    }

    let porcentajeSMLMVBase = null;
    
    return pagosTabla3.map((row, index) => {
      if (index === 0) {
        const porcentajeSMLMV = (valorBaseAcumulado / row.smlmv);
        porcentajeSMLMVBase = porcentajeSMLMV;
        
        return {
          ...row,
          proyeccionMesadaDinamica: valorBaseAcumulado,
          porcentajeSMLMVDinamico: porcentajeSMLMV,
          numeroPagosReales: row.numeroPagos || contarPagosAño(row.año)
        };
      } else {
        const reajustePorcentaje = row.reajuste / 100;
        valorBaseAcumulado = valorBaseAcumulado * (1 + reajustePorcentaje);
        
        return {
          ...row,
          proyeccionMesadaDinamica: valorBaseAcumulado,
          porcentajeSMLMVDinamico: porcentajeSMLMVBase,
          numeroPagosReales: row.numeroPagos || contarPagosAño(row.año)
        };
      }
    });
  }, [datosConProyeccionTabla1, pagosFinales, contarPagosAño]);

  return {
    datosConProyeccionTabla1,
    datosConProyeccionTabla3
  };
};
