import { createSlice } from '@reduxjs/toolkit';

const pensionesSlice = createSlice({
  name: 'pensiones',
  initialState: {
    usuarioSeleccionado: null,
    pensiones: [],
    loading: false,
    error: null,
    parrisData: null, // <-- Agregamos el nuevo campo en el estado
  },
  reducers: {
    setUsuarioSeleccionado: (state, action) => {
      state.usuarioSeleccionado = action.payload;
    },
    setPensiones: (state, action) => {
      state.pensiones = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setParrisData: (state, action) => {
      // <-- Nuevo reducer para guardar los datos de Parris
      state.parrisData = action.payload;
    },
  },
});

export const { 
  setUsuarioSeleccionado, 
  setPensiones, 
  setLoading, 
  setError,
  setParrisData // <-- Exporta esta acción
} = pensionesSlice.actions;

export default pensionesSlice.reducer;
