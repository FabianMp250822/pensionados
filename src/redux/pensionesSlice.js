import { createSlice } from '@reduxjs/toolkit';

const pensionesSlice = createSlice({
  name: 'pensiones',
  initialState: {
    usuarioSeleccionado: null,
    pensiones: [],
    loading: false,
    error: null,
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
  },
});


export const { setUsuarioSeleccionado, setPensiones, setLoading, setError } = pensionesSlice.actions;

export default pensionesSlice.reducer;
