export const formatearNumero = (valor) => {
  if (valor === 0 || valor === null || valor === undefined) {
    return 'N/D';
  }
  return new Intl.NumberFormat('es-CO').format(valor);
};

export const formatearDiferencia = (valor) => {
  if (valor === 0 || valor === null || valor === undefined || isNaN(valor)) {
    return '0';
  }
  return new Intl.NumberFormat('es-CO').format(Math.round(valor));
};

export const formatearPagoReal = (valor) => {
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

export const calcularRetroactivas = (diferenciaMesadas, numeroPagos) => {
  if (diferenciaMesadas === 0 || diferenciaMesadas === null || diferenciaMesadas === undefined || isNaN(diferenciaMesadas)) {
    return 0;
  }
  if (numeroPagos === 0 || numeroPagos === null || numeroPagos === undefined || isNaN(numeroPagos)) {
    return 0;
  }
  return diferenciaMesadas * numeroPagos;
};

export const validarFormulas = (año, proyeccion, mesadaPagada, diferencias, numMesadas, retroactivas) => {
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
