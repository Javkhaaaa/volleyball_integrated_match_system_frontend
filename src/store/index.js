import { configureStore, createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, status: 'idle' },
  reducers: {
    setUser: (s, a) => { s.user = a.payload; s.status = 'authed'; },
    clearUser: (s) => { s.user = null; s.status = 'anon'; },
    setStatus: (s, a) => { s.status = a.payload; },
  },
});

export const { setUser, clearUser, setStatus } = authSlice.actions;

export const store = configureStore({
  reducer: { auth: authSlice.reducer },
});
