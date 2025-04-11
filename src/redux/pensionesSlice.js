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
      // Filtramos duplicados: Si ya existe un pago con el mismo año y periodoPago, lo descartamos.
      const uniquePayments = [];
      action.payload.forEach(item => {
        const exists = uniquePayments.some(p => p.año === item.año && p.periodoPago === item.periodoPago);
        if (!exists) {
          uniquePayments.push(item);
        }
      });
      console.log('setPensiones payload (filtrado):', uniquePayments);
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
