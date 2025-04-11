// authSlice.js mejorado con estado loading
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  userRole: null,
  isLoading: true, // Agrega este estado de carga
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.isAuthenticated = true;
      state.userRole = action.payload?.userRole || null;
      state.isLoading = false; // Indica que ya cargó
      console.log("Rol obtenido:", state.userRole);
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.userRole = null;
      state.isLoading = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { login, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
