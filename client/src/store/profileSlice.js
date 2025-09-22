import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchProfile = createAsyncThunk('profile/fetch', async () => {
  const { data } = await axios.get('/api/users/me');
  return data; // { gestationDays, ... }
});

const profileSlice = createSlice({
  name: 'profile',
  initialState: { loading: false, data: null, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchProfile.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchProfile.fulfilled, (s, a) => { s.loading = false; s.data = a.payload; });
    b.addCase(fetchProfile.rejected, (s, a) => { s.loading = false; s.error = a.error.message; });
  }
});

export default profileSlice.reducer;
