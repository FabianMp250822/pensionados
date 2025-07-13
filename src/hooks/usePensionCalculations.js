import { useMemo } from 'react';
import { DATOS_CONSOLIDADOS, DATOS_IPC } from '../constants/pensionData';

export const usePensionCalculations = (pagosFinales) => {
  
  // Función para obtener el pago de enero de un año específico
  const obtenerPagoEnero = useMemo(() => (año) => {
    const pagosAño = pagosFinales.filter(pago => {
      const añoPago = parseInt(pago.año);
      return añoPago === año;
    });

    if (pagosAño.length === 0) return 0;

    let pagoEnero = pagosAño.find(pago => {
      const periodoLower = pago.periodoPago?.toLowerCase() || '';
      return (
        periodoLower.includes('ene') || 
        periodoLower.includes('enero') ||
        periodoLower.startsWith('ene.') ||
        periodoLower === 'enero' ||
        periodoLower === 'ene'
      );
    });

    if (!pagoEnero && pagosAño.length > 0) {
      const pagosOrdenados = pagosAño.sort((a, b) => {
        const periodoA = a.periodoPago?.toLowerCase() || '';
        const periodoB = b.periodoPago?.toLowerCase() || '';
        return periodoA.localeCompare(periodoB);
      });
      pagoEnero = pagosOrdenados[0];
    }

    if (pagoEnero && Array.isArray(pagoEnero.detalles)) {
      const mesadaDetalle = pagoEnero.detalles.find(det => 
        det.nombre?.toLowerCase().includes('mesada pensional') || 
        det.nombre?.toLowerCase().includes('mesada') ||
        det.codigo === 'MESAD'
      );
      return mesadaDetalle ? mesadaDetalle.ingresos : 0;
    }
    return 0;
  }, [pagosFinales]);

  // Función para obtener el último valor válido de mesada antes de una caída drástica
  const obtenerValorMesadaValidoAño = useMemo(() => (año) => {
    const pagosAño = pagosFinales.filter(pago => {
      const añoPago = parseInt(pago.año);
      return añoPago === año;
    });

    if (pagosAño.length === 0) return obtenerPagoEnero(año);

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

    const pagosOrdenados = pagosAño.sort((a, b) => {
      return obtenerMes(a.periodoPago) - obtenerMes(b.periodoPago);
    });

    let valorMesadaAnterior = null;
    let ultimoValorValido = null;

    for (let i = 0; i < pagosOrdenados.length; i++) {
      const pago = pagosOrdenados[i];
      
      if (pago.detalles && Array.isArray(pago.detalles)) {
        const mesadaDetalle = pago.detalles.find(det => 
          det.nombre?.toLowerCase().includes('mesada pensional') || 
          det.nombre?.toLowerCase().includes('mesada') ||
          det.codigo === 'MESAD'
        );
        if (mesadaDetalle && mesadaDetalle.ingresos > 0) {
          const valorMesadaActual = mesadaDetalle.ingresos;
          
          if (valorMesadaAnterior !== null) {
            const porcentajeCaida = ((valorMesadaAnterior - valorMesadaActual) / valorMesadaAnterior) * 100;
            
            if (porcentajeCaida > 50) {
              return ultimoValorValido || valorMesadaAnterior;
            }
          }

          ultimoValorValido = valorMesadaActual;
          valorMesadaAnterior = valorMesadaActual;
        }
      }
    }

    return ultimoValorValido || obtenerPagoEnero(año);
  }, [pagosFinales, obtenerPagoEnero]);

  // Función para contar pagos por año
  const contarPagosAño = useMemo(() => (año) => {
    const pagosAño = pagosFinales.filter(pago => {
      const añoPago = parseInt(pago.año);
      return añoPago === año;
    });

    if (pagosAño.length === 0) return 0;

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

    const pagosOrdenados = pagosAño.sort((a, b) => {
      return obtenerMes(a.periodoPago) - obtenerMes(b.periodoPago);
    });

    let totalMesadas = 0;
    let valorMesadaAnterior = null;

    for (let i = 0; i < pagosOrdenados.length; i++) {
      const pago = pagosOrdenados[i];
      let valorMesadaActual = 0;

      if (pago.detalles && Array.isArray(pago.detalles)) {
        const mesadaDetalle = pago.detalles.find(det => 
          det.nombre?.toLowerCase().includes('mesada pensional') || 
          det.nombre?.toLowerCase().includes('mesada') ||
          det.codigo === 'MESAD'
        );
        if (mesadaDetalle && mesadaDetalle.ingresos > 0) {
          valorMesadaActual = mesadaDetalle.ingresos;
          
          if (valorMesadaAnterior !== null) {
            const porcentajeCaida = ((valorMesadaAnterior - valorMesadaActual) / valorMesadaAnterior) * 100;
            
            if (porcentajeCaida > 50) {
              console.log(`🚨 Caída drástica detectada en ${año}, período "${pago.periodoPago}": ${porcentajeCaida.toFixed(2)}% - CORTANDO CONTEO`);
              break;
            }
          }

          totalMesadas += 1;
          valorMesadaAnterior = valorMesadaActual;
        }

        const mesadaAdicional = pago.detalles.find(det => 
          det.codigo && (
            det.codigo.includes('285') ||
            det.descripcion?.toLowerCase().includes('mesada adicional') ||
            det.descripcion?.toLowerCase().includes('prima') ||
            det.descripcion?.toLowerCase().includes('aguinaldo') ||
            det.nombre?.toLowerCase().includes('mesada adicional') ||
            det.nombre?.toLowerCase().includes('prima') ||
            det.nombre?.toLowerCase().includes('aguinaldo')
          )
        );
        
        if (mesadaAdicional && mesadaAdicional.ingresos > 0) {
          totalMesadas += 1;
        }
      }
    }

    if (totalMesadas === 0 && pagosOrdenados.length > 0) {
      return pagosOrdenados.length;
    }

    return totalMesadas;
  }, [pagosFinales]);

  // Función para obtener IPC del año
  const obtenerIPCAño = useMemo(() => (año) => {
    const añoIPC = año - 1;
    return DATOS_IPC[añoIPC] || 0;
  }, []);

  // Función para obtener datos consolidados de un año específico
  const obtenerDatosAño = useMemo(() => (año) => {
    return DATOS_CONSOLIDADOS[año] || { smlmv: 0, ipc: 0, reajusteSMLMV: 0 };
  }, []);

  return {
    obtenerPagoEnero,
    obtenerValorMesadaValidoAño,
    contarPagosAño,
    obtenerIPCAño,
    obtenerDatosAño
  };
};
