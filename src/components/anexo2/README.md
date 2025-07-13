# Refactorización del Componente Anexo2

Este documento explica la refactorización del componente `Anexo2.js` en una estructura modular más mantenible.

## Estructura Original vs Refactorizada

### Original
- Un solo archivo de 1687 líneas
- Todas las funciones y lógica mezcladas
- Difícil de mantener y probar

### Refactorizada
```
src/components/
├── Anexo2Refactored.js          # Componente principal refactorizado
├── Anexo2.js                    # Componente original (mantener como backup)
└── anexo2/                      # Módulos específicos
    ├── UserInfo.js              # Información del usuario
    ├── NoDataMessage.js         # Mensaje cuando no hay datos
    ├── Tabla1.js                # Primera tabla (1999-2007)
    ├── TablaComparticion.js     # Tabla de compartición de mesada
    ├── Tabla3.js                # Tercera tabla (2008 en adelante)
    ├── NotaReajuste.js          # Nota explicativa final
    ├── dataConstants.js         # Constantes de datos (SMLMV, IPC, etc.)
    ├── dataProcessing.js        # Funciones de procesamiento de datos
    ├── proyeccionLogic.js       # Lógica de proyección dinámica
    └── utils.js                 # Utilidades de formateo y cálculos
```

## Descripción de Módulos

### 1. Componentes de UI

#### `UserInfo.js`
- Muestra información del usuario seleccionado
- Props: `usuarioSeleccionado`

#### `NoDataMessage.js`
- Mensaje de alerta cuando no hay datos disponibles
- Componente autónomo sin props

#### `Tabla1.js`
- Tabla principal de proyección (1999-2007)
- Props:
  - `datosConProyeccionTabla1`: Datos calculados
  - `obtenerValorMesadaValidoAño`: Función para obtener valores válidos
  - `contarPagosAño`: Función para contar pagos

#### `TablaComparticion.js`
- Tabla de compartición entre Colpensiones y empresa
- Props:
  - `datosConProyeccionTabla1`: Datos de la tabla 1
  - `pagosFinales`: Datos de pagos completos

#### `Tabla3.js`
- Tabla de continuación (2008 en adelante)
- Props:
  - `datosConProyeccionTabla3`: Datos calculados tabla 3
  - `datosConProyeccionTabla1`: Datos tabla 1 para totales
  - `obtenerValorMesadaValidoAño`: Función para obtener valores válidos
  - `contarPagosAño`: Función para contar pagos

#### `NotaReajuste.js`
- Sección explicativa con metodología
- Props:
  - `pensionesUnicas`: Datos de pensiones procesados
  - `obtenerPagoEnero`: Función para obtener pago de enero

### 2. Lógica y Datos

#### `dataConstants.js`
**Exporta:**
- `datosConsolidados`: SMLMV, IPC y reajustes 1982-2025
- `datosIPC`: Datos de IPC por año
- `datosTabla1`: Datos base tabla 1
- `datosTabla3`: Datos base tabla 3
- `obtenerIPCAño(año)`: Obtiene IPC del año anterior
- `obtenerDatosAño(año)`: Obtiene datos consolidados

#### `dataProcessing.js`
**Exporta:**
- `deduplicarPagos(pagos)`: Elimina duplicados por período exacto
- `obtenerPagoEnero(año, pagosFinales)`: Obtiene pago de enero
- `obtenerValorMesadaValidoAño(año, pagosFinales)`: Valor válido antes de caídas
- `contarPagosAño(año, pagosFinales)`: Cuenta pagos hasta caída drástica

#### `proyeccionLogic.js`
**Exporta:**
- `generarProyeccionDinamicaTabla1(pagosFinales)`: Genera proyección tabla 1
- `generarProyeccionDinamicaTabla3(pagosFinales, datosTabla1)`: Genera proyección tabla 3

#### `utils.js`
**Exporta:**
- `formatearNumero(valor)`: Formatea números
- `formatearDiferencia(valor)`: Formatea diferencias
- `formatearPagoReal(valor)`: Formatea pagos como moneda
- `calcularRetroactivas(diferencias, numPagos)`: Calcula retroactivas
- `validarFormulas(...)`: Valida fórmulas matemáticas

## Ventajas de la Refactorización

### 1. **Mantenibilidad**
- Cada módulo tiene una responsabilidad específica
- Fácil localizar y modificar funcionalidades
- Código más legible y organizado

### 2. **Testabilidad**
- Funciones puras fáciles de probar
- Componentes aislados testables independientemente
- Lógica separada de la presentación

### 3. **Reutilización**
- Componentes reutilizables en otros contextos
- Funciones de utilidad compartibles
- Constantes centralizadas

### 4. **Escalabilidad**
- Fácil agregar nuevas tablas o funcionalidades
- Estructura clara para nuevos desarrolladores
- Separación de concerns

## Funcionalidades Preservadas

✅ **Todas las funcionalidades originales se mantienen:**
- Deduplicación de pagos por período exacto
- Detección de caídas drásticas (>50%)
- Cálculos dinámicos de proyecciones
- Validación de fórmulas matemáticas
- Formateo de números y monedas
- Datos consolidados 1982-2025
- Lógica de compartición Colpensiones/Empresa

## Migración

### Para usar la versión refactorizada:

1. **Importar el nuevo componente:**
```javascript
import Anexo2 from './components/Anexo2Refactored';
```

2. **El componente original se mantiene como backup:**
```javascript
import Anexo2Original from './components/Anexo2';
```

### Compatibilidad
- **Props:** Mismas props que el componente original
- **CSS:** Usa el mismo archivo `Anexo2.css`
- **Redux:** Misma integración con el store
- **Funcionalidad:** 100% compatible

## Testing

### Componentes testables independientemente:
```javascript
// Ejemplo de test para Tabla1
import { render } from '@testing-library/react';
import Tabla1 from './anexo2/Tabla1';

test('renderiza tabla1 correctamente', () => {
  const mockData = [/* datos de prueba */];
  const mockFunctions = {
    obtenerValorMesadaValidoAño: jest.fn(),
    contarPagosAño: jest.fn()
  };
  
  render(<Tabla1 datosConProyeccionTabla1={mockData} {...mockFunctions} />);
});
```

### Funciones puras testables:
```javascript
// Ejemplo de test para utils
import { calcularRetroactivas } from './anexo2/utils';

test('calcula retroactivas correctamente', () => {
  expect(calcularRetroactivas(1000, 12)).toBe(12000);
  expect(calcularRetroactivas(0, 12)).toBe(0);
});
```

## Próximos Pasos

1. **Testing:** Implementar tests unitarios para cada módulo
2. **TypeScript:** Migrar a TypeScript para mayor type safety
3. **Optimización:** Implementar React.memo donde sea apropiado
4. **Documentación:** JSDoc para todas las funciones exportadas
