// Datos consolidados de SMLMV, IPC y Reajuste SMLMV (1982-2025)
export const DATOS_CONSOLIDADOS = {
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

// Datos de IPC por año (para la columna "Reajuste en % IPCs")
export const DATOS_IPC = {
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

// Datos de SMLMV para años posteriores a 2007 (para la tabla 3)
export const DATOS_TABLA3 = [
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
  { año: 2022, smlmv: 1000000, reajuste: 10.07 },
  { año: 2023, smlmv: 1160000, reajuste: 16.00 },
  { año: 2024, smlmv: 1300000, reajuste: 12.00 },
  { año: 2025, smlmv: 1423500, reajuste: 9.50 }
];

// Datos de la tabla 1 basados en la imagen
export const DATOS_TABLA1 = [
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

// ✅ VALIDACIÓN DE LÓGICAS DE COLUMNAS - DOCUMENTACIÓN ACTUALIZADA
/*
 * ====================================================
 * VALIDACIÓN DE LÓGICAS POR COLUMNA (TABLAS 1 Y 3)
 * ====================================================
 * 
 * COLUMNA 1: Año ✅ VALIDADA
 * 🎯 Objetivo: Mostrar el año fiscal que se está analizando
 * ⚙️ Lógica: Valor iterativo del período de análisis
 * 📍 Origen: Lista predefinida en DATOS_TABLA1 y DATOS_TABLA3
 * 
 * COLUMNA 2: SMLMV ✅ VALIDADA
 * 🎯 Objetivo: Salario Mínimo Legal Mensual Vigente del año
 * ⚙️ Lógica: valor = DATOS_CONSOLIDADOS[Año].smlmv
 * 📍 Origen: Búsqueda en DATOS_CONSOLIDADOS usando Año como clave
 * 
 * COLUMNA 3: Reajuste en % SMLMV ✅ VALIDADA
 * 🎯 Objetivo: Porcentaje oficial de incremento del SMLMV
 * ⚙️ Lógica: valor = DATOS_CONSOLIDADOS[Año].reajusteSMLMV
 * 📍 Origen: Búsqueda en DATOS_CONSOLIDADOS usando Año como clave
 * 
 * COLUMNA 4: Proyección de Mesada Fiduprevisora con % SMLMV ✅ VALIDADA
 * 🎯 Objetivo: Mesada teórica con incrementos SMLMV
 * ⚙️ Lógica:
 *    - Primer año Tabla 1: obtenerPagoEnero(1999) [valor ancla]
 *    - Años siguientes: valor_anterior * (1 + reajuste_SMLMV/100)
 *    - Primer año Tabla 3: (Proyección_2007 - Mesada_Pagada_2007) [nuevo ancla]
 * 📍 Origen: Cálculo dinámico basado en datos reales + reajustes acumulativos
 * 
 * COLUMNA 5: # de SMLMV (En el Reajuste x SMLMV) ✅ VALIDADA
 * 🎯 Objetivo: Mesada proyectada como múltiplo del SMLMV
 * ⚙️ Lógica: valor = [Columna 4] / [Columna 2]
 * 📍 Origen: División entre Columna 4 y Columna 2
 * 
 * COLUMNA 6: Reajuste en % IPCs ✅ VALIDADA
 * 🎯 Objetivo: IPC del año anterior (base legal para reajustes)
 * ⚙️ Lógica: valor = DATOS_IPC[Año - 1]
 * 📍 Origen: Búsqueda en DATOS_IPC usando (Año - 1) como clave
 * 
 * COLUMNA 7: Mesada Pagada Fiduprevisora reajuste con IPCs ⚠️ REQUIERE VALIDACIÓN
 * 🎯 Objetivo: Monto real recibido por el pensionado
 * ⚙️ Lógica: obtenerValorMesadaValidoAño(Año) con detección de caídas >50%
 * 📍 Origen: Procesamiento dinámico del arreglo pensiones
 * ❌ NOTA: Esta columna depende de datos externos (no está en constantes)
 * 
 * COLUMNA 8: # de SMLMV (En el Reajuste x IPC) ✅ VALIDADA
 * 🎯 Objetivo: Mesada real como múltiplo del SMLMV
 * ⚙️ Lógica: valor = [Columna 7] / [Columna 2]
 * 📍 Origen: División entre Columna 7 y Columna 2
 * 
 * COLUMNA 9: Diferencias de Mesadas ✅ VALIDADA
 * 🎯 Objetivo: Faltante mensual (proyección vs real)
 * ⚙️ Lógica: valor = [Columna 4] - [Columna 7]
 * 📍 Origen: Resta entre Columna 4 y Columna 7
 * 
 * COLUMNA 10: # de Mesadas ⚠️ REQUIERE VALIDACIÓN
 * 🎯 Objetivo: Número de mesadas pagadas antes de compartición
 * ⚙️ Lógica: contarPagosAño(Año) con detección de caídas >50%
 * 📍 Origen: Conteo dinámico del arreglo pensiones
 * ❌ NOTA: Esta columna depende de datos externos (no está en constantes)
 * 
 * COLUMNA 11: Total Diferencias Retroactivas ✅ VALIDADA
 * 🎯 Objetivo: Monto total adeudado para el año
 * ⚙️ Lógica: valor = [Columna 9] * [Columna 10]
 * 📍 Origen: Multiplicación entre Columna 9 y Columna 10
 * 
 * ====================================================
 * ESTADO DE VALIDACIÓN GENERAL: 🟡 PARCIALMENTE VALIDADA
 * ====================================================
 * 
 * ✅ COLUMNAS VALIDADAS (9/11): 1, 2, 3, 4, 5, 6, 8, 9, 11
 * ⚠️ COLUMNAS PENDIENTES (2/11): 7, 10
 * 
 * RAZÓN: Las columnas 7 y 10 dependen de procesamiento dinámico 
 * de datos externos (arreglo pensiones) que no están en este archivo.
 * Su validación requiere verificar la implementación en los hooks.
 * 
 * RECOMENDACIONES:
 * 1. ✅ Las constantes están correctamente estructuradas
 * 2. ✅ Los datos consolidados cubren todos los años necesarios
 * 3. ⚠️ Verificar implementación de obtenerValorMesadaValidoAño()
 * 4. ⚠️ Verificar implementación de contarPagosAño()
 * 5. ✅ La lógica de cálculo acumulativo está bien diseñada
 * 
 * DIFERENCIA CLAVE TABLA 1 vs TABLA 3:
 * - Tabla 1: Valor inicial = obtenerPagoEnero(1999)
 * - Tabla 3: Valor inicial = Mayor Valor a Cargo de la Empresa
 *   Calculado como: (Proyección_Mesada_2007 - Mesada_Pagada_2007)
 */

// ✅ VALIDACIÓN DE DATOS DE REFERENCIA PARA TABLA 1
export const DATOS_TABLA1_VALIDACION = {
  valorAnclaEsperado: 1609662, // Primer pago de enero 1999
  ultimaProyeccion2007: 2952301, // Última proyección para calcular ancla Tabla 3
  ultimaMesadaPagada2007: 2607761, // Para calcular Mayor Valor a Cargo Empresa
  diferenciasEsperadas: {
    2000: 12394,  // Validar: Proyección - Mesada Real
    2001: 34904,
    2002: 45167,
    2003: 57790,
    2004: 91825,
    2005: 122707,
    2006: 183192,
    2007: 344540
  },
  retroactivasEsperadas: {
    2000: 173516,  // Validar: Diferencias × # Mesadas
    2001: 488656,
    2002: 632338,
    2003: 809060,
    2004: 1285550,
    2005: 1717898,
    2006: 1465536,
    2007: 3100860
  }
};

// ✅ FÓRMULAS DE VALIDACIÓN IMPLEMENTADAS
export const FORMULAS_VALIDACION = {
  // Columna 4: Proyección acumulativa
  proyeccionMesada: (valorAnterior, reajustePorcentaje) => 
    valorAnterior * (1 + (reajustePorcentaje / 100)),
  
  // Columna 5: Múltiplo SMLMV (Proyección)
  multiplicadorSMLMV_Proyeccion: (proyeccion, smlmv) => 
    proyeccion / smlmv,
  
  // Columna 8: Múltiplo SMLMV (Real)
  multiplicadorSMLMV_Real: (mesadaReal, smlmv) => 
    mesadaReal / smlmv,
  
  // Columna 9: Diferencias
  diferenciaMesadas: (proyeccion, mesadaReal) => 
    proyeccion - mesadaReal,
  
  // Columna 11: Retroactivas
  totalRetroactivas: (diferencias, numeroMesadas) => 
    diferencias * numeroMesadas,
  
  // Validación de caída drástica (>50%)
  esCaidaDrastica: (valorAnterior, valorActual) => 
    ((valorAnterior - valorActual) / valorAnterior) * 100 > 50
};
