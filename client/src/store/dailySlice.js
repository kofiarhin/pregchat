import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchTodayUpdate = createAsyncThunk('daily/today', async () => {
  const { data } = await axios.get('/api/daily/today');
  return data; // { baby, mother, sources?: [{title, url}] }
});

const dailySlice = createSlice({
  name: 'daily',
  initialState: { loading: false, today: null, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchTodayUpdate.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchTodayUpdate.fulfilled, (s, a) => { s.loading = false; s.today = a.payload; });
    b.addCase(fetchTodayUpdate.rejected, (s, a) => { s.loading = false; s.error = a.error.message; });
  }
});

export default dailySlice.reducer;
