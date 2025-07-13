// Funciones para procesar los datos de pensiones

// Función para deduplicar pagos por año y período exacto
export const deduplicarPagos = (pagos) => {
  console.log(`🔍 Iniciando deduplicación de ${pagos.length} pagos...`);
  
  const pagosUnicos = [];
  const vistosMap = new Map();
  const duplicadosEliminados = [];

  pagos.forEach((pago, index) => {
    // Usar el periodoPago EXACTO como está, sin normalización
    const periodoExacto = pago.periodoPago?.trim() || 'sin-periodo';

    // Obtener el valor de la mesada principal
    let valorMesada = 0;
    if (pago.detalles && Array.isArray(pago.detalles)) {
      const mesadaDetalle = pago.detalles.find(det => 
        det.nombre?.toLowerCase().includes('mesada pensional') || 
        det.nombre?.toLowerCase().includes('mesada') ||
        det.codigo === 'MESAD'
      );
      if (mesadaDetalle) {
        valorMesada = mesadaDetalle.ingresos || 0;
      }
    }

    // Crear clave única basada en año y período EXACTO
    const clave = `${pago.año}-${periodoExacto}`;
    
    if (!vistosMap.has(clave)) {
      vistosMap.set(clave, {
        indice: index,
        año: pago.año,
        periodo: pago.periodoPago,
        valorMesada: valorMesada
      });
      pagosUnicos.push(pago);
      console.log(`✅ Pago único agregado: ${pago.año} - "${periodoExacto}" - $${valorMesada.toLocaleString()}`);
    } else {
      const original = vistosMap.get(clave);
      duplicadosEliminados.push({
        original: `Índice ${original.indice}: ${original.año} - "${original.periodo}" ($${original.valorMesada.toLocaleString()})`,
        duplicado: `Índice ${index}: ${pago.año} - "${pago.periodoPago}" ($${valorMesada.toLocaleString()})`
      });
      console.log(`🔄 DUPLICADO DETECTADO:`);
      console.log(`   Período duplicado: "${periodoExacto}"`);
      console.log(`   Original (mantenido): Índice ${original.indice} - $${original.valorMesada.toLocaleString()}`);
      console.log(`   Duplicado (eliminado): Índice ${index} - $${valorMesada.toLocaleString()}`);
    }
  });

  if (pagos.length !== pagosUnicos.length) {
    console.log(`📊 Deduplicación completada: ${pagos.length} → ${pagosUnicos.length} pagos únicos`);
    console.log(`🗑️ Eliminados ${pagos.length - pagosUnicos.length} duplicados`);
  } else {
    console.log('✅ No se encontraron duplicados - todos los períodos son únicos');
  }

  return pagosUnicos;
};

// Función para obtener el pago de enero de un año específico
export const obtenerPagoEnero = (año, pagosFinales) => {
  const pagosAño = pagosFinales.filter(pago => {
    const añoPago = parseInt(pago.año);
    return añoPago === año;
  });

  if (pagosAño.length === 0) return 0;

  // Buscar específicamente enero
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

  // Si no hay enero específico, tomar el primer pago del año
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
};

// Función para obtener el último valor válido de mesada antes de una caída drástica
export const obtenerValorMesadaValidoAño = (año, pagosFinales) => {
  const pagosAño = pagosFinales.filter(pago => {
    const añoPago = parseInt(pago.año);
    return añoPago === año;
  });

  if (pagosAño.length === 0) return obtenerPagoEnero(año, pagosFinales);

  // Ordenar pagos cronológicamente
  const pagosOrdenados = pagosAño.sort((a, b) => {
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
        
        // Verificar si hay una caída drástica (más del 50%)
        if (valorMesadaAnterior !== null) {
          const porcentajeCaida = ((valorMesadaAnterior - valorMesadaActual) / valorMesadaAnterior) * 100;
          
          if (porcentajeCaida > 50) {
            // Retornar el último valor válido antes de la caída
            return ultimoValorValido || valorMesadaAnterior;
          }
        }

        ultimoValorValido = valorMesadaActual;
        valorMesadaAnterior = valorMesadaActual;
      }
    }
  }

  // Si no hubo caídas drásticas, retornar el último valor encontrado o el pago de enero
  return ultimoValorValido || obtenerPagoEnero(año, pagosFinales);
};

// Función para contar el número de pagos recibidos en un año específico
export const contarPagosAño = (año, pagosFinales) => {
  const pagosAño = pagosFinales.filter(pago => {
    const añoPago = parseInt(pago.año);
    return añoPago === año;
  });

  if (pagosAño.length === 0) return 0;

  // Ordenar pagos cronológicamente para detectar caídas drásticas
  const pagosOrdenados = pagosAño.sort((a, b) => {
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

    return obtenerMes(a.periodoPago) - obtenerMes(b.periodoPago);
  });

  let totalMesadas = 0;
  let valorMesadaAnterior = null;

  for (let i = 0; i < pagosOrdenados.length; i++) {
    const pago = pagosOrdenados[i];
    let valorMesadaActual = 0;

    if (pago.detalles && Array.isArray(pago.detalles)) {
      // Buscar el valor de la mesada
      const mesadaDetalle = pago.detalles.find(det => 
        det.nombre?.toLowerCase().includes('mesada pensional') || 
        det.nombre?.toLowerCase().includes('mesada') ||
        det.codigo === 'MESAD'
      );
      if (mesadaDetalle && mesadaDetalle.ingresos > 0) {
        valorMesadaActual = mesadaDetalle.ingresos;
        
        // Verificar si hay una caída drástica (más del 50%)
        if (valorMesadaAnterior !== null) {
          const porcentajeCaida = ((valorMesadaAnterior - valorMesadaActual) / valorMesadaAnterior) * 100;
          
          // Si la caída es mayor al 50%, DETENER el conteo aquí
          if (porcentajeCaida > 50) {
            console.log(`🚨 Caída drástica detectada en ${año}, período "${pago.periodoPago}": ${porcentajeCaida.toFixed(2)}% - CORTANDO CONTEO`);
            break;
          }
        }

        totalMesadas += 1;
        valorMesadaAnterior = valorMesadaActual;
      }

      // Contar mesadas adicionales solo si no ha habido caída drástica
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

  // Si no hay detalles, usar método de respaldo
  if (totalMesadas === 0 && pagosOrdenados.length > 0) {
    return pagosOrdenados.length;
  }

  return totalMesadas;
};
