// /home/flag/Documentos/Analisispensiones/pendionados/src/redux/procesosContext.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  procesos: [],
  loading: false,
  error: null,
  annotations: {}, // Almacena las anotaciones por num_registro
  annotationsLoading: {}, // Almacena el estado de carga de anotaciones por num_registro
  annotationsError: {}, // Almacena el error de anotaciones por num_registro
  analysis: {}, // Almacena el análisis por num_registro
  analysisLoading: {}, // Almacena el estado de carga del análisis por num_registro
  analysisError: {}, // Almacena el error del análisis por num_registro
};

const procesosSlice = createSlice({
  name: 'procesos',
  initialState,
  reducers: {
    fetchProcesosStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchProcesosSuccess: (state, action) => {
      state.loading = false;
      state.procesos = action.payload;
      state.error = null;
    },
    fetchProcesosFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.procesos = [];
    },
    fetchAnnotationsStart: (state, action) => {
      const num_registro = action.payload;
      state.annotationsLoading[num_registro] = true;
      state.annotationsError[num_registro] = null;
    },
    fetchAnnotationsSuccess: (state, action) => {
      const { num_registro, data } = action.payload;
      state.annotationsLoading[num_registro] = false;
      state.annotations[num_registro] = data;
      state.annotationsError[num_registro] = null;
    },
    fetchAnnotationsFailure: (state, action) => {
      const { num_registro, error } = action.payload;
      state.annotationsLoading[num_registro] = false;
      state.annotationsError[num_registro] = error;
      state.annotations[num_registro] = [];
    },
    clearAnnotations: (state, action) => {
      const num_registro = action.payload;
      state.annotations[num_registro] = null;
      state.annotationsLoading[num_registro] = false;
      state.annotationsError[num_registro] = null;
    },
    fetchAnalysisStart: (state, action) => {
      const num_registro = action.payload;
      state.analysisLoading[num_registro] = true;
      state.analysisError[num_registro] = null;
    },
    fetchAnalysisSuccess: (state, action) => {
      const { num_registro, data } = action.payload;
      state.analysisLoading[num_registro] = false;
      state.analysis[num_registro] = data;
      state.analysisError[num_registro] = null;
    },
    fetchAnalysisFailure: (state, action) => {
      const { num_registro, error } = action.payload;
      state.analysisLoading[num_registro] = false;
      state.analysisError[num_registro] = error;
      state.analysis[num_registro] = null;
    },
    clearAnalysis: (state, action) => {
      const num_registro = action.payload;
      state.analysis[num_registro] = null;
      state.analysisLoading[num_registro] = false;
      state.analysisError[num_registro] = null;
    },
    clearProcesosData: (state) => {
      state.procesos = [];
      state.loading = false;
      state.error = null;
      state.annotations = {};
      state.annotationsLoading = {};
      state.annotationsError = {};
      state.analysis = {};
      state.analysisLoading = {};
      state.analysisError = {};
    }
  },
});

export const {
  fetchProcesosStart,
  fetchProcesosSuccess,
  fetchProcesosFailure,
  fetchAnnotationsStart,
  fetchAnnotationsSuccess,
  fetchAnnotationsFailure,
  clearAnnotations,
  fetchAnalysisStart,
  fetchAnalysisSuccess,
  fetchAnalysisFailure,
  clearAnalysis,
  clearProcesosData
} = procesosSlice.actions;

export default procesosSlice.reducer;
