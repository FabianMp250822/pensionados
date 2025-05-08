import { createSlice } from '@reduxjs/toolkit';

const pensionesSlice = createSlice({
  name: 'pensiones',
  initialState: {
    usuarioSeleccionado: null,
    pensiones: [],
    loading: false,
    error: null,
    parrisData: null, // Nuevo campo en el estado
  },
  reducers: {
    setUsuarioSeleccionado: (state, action) => {
      console.log('setUsuarioSeleccionado payload:', action.payload);
      state.usuarioSeleccionado = action.payload;
    },
    setPensiones: (state, action) => {
      // Filtramos duplicados y extraemos descuento de salud
      const uniquePayments = [];
      const seen = new Set(); // Para rastrear combinaciones de año y periodoPago

      action.payload.forEach(item => {
        const key = `${item.año}-${item.periodoPago}`;
        if (!seen.has(key)) {
          // Extraer el descuento de salud (código 1001)
          const detalleSalud = item.detalles?.find(
            // Puedes ajustar la condición si el nombre o código varía
            detalle => detalle.codigo === '1001' || detalle.nombre?.includes('Descuento Salud')
          );
          // Asegúrate de que la propiedad se llame 'descuentos' o ajusta según tu estructura de datos
          const descuentoSaludValor = detalleSalud?.descuentos || 0;

          // Añadir el descuento al objeto del item antes de guardarlo
          uniquePayments.push({
            ...item,
            descuentoSalud: descuentoSaludValor // Añadimos el nuevo campo
          });
          seen.add(key); // Marcar como visto
        }
      });
      console.log('setPensiones payload (filtrado y con descuento salud):', uniquePayments);
      state.pensiones = uniquePayments;
    },
    setLoading: (state, action) => {
      console.log('setLoading payload:', action.payload);
      state.loading = action.payload;
    },
    setError: (state, action) => {
      console.log('setError payload:', action.payload);
      state.error = action.payload;
    },
    setParrisData: (state, action) => {
      console.log('setParrisData payload:', action.payload);
      state.parrisData = action.payload;
    },
  },
});

export const { 
  setUsuarioSeleccionado, 
  setPensiones, 
  setLoading, 
  setError,
  setParrisData
} = pensionesSlice.actions;

export default pensionesSlice.reducer;
