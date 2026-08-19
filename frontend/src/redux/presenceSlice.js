import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Map of clerkId -> { status: 'online' | 'offline', lastSeenAt: Date }
  presences: {},
};

const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    updatePresence: (state, action) => {
      const { clerkId, status, lastSeenAt } = action.payload;
      if (clerkId) {
        state.presences[clerkId] = { status, lastSeenAt };
      }
    },
    setInitialPresences: (state, action) => {
      state.presences = action.payload;
    }
  },
});

export const { updatePresence, setInitialPresences } = presenceSlice.actions;
export default presenceSlice.reducer;
