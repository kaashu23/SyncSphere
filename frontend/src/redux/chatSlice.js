import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeChat: null,
  messages: [],
  isLoading: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
  },
});

export const { setActiveChat, setMessages, addMessage } = chatSlice.actions;
export default chatSlice.reducer;
