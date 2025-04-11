import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import pensionesReducer from './pensionesSlice';
import contabilidadReducer from './contabilidadSlice.js';
import causantesReducer from './causantesSlice';

// Reducers faltantes:
import userReducer from './clienteContext';
import procesosReducer from './procesosContext';
import pensionadoReducer from './pensionadoContext';

const store = configureStore({
  reducer: {
    auth: authReducer,
    pensiones: pensionesReducer,
    contabilidad: contabilidadReducer,
    causantes: causantesReducer,
    user: userReducer,             
    procesos: procesosReducer,
    pensionado: pensionadoReducer,
  },
});

export default store;
