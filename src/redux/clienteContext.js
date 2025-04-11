
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userData: null,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    fetchUserDataStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchUserDataSuccess: (state, action) => {
      state.isLoading = false;
      state.userData = action.payload;
      state.error = null;
    },
    fetchUserDataFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.userData = null;
    },
    clearUserData: (state) => {
      state.userData = null;
      state.isLoading = false;
      state.error = null;
    }
  },
});

export const {
  fetchUserDataStart,
  fetchUserDataSuccess,
  fetchUserDataFailure,
  clearUserData
} = userSlice.actions;

export default userSlice.reducer;
