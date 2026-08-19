import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './themeSlice';
import chatReducer from './chatSlice';
import presenceReducer from './presenceSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    chat: chatReducer,
    presence: presenceReducer,
  },
});

