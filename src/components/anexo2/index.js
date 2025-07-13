// Índice principal para los módulos de Anexo2
// Facilita las importaciones desde otros componentes

// Componentes UI
export { default as UserInfo } from './UserInfo';
export { default as NoDataMessage } from './NoDataMessage';
export { default as Tabla1 } from './Tabla1';
export { default as TablaComparticion } from './TablaComparticion';
export { default as Tabla3 } from './Tabla3';
export { default as NotaReajuste } from './NotaReajuste';

// Constantes y datos
export * from './dataConstants';

// Procesamiento de datos
export * from './dataProcessing';

// Lógica de proyección
export * from './proyeccionLogic';

// Utilidades
export * from './utils';

// Uso recomendado:
// import { Tabla1, TablaComparticion, formatearNumero } from './anexo2';
// import { datosConsolidados, obtenerIPCAño } from './anexo2';
