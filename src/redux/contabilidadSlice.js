// contabilidadSlice.js
import { createSlice } from '@reduxjs/toolkit';

const contabilidadSlice = createSlice({
  name: 'contabilidad',
  initialState: {
    clienteSeleccionado: null, // Estado inicial vacío
    loading: false,
    pagos: [], // Estado inicial vacío
  },
  reducers: {
    setClienteSeleccionado: (state, action) => {
      state.clienteSeleccionado = action.payload;
    },
    setPagos: (state, action) => {
      state.pagos = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    agregarPago: (state, action) => {
      state.pagos.push(action.payload);
    },
  },
});

export const { setClienteSeleccionado, setPagos, setLoading, agregarPago } = contabilidadSlice.actions;

export default contabilidadSlice.reducer;
