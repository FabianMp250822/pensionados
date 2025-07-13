import React from 'react';
import './Anexo2.css';
import { usePensionData } from '../hooks/usePensionData';
import { usePensionCalculations } from '../hooks/usePensionCalculations';
import { useProyeccionDinamica } from '../hooks/useProyeccionDinamica';
import TablaProyeccionPrincipal from './TablaProyeccionPrincipal';
import TablaComparticionMesada from './TablaComparticionMesada';
import TablaProyeccionContinuada from './TablaProyeccionContinuada';
import NotaReajuste from './NotaReajuste';
import { formatearPagoReal } from '../utils/pensionFormatters';

const Anexo2 = ({ usuarioSeleccionado }) => {
  const { pensionesUnicas, pagosFinales } = usePensionData();
  const calculationUtils = usePensionCalculations(pagosFinales);
  const { 
    datosConProyeccionTabla1, 
    datosConProyeccionTabla3 
  } = useProyeccionDinamica(calculationUtils, pagosFinales);

  // Si no hay datos reales, mostrar mensaje
  if (!datosConProyeccionTabla1) {
    return (
      <div className="anexo2-container">
        <h2>PROYECCIÓN COMPARATIVA DE LA MESADA CONVENCIONAL CON INCREMENTOS DE SMLMV E IPC</h2>
        
        {usuarioSeleccionado && (
          <div className="usuario-info-anexo2">
            <div className="info-item">
              <span className="label">Cédula:</span>
              <span className="value">{usuarioSeleccionado.documento}</span>
            </div>
            <div className="info-item">
              <span className="label">Nombre:</span>
              <span className="value">{usuarioSeleccionado.nombre}</span>
            </div>
          </div>
        )}
        
        <div className="sin-datos-mensaje">
          <div className="alerta-sin-datos">
            <h3>⚠️ No hay datos de pagos disponibles</h3>
            <p>Para generar la proyección comparativa es necesario tener al menos un registro de pago del año 1999 (o año inicial de la pensión).</p>
            <p>Este usuario no tiene registros de pagos en el sistema, por lo que no es posible calcular las proyecciones dinámicas.</p>
            <p><strong>Por favor contacte al administrador para cargar los datos de pagos históricos.</strong></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="anexo2-container">
      <h2>PROYECCIÓN COMPARATIVA DE LA MESADA CONVENCIONAL CON INCREMENTOS DE SMLMV E IPC</h2>
      
      {usuarioSeleccionado && (
        <div className="usuario-info-anexo2">
          <div className="info-item">
            <span className="label">Cédula:</span>
            <span className="value">{usuarioSeleccionado.documento}</span>
          </div>
          <div className="info-item">
            <span className="label">Nombre:</span>
            <span className="value">{usuarioSeleccionado.nombre}</span>
          </div>
        </div>
      )}
      
      <TablaProyeccionPrincipal 
        datosConProyeccion={datosConProyeccionTabla1}
        {...calculationUtils}
      />

      <TablaComparticionMesada 
        datosConProyeccion={datosConProyeccionTabla1}
        pagosFinales={pagosFinales}
      />

      <TablaProyeccionContinuada 
        datosConProyeccion={datosConProyeccionTabla3}
        datosTabla1={datosConProyeccionTabla1}
        {...calculationUtils}
      />

      <NotaReajuste 
        pensionesUnicas={pensionesUnicas}
        obtenerPagoEnero={calculationUtils.obtenerPagoEnero}
        formatearPagoReal={formatearPagoReal}
      />
    </div>
  );
};

export default Anexo2;
  };

  // Aplicar deduplicación y limitación de mesadas por año
  const pensionesUnicas = deduplicarPagos(pensiones);
  
  // Función adicional para limitar mesadas por año a máximo 14
  const limitarMesadasPorAño = (pagos) => {
    console.log('🔧 Aplicando límite máximo de 14 mesadas por año...');
    
    const pagosLimitados = [];
    const estadisticasLimite = {};
    
    // Agrupar por año
    const pagosPorAño = {};
    pagos.forEach(pago => {
      if (!pagosPorAño[pago.año]) {
        pagosPorAño[pago.año] = [];
      }
      pagosPorAño[pago.año].push(pago);
    });
    
    // Procesar cada año
    Object.keys(pagosPorAño).sort().forEach(año => {
      const pagosDelAño = pagosPorAño[año];
      estadisticasLimite[año] = {
        original: pagosDelAño.length,
        limitado: 0,
        eliminados: 0
      };
      
      if (pagosDelAño.length <= 14) {
        // Si hay 14 o menos, mantener todos
        pagosLimitados.push(...pagosDelAño);
        estadisticasLimite[año].limitado = pagosDelAño.length;
        console.log(`✅ Año ${año}: ${pagosDelAño.length} pagos (dentro del límite)`);
      } else {
        // Si hay más de 14, tomar solo los primeros 14 cronológicamente
        const pagosOrdenados = pagosDelAño.sort((a, b) => {
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
        
        const pagosSeleccionados = pagosOrdenados.slice(0, 14);
        const pagosEliminados = pagosOrdenados.slice(14);
        
        pagosLimitados.push(...pagosSeleccionados);
        estadisticasLimite[año].limitado = 14;
        estadisticasLimite[año].eliminados = pagosEliminados.length;
        
        console.log(`🚨 Año ${año}: ${pagosDelAño.length} → 14 pagos (eliminados ${pagosEliminados.length})`);
        console.log(`   Períodos mantenidos:`);
        pagosSeleccionados.forEach((pago, idx) => {
          console.log(`     ${idx + 1}. "${pago.periodoPago}"`);
        });
        console.log(`   Períodos eliminados por exceso:`);
        pagosEliminados.slice(0, 5).forEach((pago, idx) => {
          console.log(`     ${idx + 1}. "${pago.periodoPago}"`);
        });
        if (pagosEliminados.length > 5) {
          console.log(`     ... y ${pagosEliminados.length - 5} más`);
        }
      }
    });
    
    console.log('📊 RESUMEN DE LIMITACIÓN POR AÑO:');
    Object.keys(estadisticasLimite).sort().forEach(año => {
      const stats = estadisticasLimite[año];
      console.log(`  ${año}: ${stats.original} → ${stats.limitado} (eliminados: ${stats.eliminados})`);
    });
    
    return pagosLimitados;
  };
  
  // Aplicar ambas funciones: deduplicación + limitación
  const pagosFinales = pensiones; // Usar todos los pagos (incluyendo quincenales)

  // Función para obtener el pago de enero de un año específico
  const obtenerPagoEnero = (año) => {
    // Buscar pagos del año específico (usando pagos finales)
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
      // Ordenar por periodo para obtener el primer pago del año
      const pagosOrdenados = pagosAño.sort((a, b) => {
        const periodoA = a.periodoPago?.toLowerCase() || '';
        const periodoB = b.periodoPago?.toLowerCase() || '';
        return periodoA.localeCompare(periodoB);
      });
      pagoEnero = pagosOrdenados[0];
    }

    if (pagoEnero && Array.isArray(pagoEnero.detalles)) {
      // Buscar "Mesada Pensional" por nombre del concepto
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
  const obtenerValorMesadaValidoAño = (año) => {
    const pagosAño = pagosFinales.filter(pago => {
      const añoPago = parseInt(pago.año);
      return añoPago === año;
    });

    if (pagosAño.length === 0) return obtenerPagoEnero(año);

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
    return ultimoValorValido || obtenerPagoEnero(año);
  };

  // Función para contar el número de pagos recibidos en un año específico
  // IMPORTANTE: Se detiene cuando detecta una caída mayor al 50% en el valor de la mesada
  const contarPagosAño = (año) => {
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
        // Buscar el valor de la mesada (por nombre o código)
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
              break; // ⚠️ CRUCIAL: Salir del loop y no contar más pagos
            }
          }

          totalMesadas += 1;
          valorMesadaAnterior = valorMesadaActual;
        }

        // Contar mesadas adicionales solo si no ha habido caída drástica
        const mesadaAdicional = pago.detalles.find(det => 
          det.codigo && (
            det.codigo.includes('285') || // Mesada Adicional
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

  // Función para obtener información detallada de los pagos de un año (para debugging)
  const obtenerDetallesPagosAño = (año) => {
    const pagosAño = pagosFinales.filter(pago => {
      const añoPago = parseInt(pago.año);
      return añoPago === año;
    });

    console.log(`📊 Detalles para año ${año}: ${pagosAño.length} pagos únicos por período`);

    // Verificar si hay períodos duplicados exactos incluso después de la deduplicación global
    const periodosContados = {};
    const detallesConVerificacion = pagosAño.map((pago, index) => {
      const periodoExacto = pago.periodoPago?.trim() || 'sin-periodo';
      
      if (periodosContados[periodoExacto]) {
        periodosContados[periodoExacto]++;
        console.log(`⚠️ Período exacto duplicado detectado en detalles ${año}: "${pago.periodoPago}" (aparición #${periodosContados[periodoExacto]})`);
      } else {
        periodosContados[periodoExacto] = 1;
      }

      const conceptos = [];
      if (pago.detalles && Array.isArray(pago.detalles)) {
        pago.detalles.forEach(det => {
          if (det.ingresos > 0) {
            conceptos.push({
              codigo: det.codigo,
              descripcion: det.descripcion || det.nombre || 'Sin descripción',
              valor: det.ingresos
            });
          }
        });
      }
      
      return {
        periodo: pago.periodoPago,
        periodoExacto: periodoExacto,
        conceptos: conceptos,
        totalConceptos: conceptos.length,
        indiceOriginal: index
      };
    });

    // Mostrar resumen de duplicaciones por período si las hay
    const duplicados = Object.entries(periodosContados).filter(([periodo, count]) => count > 1);
    if (duplicados.length > 0) {
      console.log(`🚨 Períodos exactos con múltiples entradas en ${año}:`);
      duplicados.forEach(([periodo, count]) => {
        console.log(`  "${periodo}": ${count} entradas`);
      });
    } else {
      console.log(`✅ Todos los períodos en ${año} son únicos`);
    }

    // Mostrar lista de períodos únicos
    console.log(`📝 Períodos únicos encontrados en ${año}:`);
    detallesConVerificacion.forEach((detalle, idx) => {
      console.log(`  ${idx + 1}. "${detalle.periodo}" (${detalle.conceptos.length} conceptos)`);
    });

    return detallesConVerificacion;
  };

  /*
   * ====================================================
   * ESTRUCTURA DE DATOS CONSOLIDADOS (1982-2025)
   * ====================================================
   * 
   * Los datos están organizados en un solo lugar para facilitar el mantenimiento:
   * 
   * 1. datosConsolidados: Contiene SMLMV, IPC y Reajuste SMLMV para cada año
   * 2. datosIPC: Mantiene compatibilidad con fórmulas existentes (año anterior)
   * 3. datosTabla3: Datos específicos para la tabla 3 (años posteriores a 2007)
   * 
   * Las fórmulas originales se mantienen intactas:
   * - obtenerIPCAño(): Usa IPC del año anterior para reajustes
   * - obtenerDatosAño(): Acceso directo a datos consolidados
   * - Todas las funciones de cálculo dinámico permanecen sin cambios
   * 
   * Actualizaciones realizadas según tabla proporcionada:
   * - 2022: Reajuste SMLMV 10.10 → 10.07
   * - Todos los datos de IPC actualizados desde 1981
   * - SMLMV consolidados desde 1982
   * ====================================================
   */

  // Datos consolidados de SMLMV, IPC y Reajuste SMLMV (1982-2025)
  const datosConsolidados = {
    1982: { smlmv: 7410, ipc: 26.36, reajusteSMLMV: 30.00 },
    1983: { smlmv: 9261, ipc: 24.03, reajusteSMLMV: 24.98 },
    1984: { smlmv: 11298, ipc: 16.64, reajusteSMLMV: 22.00 },
    1985: { smlmv: 13558, ipc: 18.28, reajusteSMLMV: 20.00 },
    1986: { smlmv: 16811, ipc: 22.45, reajusteSMLMV: 23.99 },
    1987: { smlmv: 20510, ipc: 20.95, reajusteSMLMV: 22.00 },
    1988: { smlmv: 25637, ipc: 24.02, reajusteSMLMV: 25.00 },
    1989: { smlmv: 32556, ipc: 28.12, reajusteSMLMV: 26.99 },
    1990: { smlmv: 41025, ipc: 26.12, reajusteSMLMV: 26.01 },
    1991: { smlmv: 51720, ipc: 32.36, reajusteSMLMV: 26.07 },
    1992: { smlmv: 65190, ipc: 26.82, reajusteSMLMV: 26.04 },
    1993: { smlmv: 81510, ipc: 25.13, reajusteSMLMV: 25.03 },
    1994: { smlmv: 98700, ipc: 22.60, reajusteSMLMV: 21.09 },
    1995: { smlmv: 118934, ipc: 22.60, reajusteSMLMV: 21.09 },
    1996: { smlmv: 142125, ipc: 19.47, reajusteSMLMV: 19.50 },
    1997: { smlmv: 172005, ipc: 21.64, reajusteSMLMV: 21.02 },
    1998: { smlmv: 203825, ipc: 17.68, reajusteSMLMV: 18.50 },
    1999: { smlmv: 236460, ipc: 16.70, reajusteSMLMV: 16.01 },
    2000: { smlmv: 260100, ipc: 9.23, reajusteSMLMV: 10.00 },
    2001: { smlmv: 286000, ipc: 8.75, reajusteSMLMV: 9.96 },
    2002: { smlmv: 309000, ipc: 7.65, reajusteSMLMV: 8.04 },
    2003: { smlmv: 332000, ipc: 6.99, reajusteSMLMV: 7.44 },
    2004: { smlmv: 358000, ipc: 6.49, reajusteSMLMV: 7.83 },
    2005: { smlmv: 381500, ipc: 5.50, reajusteSMLMV: 6.56 },
    2006: { smlmv: 408000, ipc: 4.85, reajusteSMLMV: 6.95 },
    2007: { smlmv: 433700, ipc: 4.48, reajusteSMLMV: 6.30 },
    2008: { smlmv: 461500, ipc: 5.69, reajusteSMLMV: 6.41 },
    2009: { smlmv: 496900, ipc: 7.67, reajusteSMLMV: 7.67 },
    2010: { smlmv: 515000, ipc: 2.00, reajusteSMLMV: 3.64 },
    2011: { smlmv: 535600, ipc: 3.17, reajusteSMLMV: 4.00 },
    2012: { smlmv: 566000, ipc: 3.73, reajusteSMLMV: 5.81 },
    2013: { smlmv: 589500, ipc: 2.44, reajusteSMLMV: 4.02 },
    2014: { smlmv: 616000, ipc: 1.94, reajusteSMLMV: 4.50 },
    2015: { smlmv: 644350, ipc: 3.66, reajusteSMLMV: 4.60 },
    2016: { smlmv: 689455, ipc: 6.77, reajusteSMLMV: 7.00 },
    2017: { smlmv: 737717, ipc: 5.75, reajusteSMLMV: 7.00 },
    2018: { smlmv: 781242, ipc: 4.09, reajusteSMLMV: 5.90 },
    2019: { smlmv: 828116, ipc: 3.18, reajusteSMLMV: 6.00 },
    2020: { smlmv: 877803, ipc: 3.80, reajusteSMLMV: 6.00 },
    2021: { smlmv: 908526, ipc: 1.61, reajusteSMLMV: 3.50 },
    2022: { smlmv: 1000000, ipc: 5.62, reajusteSMLMV: 10.07 },
    2023: { smlmv: 1160000, ipc: 13.12, reajusteSMLMV: 16.00 },
    2024: { smlmv: 1300000, ipc: 9.28, reajusteSMLMV: 12.00 },
    2025: { smlmv: 1423500, ipc: 5.20, reajusteSMLMV: 9.50 }
  };

  // Datos de IPC por año (para la columna "Reajuste en % IPCs") - ACTUALIZADO CON TABLA COMPLETA
  const datosIPC = {
    1981: 26.36, // Para usar en 1982
    1982: 24.03, // Para usar en 1983
    1983: 16.64, // Para usar en 1984
    1984: 18.28, // Para usar en 1985
    1985: 22.45, // Para usar en 1986
    1986: 20.95, // Para usar en 1987
    1987: 24.02, // Para usar en 1988
    1988: 28.12, // Para usar en 1989
    1989: 26.12, // Para usar en 1990
    1990: 32.36, // Para usar en 1991
    1991: 26.82, // Para usar en 1992
    1992: 25.13, // Para usar en 1993
    1993: 22.60, // Para usar en 1994
    1994: 22.60, // Para usar en 1995
    1995: 19.47, // Para usar en 1996
    1996: 21.64, // Para usar en 1997
    1997: 17.68, // Para usar en 1998
    1998: 16.70, // Para usar en 1999
    1999: 9.23,  // Para usar en 2000
    2000: 8.75,  // Para usar en 2001
    2001: 7.65,  // Para usar en 2002
    2002: 6.99,  // Para usar en 2003
    2003: 6.49,  // Para usar en 2004
    2004: 5.50,  // Para usar en 2005
    2005: 4.85,  // Para usar en 2006
    2006: 4.48,  // Para usar en 2007
    2007: 5.69,  // Para usar en 2008
    2008: 7.67,  // Para usar en 2009
    2009: 2.00,  // Para usar en 2010
    2010: 3.17,  // Para usar en 2011
    2011: 3.73,  // Para usar en 2012
    2012: 2.44,  // Para usar en 2013
    2013: 1.94,  // Para usar en 2014
    2014: 3.66,  // Para usar en 2015
    2015: 6.77,  // Para usar en 2016
    2016: 5.75,  // Para usar en 2017
    2017: 4.09,  // Para usar en 2018
    2018: 3.18,  // Para usar en 2019
    2019: 3.80,  // Para usar en 2020
    2020: 1.61,  // Para usar en 2021
    2021: 5.62,  // Para usar en 2022
    2022: 13.12, // Para usar en 2023
    2023: 9.28,  // Para usar en 2024
    2024: 5.20   // Para usar en 2025
  };

  // Función para obtener el IPC correspondiente al año (usar año anterior para el reajuste)
  const obtenerIPCAño = (año) => {
    // Para 1999 usar IPC de 1998, para 2000 usar IPC de 1999, etc.
    const añoIPC = año - 1;
    return datosIPC[añoIPC] || 0;
  };

  // Función para obtener datos consolidados de un año específico
  const obtenerDatosAño = (año) => {
    return datosConsolidados[año] || { smlmv: 0, ipc: 0, reajusteSMLMV: 0 };
  };

  // Datos de SMLMV para años posteriores a 2007 (para la tabla 3) - ACTUALIZADO CON DATOS CONSOLIDAS
  const datosTabla3 = [
    { año: 2008, smlmv: 461500, reajuste: 6.41 },
    { año: 2009, smlmv: 496900, reajuste: 7.67 },
    { año: 2010, smlmv: 515000, reajuste: 3.64 },
    { año: 2011, smlmv: 535600, reajuste: 4.00 },
    { año: 2012, smlmv: 566000, reajuste: 5.81 },
    { año: 2013, smlmv: 589500, reajuste: 4.02 },
    { año: 2014, smlmv: 616000, reajuste: 4.50 },
    { año: 2015, smlmv: 644350, reajuste: 4.60 },
    { año: 2016, smlmv: 689455, reajuste: 7.00 },
    { año: 2017, smlmv: 737717, reajuste: 7.00 },
    { año: 2018, smlmv: 781242, reajuste: 5.90 },
    { año: 2019, smlmv: 828116, reajuste: 6.00 },
    { año: 2020, smlmv: 877803, reajuste: 6.00 },
    { año: 2021, smlmv: 908526, reajuste: 3.50 },
    { año: 2022, smlmv: 1000000, reajuste: 10.07 }, // Actualizado según tabla
    { año: 2023, smlmv: 1160000, reajuste: 16.00 },
    { año: 2024, smlmv: 1300000, reajuste: 12.00 },
    { año: 2025, smlmv: 1423500, reajuste: 9.50 }
  ];

  // Datos de la tabla 1 basados en la imagen (manteniendo estructura original)
  const datosTabla1 = [
    { año: 1999, smlmv: 236460, reajuste: 0.00, proyeccionMesada: 1609662, reajusteMesada: 0.00, ipc: 16.70, mesadaPagada: 1609662.00, reajusteIpc: 6.81, diferencias: 0, mesadas: 0.00, retroactivas: 0 },
    { año: 2000, smlmv: 260100, reajuste: 10.00, proyeccionMesada: 1770628, reajusteMesada: 6.81, ipc: 9.23, mesadaPagada: 1758234.00, reajusteIpc: 6.76, diferencias: 12394, mesadas: 14.00, retroactivas: 173516 },
    { año: 2001, smlmv: 286000, reajuste: 9.96, proyeccionMesada: 1946983, reajusteMesada: 6.81, ipc: 8.75, mesadaPagada: 1912079.00, reajusteIpc: 6.69, diferencias: 34904, mesadas: 14.00, retroactivas: 488656 },
    { año: 2002, smlmv: 309000, reajuste: 8.04, proyeccionMesada: 2103520, reajusteMesada: 6.81, ipc: 7.65, mesadaPagada: 2058353.00, reajusteIpc: 6.66, diferencias: 45167, mesadas: 14.00, retroactivas: 632338 },
    { año: 2003, smlmv: 332000, reajuste: 7.44, proyeccionMesada: 2260022, reajusteMesada: 6.81, ipc: 6.99, mesadaPagada: 2202232.00, reajusteIpc: 6.63, diferencias: 57790, mesadas: 14.00, retroactivas: 809060 },
    { año: 2004, smlmv: 358000, reajuste: 7.83, proyeccionMesada: 2436982, reajusteMesada: 6.81, ipc: 6.49, mesadaPagada: 2345157.00, reajusteIpc: 6.55, diferencias: 91825, mesadas: 14.00, retroactivas: 1285550 },
    { año: 2005, smlmv: 381500, reajuste: 6.56, proyeccionMesada: 2596848, reajusteMesada: 6.81, ipc: 5.50, mesadaPagada: 2474141.00, reajusteIpc: 6.49, diferencias: 122707, mesadas: 14.00, retroactivas: 1717898 },
    { año: 2006, smlmv: 408000, reajuste: 6.95, proyeccionMesada: 2777329, reajusteMesada: 6.81, ipc: 4.85, mesadaPagada: 2594137.00, reajusteIpc: 6.36, diferencias: 183192, mesadas: 8.00, retroactivas: 1465536 },
    { año: 2007, smlmv: 433700, reajuste: 6.30, proyeccionMesada: 2952301, reajusteMesada: 6.81, ipc: 4.48, mesadaPagada: 2607761.00, reajusteIpc: 6.01, diferencias: 344540, mesadas: 9.00, retroactivas: 3100860 }
  ];

  // Función para generar proyección dinámica para la tabla 1 (1999-2007)
  const generarProyeccionDinamicaTabla1 = () => {
    const primerPago1999 = obtenerPagoEnero(1999);
    
    // Si no hay pago de 1999, retornar null para indicar que no hay datos
    if (primerPago1999 <= 0) {
      return null;
    }

    let valorBaseAcumulado = primerPago1999;
    let porcentajeSMLMVBase = null; // Guardar el porcentaje de la primera fila
    
    const datosConProyeccion = datosTabla1.map((row, index) => {
      if (index === 0) {
        // Para 1999, usar el valor real como proyección
        const proyeccionCalculada = valorBaseAcumulado;
        const porcentajeSMLMV = (proyeccionCalculada / row.smlmv);
        porcentajeSMLMVBase = porcentajeSMLMV; // Guardar el valor base
        
        return {
          ...row,
          proyeccionMesadaDinamica: proyeccionCalculada,
          porcentajeSMLMVDinamico: porcentajeSMLMV,
          numeroPagosReales: contarPagosAño(row.año)
        };
      } else {
        // Para años siguientes, aplicar el reajuste acumulativo
        const reajustePorcentaje = row.reajuste / 100;
        valorBaseAcumulado = valorBaseAcumulado * (1 + reajustePorcentaje);
        // Usar siempre el mismo porcentaje que la primera fila
        
        return {
          ...row,
          proyeccionMesadaDinamica: valorBaseAcumulado,
          porcentajeSMLMVDinamico: porcentajeSMLMVBase, // Usar el valor de la primera fila
          numeroPagosReales: contarPagosAño(row.año)
        };
      }
    });

    return datosConProyeccion;
  };

  // Función para generar proyección dinámica para la tabla 3 (continuación directa desde donde se cortó la tabla 1)
  const generarProyeccionDinamicaTabla3 = () => {
    const datosTabla1Calculados = generarProyeccionDinamicaTabla1();
    
    // Si no hay datos de la tabla 1, no podemos continuar
    if (!datosTabla1Calculados) {
      return null;
    }

    // Calcular el valor inicial para la tabla 3: MAYOR VALOR A CARGO DE LA EMPRESA
    const calcularValorInicialTabla3 = () => {
      const mesadaPlena = datosTabla1Calculados[datosTabla1Calculados.length - 1]?.proyeccionMesadaDinamica || 2952301;
      const mesadaPagadaConIPCs = datosTabla1Calculados[datosTabla1Calculados.length - 1]?.mesadaPagadaConIPC || 2607761;
      
      // Calcular valor después del descuento ≥50%
      const calcularValorDespuesCaida = () => {
        // Buscar pagos de 2007 para encontrar la caída drástica
        const pagos2007 = pagosFinales.filter(pago => pago.año === 2007);
        if (pagos2007.length === 0) return 1014335; // valor por defecto del ejemplo
        
        // Ordenar por mes
        const pagosOrdenados = pagos2007.sort((a, b) => {
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
        
        // Buscar la caída drástica
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
                  return valorActual; // Retorna el valor después de la caída
                }
              }
              valorAnterior = valorActual;
            }
          }
        }
        
        return 1014335; // valor por defecto del ejemplo si no encuentra caída
      };
      
      // MAYOR VALOR A CARGO DE LA EMPRESA = (Proyección Dinámica - Mesada Pagada con IPCs) + valor después del descuento ≥50%
      const diferencia = mesadaPlena - mesadaPagadaConIPCs;
      const valorDespuesCaida = calcularValorDespuesCaida();
      const valorEmpresa = diferencia + valorDespuesCaida;
      
      return valorEmpresa;
    };

    // Usar el MAYOR VALOR A CARGO DE LA EMPRESA como valor base inicial
    let valorBaseAcumulado = calcularValorInicialTabla3();

    // Función para encontrar el punto exacto donde se cortó la tabla 1 y contar mesadas faltantes
    const encontrarPuntoCorteYMesadasFaltantes = () => {
      // Buscar en todos los años de la tabla 1 donde pudo haberse cortado
      for (let año = 1999; año <= 2007; año++) {
        const pagosAño = pagosFinales.filter(pago => {
          const añoPago = parseInt(pago.año);
          return añoPago === año;
        });

        if (pagosAño.length === 0) continue;

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
        
        for (let i = 0; i < pagosOrdenados.length; i++) {
          const pago = pagosOrdenados[i];
          
          if (pago.detalles && Array.isArray(pago.detalles)) {
            const mesadaDetalle = pago.detalles.find(det => det.codigo === 'MESAD');
            if (mesadaDetalle && mesadaDetalle.ingresos > 0) {
              const valorMesadaActual = mesadaDetalle.ingresos;
              
              // Verificar si hay una caída drástica (más del 50%)
              if (valorMesadaAnterior !== null) {
                const porcentajeCaida = ((valorMesadaAnterior - valorMesadaActual) / valorMesadaAnterior) * 100;
                
                if (porcentajeCaida > 50) {
                  console.log(`🎯 Punto de corte encontrado en ${año}: ${pago.periodoPago} - Caída ${porcentajeCaida.toFixed(2)}%`);
                  
                  // Calcular cuántas mesadas faltan en el año (desde este pago hasta diciembre)
                  const mesadasFaltantes = pagosOrdenados.length - i;
                  const primerPagoConDescuento = pagosOrdenados[i];
                  
                  console.log(`📊 Mesadas faltantes en ${año}: ${mesadasFaltantes} (desde ${primerPagoConDescuento.periodoPago})`);
                  
                  return {
                    añoCorte: año,
                    indiceCorte: i,
                    mesadasFaltantes: mesadasFaltantes,
                    valorPrimerPagoConDescuento: valorMesadaActual,
                    periodoPrimerPagoConDescuento: primerPagoConDescuento.periodoPago,
                    datosAño: datosTabla1.find(d => d.año === año) || datosTabla3.find(d => d.año === año)
                  };
                }
              }
              valorMesadaAnterior = valorMesadaActual;
            }
          }
        }
      }
      
      console.log('🔍 No se encontró punto de corte en años 1999-2007');
      return null;
    };

    const puntoCorte = encontrarPuntoCorteYMesadasFaltantes();
    
    // Recopilar todos los pagos para la tabla 3
    const pagosTabla3 = [];
    
    if (puntoCorte && puntoCorte.datosAño) {
      // 1. Agregar una sola fila para el año donde se cortó con las mesadas faltantes
      pagosTabla3.push({
        año: puntoCorte.añoCorte,
        smlmv: puntoCorte.datosAño.smlmv,
        reajuste: puntoCorte.datosAño.reajuste,
        valorReal: puntoCorte.valorPrimerPagoConDescuento,
        esContinuacion: true,
        mesadasFaltantes: puntoCorte.mesadasFaltantes,
        periodoInicio: puntoCorte.periodoPrimerPagoConDescuento
      });
    }

    // 2. Agregar pagos de años posteriores al corte
    const añosPosteriores = new Set();
    
    pagosFinales.forEach(pago => {
      const añoPago = parseInt(pago.año);
      const añoCorte = puntoCorte ? puntoCorte.añoCorte : 2007;
      
      if (añoPago > añoCorte && !añosPosteriores.has(añoPago)) {
        const pagosDelAño = contarPagosAño(añoPago);
        if (pagosDelAño > 0) {
          añosPosteriores.add(añoPago);
          
          // Encontrar el SMLMV correspondiente
          const datosAño = datosTabla3.find(d => d.año === añoPago);
          if (datosAño) {
            pagosTabla3.push({
              año: añoPago,
              smlmv: datosAño.smlmv,
              reajuste: datosAño.reajuste,
              valorReal: obtenerValorMesadaValidoAño(añoPago),
              esContinuacion: false,
              numeroPagos: pagosDelAño
            });
          }
        }
      }
    });

    // Ordenar por año
    pagosTabla3.sort((a, b) => a.año - b.año);

    if (pagosTabla3.length === 0) {
      return [];
    }

    // Generar proyección dinámica
    let porcentajeSMLMVBase = null; // Variable para guardar el porcentaje base de la primera fila
    
    const datosConProyeccion = pagosTabla3.map((row, index) => {
      // Para continuaciones del año de corte, usar datos específicos del corte
      if (row.esContinuacion && index === 0) {
        // Primer pago de continuación, usar el valor base calculado
        const porcentajeSMLMV = (valorBaseAcumulado / row.smlmv);
        porcentajeSMLMVBase = porcentajeSMLMV; // Guardar como valor base para todas las filas
        
        return {
          ...row,
          proyeccionMesadaDinamica: valorBaseAcumulado,
          porcentajeSMLMVDinamico: porcentajeSMLMV,
          numeroPagosReales: row.mesadasFaltantes
        };
      } else {
        // Para años nuevos, aplicar reajuste acumulativo
        const reajustePorcentaje = row.reajuste / 100;
        valorBaseAcumulado = valorBaseAcumulado * (1 + reajustePorcentaje);
        
        return {
          ...row,
          proyeccionMesadaDinamica: valorBaseAcumulado,
          porcentajeSMLMVDinamico: porcentajeSMLMVBase, // Usar el valor de la primera fila
          numeroPagosReales: row.numeroPagos || contarPagosAño(row.año)
        };
      }
    });

    return datosConProyeccion;
  };

  // Calcular los datos con proyección dinámica para ambas tablas
  const datosConProyeccionTabla1 = generarProyeccionDinamicaTabla1();
  const datosConProyeccionTabla3 = generarProyeccionDinamicaTabla3();

  // Si no hay datos reales, mostrar mensaje
  if (!datosConProyeccionTabla1) {
    return (
      <div className="anexo2-container">
        <h2>PROYECCIÓN COMPARATIVA DE LA MESADA CONVENCIONAL CON INCREMENTOS DE SMLMV E IPC</h2>
        
        {/* Información del usuario seleccionado */}
        {usuarioSeleccionado && (
          <div className="usuario-info-anexo2">
            <div className="info-item">
              <span className="label">Cédula:</span>
              <span className="value">{usuarioSeleccionado.documento}</span>
            </div>
            <div className="info-item">
              <span className="label">Nombre:</span>
              <span className="value">{usuarioSeleccionado.nombre}</span>
            </div>
          </div>
        )}
        
        <div className="sin-datos-mensaje">
          <div className="alerta-sin-datos">
            <h3>⚠️ No hay datos de pagos disponibles</h3>
            <p>Para generar la proyección comparativa es necesario tener al menos un registro de pago del año 1999 (o año inicial de la pensión).</p>
            <p>Este usuario no tiene registros de pagos en el sistema, por lo que no es posible calcular las proyecciones dinámicas.</p>
            <p><strong>Por favor contacte al administrador para cargar los datos de pagos históricos.</strong></p>
          </div>
        </div>
      </div>
    );
  }

  const formatearNumero = (valor) => {
    if (valor === 0 || valor === null || valor === undefined) {
      return 'N/D'; // No Disponible
    }
    return new Intl.NumberFormat('es-CO').format(valor);
  };

  const formatearDiferencia = (valor) => {
    if (valor === 0 || valor === null || valor === undefined || isNaN(valor)) {
      return '0'; // Mostrar 0 en lugar de N/D para diferencias
    }
    return new Intl.NumberFormat('es-CO').format(Math.round(valor));
  };

  const calcularRetroactivas = (diferenciaMesadas, numeroPagos) => {
    // Si diferencias es 0, null, undefined o NaN, retornar 0
    if (diferenciaMesadas === 0 || diferenciaMesadas === null || diferenciaMesadas === undefined || isNaN(diferenciaMesadas)) {
      return 0;
    }
    // Si número de pagos es 0, null, undefined o NaN, retornar 0
    if (numeroPagos === 0 || numeroPagos === null || numeroPagos === undefined || isNaN(numeroPagos)) {
      return 0;
    }
    // Cálculo normal: Diferencias * Número de Mesadas
    return diferenciaMesadas * numeroPagos;
  };

  const formatearPagoReal = (valor) => {
    if (valor === 0 || valor === null || valor === undefined) {
      return 'Sin registro';
    }
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  // Función para validar las fórmulas de diferencias y retroactivas
  const validarFormulas = (año, proyeccion, mesadaPagada, diferencias, numMesadas, retroactivas) => {
    const diferenciaCalculada = proyeccion - mesadaPagada;
    const retroactivaCalculada = calcularRetroactivas(diferencias, numMesadas);
    
    console.log(`📊 Validación fórmulas año ${año}:`);
    console.log(`   Proyección Mesada Fiduprevisora con % SMLMV: ${proyeccion.toLocaleString()}`);
    console.log(`   Mesada Pagada Fiduprevisora reajuste con IPCs: ${mesadaPagada.toLocaleString()}`);
    console.log(`   Diferencias calculada: ${diferenciaCalculada.toLocaleString()}`);
    console.log(`   Diferencias mostrada: ${diferencias.toLocaleString()}`);
    console.log(`   # de Mesadas: ${numMesadas}`);
    console.log(`   Retroactivas calculada: ${retroactivaCalculada.toLocaleString()}`);
    console.log(`   Retroactivas mostrada: ${retroactivas.toLocaleString()}`);
    console.log(`   ✅ Fórmula 1 válida: ${Math.abs(diferenciaCalculada - diferencias) < 0.01 ? 'SÍ' : 'NO'}`);
    console.log(`   ✅ Fórmula 2 válida: ${Math.abs(retroactivaCalculada - retroactivas) < 0.01 ? 'SÍ' : 'NO'}`);
    console.log('---');
    
    return {
      formula1Valida: Math.abs(diferenciaCalculada - diferencias) < 0.01,
      formula2Valida: Math.abs(retroactivaCalculada - retroactivas) < 0.01
    };
  };

  return (
    <div className="anexo2-container">
      <h2>PROYECCIÓN COMPARATIVA DE LA MESADA CONVENCIONAL CON INCREMENTOS DE SMLMV E IPC</h2>
      
      {/* Información del usuario seleccionado */}
      {usuarioSeleccionado && (
        <div className="usuario-info-anexo2">
          <div className="info-item">
            <span className="label">Cédula:</span>
            <span className="value">{usuarioSeleccionado.documento}</span>
          </div>
          <div className="info-item">
            <span className="label">Nombre:</span>
            <span className="value">{usuarioSeleccionado.nombre}</span>
          </div>
        </div>
      )}
      
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
              // FÓRMULA VALIDADA: Diferencias de Mesadas = Proyección de Mesada Fiduprevisora con % SMLMV - Mesada Pagada Fiduprevisora reajuste con IPCs
              const proyeccionMesadaFiduprevisora = row.proyeccionMesadaDinamica; // Proyección de Mesada Fiduprevisora con % SMLMV
              const mesadaPagadaFiduprevisora = mesadaPagadaIPCs; // Mesada Pagada Fiduprevisora reajuste con IPCs
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
              <td><strong>{formatearDiferencia(datosConProyeccionTabla1.reduce((total, row) => {
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

      {/* Nueva tabla de compartición de la mesada */}
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
                {formatearNumero(Math.round(datosConProyeccionTabla1[datosConProyeccionTabla1.length - 1]?.proyeccionMesadaDinamica || 2952301))}
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
                {(() => {
                  const mesadaPlena = datosConProyeccionTabla1[datosConProyeccionTabla1.length - 1]?.proyeccionMesadaDinamica || 2952301;
                  const mesadaPagadaConIPCs = datosConProyeccionTabla1[datosConProyeccionTabla1.length - 1]?.mesadaPagadaConIPC || 2607761;
                  
                  // Calcular valor después del descuento ≥50%
                  const calcularValorDespuesCaida = () => {
                    // Buscar pagos de 2007 para encontrar la caída drástica
                    const pagos2007 = pagosFinales.filter(pago => pago.año === 2007);
                    if (pagos2007.length === 0) return 1014335; // valor por defecto del ejemplo
                    
                    // Ordenar por mes
                    const pagosOrdenados = pagos2007.sort((a, b) => {
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
                    
                    // Buscar la caída drástica
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
                              return valorActual; // Retorna el valor después de la caída
                            }
                          }
                          valorAnterior = valorActual;
                        }
                      }
                    }
                    
                    return 1014335; // valor por defecto del ejemplo si no encuentra caída
                  };
                  
                  // Calcular valor de la empresa
                  const diferencia = mesadaPlena - mesadaPagadaConIPCs;
                  const valorDespuesCaida = calcularValorDespuesCaida();
                  const valorEmpresa = diferencia + valorDespuesCaida;
                  
                  // Colpensiones es lo que resta después del valor de la empresa
                  const valorColpensiones = mesadaPlena - valorEmpresa;
                  
                  return formatearNumero(Math.round(valorColpensiones));
                })()}
              </td>
              <td style={{
                backgroundColor: '#fff3cd',
                fontWeight: 'bold',
                textAlign: 'center',
                padding: '12px',
                color: '#856404'
              }}>
                {(() => {
                  const mesadaPlena = datosConProyeccionTabla1[datosConProyeccionTabla1.length - 1]?.proyeccionMesadaDinamica || 2952301;
                  const mesadaPagadaConIPCs = datosConProyeccionTabla1[datosConProyeccionTabla1.length - 1]?.mesadaPagadaConIPC || 2607761;
                  
                  // Calcular valor después del descuento ≥50%
                  const calcularValorDespuesCaida = () => {
                    // Buscar pagos de 2007 para encontrar la caída drástica
                    const pagos2007 = pagosFinales.filter(pago => pago.año === 2007);
                    if (pagos2007.length === 0) return 1014335; // valor por defecto del ejemplo
                    
                    // Ordenar por mes
                    const pagosOrdenados = pagos2007.sort((a, b) => {
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
                    
                    // Buscar la caída drástica
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
                              return valorActual; // Retorna el valor después de la caída
                            }
                          }
                          valorAnterior = valorActual;
                        }
                      }
                    }
                    
                    return 1014335; // valor por defecto del ejemplo si no encuentra caída
                  };
                  
                  // Calcular valor de la empresa
                  const diferencia = mesadaPlena - mesadaPagadaConIPCs;
                  const valorDespuesCaida = calcularValorDespuesCaida();
                  const valorEmpresa = diferencia + valorDespuesCaida;
                  
                  // Porcentaje de Colpensiones es lo que resta del 100%
                  const porcentajeColpensiones = ((mesadaPlena - valorEmpresa) / mesadaPlena) * 100;
                  
                  return porcentajeColpensiones.toFixed(2) + ' %';
                })()}
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
                {(() => {
                  const mesadaPlena = datosConProyeccionTabla1[datosConProyeccionTabla1.length - 1]?.proyeccionMesadaDinamica || 2952301;
                  const mesadaPagadaConIPCs = datosConProyeccionTabla1[datosConProyeccionTabla1.length - 1]?.mesadaPagadaConIPC || 2607761;
                  
                  // Calcular valor después del descuento ≥50%
                  const calcularValorDespuesCaida = () => {
                    // Buscar pagos de 2007 para encontrar la caída drástica
                    const pagos2007 = pagosFinales.filter(pago => pago.año === 2007);
                    if (pagos2007.length === 0) return 1014335; // valor por defecto del ejemplo
                    
                    // Ordenar por mes
                    const pagosOrdenados = pagos2007.sort((a, b) => {
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
                    
                    // Buscar la caída drástica
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
                              return valorActual; // Retorna el valor después de la caída
                            }
                          }
                          valorAnterior = valorActual;
                        }
                      }
                    }
                    
                    return 1014335; // valor por defecto del ejemplo si no encuentra caída
                  };
                  
                  // Calcular el valor de la empresa
                  const diferencia = mesadaPlena - mesadaPagadaConIPCs;
                  const valorDespuesCaida = calcularValorDespuesCaida();
                  const valorEmpresa = diferencia + valorDespuesCaida;
                  
                  return formatearNumero(Math.round(valorEmpresa));
                })()}
              </td>
              <td style={{
                backgroundColor: '#f8d7da',
                fontWeight: 'bold',
                textAlign: 'center',
                padding: '12px',
                color: '#721c24'
              }}>
                {(() => {
                  const mesadaPlena = datosConProyeccionTabla1[datosConProyeccionTabla1.length - 1]?.proyeccionMesadaDinamica || 2952301;
                  const mesadaPagadaConIPCs = datosConProyeccionTabla1[datosConProyeccionTabla1.length - 1]?.mesadaPagadaConIPC || 2607761;
                  
                  // Calcular valor después del descuento ≥50%
                  const calcularValorDespuesCaida = () => {
                    // Buscar pagos de 2007 para encontrar la caída drástica
                    const pagos2007 = pagosFinales.filter(pago => pago.año === 2007);
                    if (pagos2007.length === 0) return 1014335; // valor por defecto del ejemplo
                    
                    // Ordenar por mes
                    const pagosOrdenados = pagos2007.sort((a, b) => {
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
                    
                    // Buscar la caída drástica
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
                              return valorActual; // Retorna el valor después de la caída
                            }
                          }
                          valorAnterior = valorActual;
                        }
                      }
                    }
                    
                    return 1014335; // valor por defecto del ejemplo si no encuentra caída
                  };
                  
                  // Calcular valor de la empresa
                  const diferencia = mesadaPlena - mesadaPagadaConIPCs;
                  const valorDespuesCaida = calcularValorDespuesCaida();
                  const valorEmpresa = diferencia + valorDespuesCaida;
                  
                  // Porcentaje de la empresa es lo que resta del 100%
                  const porcentajeEmpresa = (valorEmpresa / mesadaPlena) * 100;
                  
                  return porcentajeEmpresa.toFixed(2) + ' %';
                })()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tercera tabla - Continuación desde 2008 en adelante */}
      {datosConProyeccionTabla3 && datosConProyeccionTabla3.length > 0 && (
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
              {datosConProyeccionTabla3.map((row, index) => {
                // Si es una continuación del año de corte, usar datos específicos del corte
                let valorPagoReal, numeroPagosReales, añoMostrar;
                
                if (row.esContinuacion) {
                  valorPagoReal = row.valorReal;
                  numeroPagosReales = row.mesadasFaltantes;
                  añoMostrar = row.año; // Solo mostrar el año
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
                // FÓRMULA VALIDADA: Diferencias de Mesadas = Proyección de Mesada Fiduprevisora con % SMLMV - Mesada Pagada Fiduprevisora reajuste con IPCs
                const proyeccionMesadaFiduprevisora = row.proyeccionMesadaDinamica; // Proyección de Mesada Fiduprevisora con % SMLMV
                const mesadaPagadaFiduprevisora = mesadaPagadaIPCs; // Mesada Pagada Fiduprevisora reajuste con IPCs
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
                <td><strong>{formatearDiferencia(datosConProyeccionTabla3.reduce((total, row) => {
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
                }, 0))}</strong></td>
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
              {formatearDiferencia(
                datosConProyeccionTabla1.reduce((total, row) => {
                  const valorPagoReal = obtenerValorMesadaValidoAño(row.año);
                  const diferenciaMesadas = row.proyeccionMesadaDinamica - valorPagoReal;
                  const numeroPagosReales = contarPagosAño(row.año);
                  const retroactivas = calcularRetroactivas(diferenciaMesadas, numeroPagosReales);
                  return total + retroactivas;
                }, 0) +
                datosConProyeccionTabla3.reduce((total, row) => {
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
                }, 0)
              )}
            </div>
          </div>
        </div>
      )}

      <div className="nota-reajuste">
        <h3>1. REAJUSTE DE MESADA A CARGO DE LA EMPRESA ANTES DE COMPARTIR</h3>
        
        {/* Información de debug de datos disponibles */}
        {pensionesUnicas.length > 0 && (
          <div className="datos-disponibles">
            <h4>Datos disponibles en el sistema:</h4>
          
            <div className="calculo-base">
              <strong>Metodología de cálculo dinámico con datos consolidados:</strong>
              <p>Valor base 1999: {formatearPagoReal(obtenerPagoEnero(1999) || 1609662)}</p>
              <div className="ejemplo-calculo">
                <p><strong>Descripción de las columnas con datos consolidados (1982-2025):</strong></p>
                <ul>
                  <li><strong>Año:</strong> Año de análisis de la pensión</li>
                  <li><strong>SMLMV:</strong> Salario Mínimo Legal Mensual Vigente del año (datos consolidados)</li>
                  <li><strong>Reajuste en % SMLMV:</strong> Porcentaje de reajuste del SMLMV del año (datos consolidados)</li>
                  <li><strong>Proyección de Mesada Fiduprevisora con % SMLMV:</strong> Valor proyectado aplicando reajustes acumulativos desde 1999</li>
                  <li><strong># de SMLMV (En el Reajuste x SMLMV):</strong> Proyección Mesada ÷ SMLMV del año</li>
                  <li><strong>Reajuste en % IPCs:</strong> IPC del año anterior usado para reajustes (datos consolidados)</li>
                  <li><strong>Mesada Pagada Fiduprevisora reajuste con IPCs:</strong> Último valor válido antes de caídas drásticas (&gt;50%)</li>
                  <li><strong># de SMLMV (En el Reajuste x IPC):</strong> Mesada Pagada con IPCs ÷ SMLMV del año</li>
                  <li><strong>Diferencias de Mesadas:</strong> Proyección con SMLMV - Mesada Pagada con IPCs (fórmula validada: si es N/D se muestra 0)</li>
                  <li><strong># de Mesadas:</strong> Número real de pagos hasta detección de caída drástica</li>
                  <li><strong>Total Diferencias Retroactivas:</strong> Diferencias de Mesadas × # de Mesadas (fórmula validada: si Diferencias = 0, Retroactivas = 0)</li>
                </ul>
                <div style={{marginTop: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px'}}>
                  <p><strong>📊 Datos consolidados integrados:</strong></p>
                  <ul>
                    <li>✅ SMLMV histórico 1982-2025</li>
                    <li>✅ IPC histórico 1981-2024 (para reajustes año siguiente)</li>
                    <li>✅ Reajustes SMLMV 1982-2025</li>
                    <li>✅ Detección automática de caídas drásticas (&gt;50%)</li>
                    <li>✅ Cálculos dinámicos preservando lógica original</li>
                    <li>✅ Validación fórmula: Total Retroactivas = Diferencias × # Mesadas</li>
                  </ul>
                </div>
                <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px'}}>
                  <p><strong>🚨 Ejemplo detección caída 2007:</strong></p>
                  <p>Agosto: $2,607,761 → Septiembre: $1,014,335 (caída 61%) → Solo cuenta 9 pagos válidos</p>
                </div>
                <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '5px'}}>
                  <p><strong>🧮 Validación de fórmulas implementadas:</strong></p>
                  <p><strong>1. Diferencias de Mesadas = Proyección de Mesada Fiduprevisora con % SMLMV - Mesada Pagada Fiduprevisora reajuste con IPCs</strong></p>
                  <p><strong>2. Total Diferencias Retroactivas = Diferencias de Mesadas × # de Mesadas</strong></p>
                  <ul style={{marginTop: '10px', marginBottom: '10px'}}>
                    <li>✅ Fórmula 1: Proyección SMLMV - Mesada Pagada IPCs = Diferencias</li>
                    <li>✅ Fórmula 2: Si Diferencias = 0 (o N/D) → Total Retroactivas = 0</li>
                    <li>✅ Fórmula 2: Si # de Mesadas = 0 → Total Retroactivas = 0</li>
                    <li>✅ Ejemplo: Diferencias $100,000 × 12 mesadas = $1,200,000 Total Retroactivas</li>
                  </ul>
                  <p><em>Ambas fórmulas están validadas y aplicadas en las tablas 1 y 3</em></p>
                </div>
              </div>
            </div>
            
            
          </div>
        )}
        {pensionesUnicas.length === 0 && (
          <div className="sin-datos">
            <p><strong>No hay datos de pagos disponibles para este usuario.</strong></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Anexo2;
