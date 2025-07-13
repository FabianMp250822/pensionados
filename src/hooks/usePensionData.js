import { useSelector } from 'react-redux';
import { useMemo } from 'react';

export const usePensionData = () => {
  const { pensiones } = useSelector((state) => state.pensiones);

  // Función para deduplicar pagos por año y período exacto
  const deduplicarPagos = useMemo(() => (pagos) => {
    console.log(`🔍 Iniciando deduplicación de ${pagos.length} pagos...`);
    
    const pagosUnicos = [];
    const vistosMap = new Map();
    const duplicadosEliminados = [];

    pagos.forEach((pago, index) => {
      const periodoExacto = pago.periodoPago?.trim() || 'sin-periodo';

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
  }, []);

  const pensionesUnicas = useMemo(() => deduplicarPagos(pensiones), [pensiones, deduplicarPagos]);
  const pagosFinales = pensiones; // Usar todos los pagos (incluyendo quincenales)

  return {
    pensiones,
    pensionesUnicas,
    pagosFinales
  };
};
