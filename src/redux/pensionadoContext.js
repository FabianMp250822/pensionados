// /home/flag/Documentos/Analisispensiones/pendionados/src/redux/pensionadoContext.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  pensionadoData: null,
  isLoading: false,
  error: null,
};

const pensionadoSlice = createSlice({
  name: 'pensionado',
  initialState,
  reducers: {
    fetchPensionadoDataStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchPensionadoDataSuccess: (state, action) => {
      state.isLoading = false;
      state.pensionadoData = action.payload;
      state.error = null;
    },
    fetchPensionadoDataFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.pensionadoData = null;
    },
    clearPensionadoData: (state) => {
      state.pensionadoData = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  fetchPensionadoDataStart,
  fetchPensionadoDataSuccess,
  fetchPensionadoDataFailure,
  clearPensionadoData,
} = pensionadoSlice.actions;

export default pensionadoSlice.reducer;
