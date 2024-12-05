import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: false, // Estado inicial de autenticación
  },
  reducers: {
    login: (state) => {
      state.isAuthenticated = true; // Cambiamos el estado a autenticado
    },
    logout: (state) => {
      state.isAuthenticated = false; // Cambiamos el estado a no autenticado
    },
  },
});

export const { login, logout } = authSlice.actions;

export default authSlice.reducer;
