import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './themeSlice';
import chatReducer from './chatSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    chat: chatReducer,
  },
});
