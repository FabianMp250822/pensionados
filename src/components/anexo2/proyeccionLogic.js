import { datosTabla1, datosTabla3, obtenerDatosAño } from './dataConstants';
import { obtenerPagoEnero, contarPagosAño, obtenerValorMesadaValidoAño } from './dataProcessing';

// Función para generar proyección dinámica para la tabla 1 (1999-2007)
export const generarProyeccionDinamicaTabla1 = (pagosFinales) => {
  const primerPago1999 = obtenerPagoEnero(1999, pagosFinales);
  
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
        numeroPagosReales: contarPagosAño(row.año, pagosFinales)
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
        numeroPagosReales: contarPagosAño(row.año, pagosFinales)
      };
    }
  });

  return datosConProyeccion;
};

// Función para generar proyección dinámica para la tabla 3 (continuación directa desde donde se cortó la tabla 1)
export const generarProyeccionDinamicaTabla3 = (pagosFinales, datosTabla1Calculados) => {
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
      const pagosDelAño = contarPagosAño(añoPago, pagosFinales);
      if (pagosDelAño > 0) {
        añosPosteriores.add(añoPago);
        
        // Encontrar el SMLMV correspondiente
        const datosAño = datosTabla3.find(d => d.año === añoPago);
        if (datosAño) {
          pagosTabla3.push({
            año: añoPago,
            smlmv: datosAño.smlmv,
            reajuste: datosAño.reajuste,
            valorReal: obtenerValorMesadaValidoAño(añoPago, pagosFinales),
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
        numeroPagosReales: row.numeroPagos || contarPagosAño(row.año, pagosFinales)
      };
    }
  });

  return datosConProyeccion;
};
