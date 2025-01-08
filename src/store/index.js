

import { authApi } from "../services/AuthAPI";
import AuthReducer from "../slices/Auth.slice";
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import sessionStorage from 'redux-persist/lib/storage/session'

const persistConfig = {
  key: 'root',
  storage: sessionStorage, 
  whitelist: ['user', 'token'],
};

const AuthPerisReducer = persistReducer(persistConfig, AuthReducer);


export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    auth: AuthPerisReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,

    ),
});

export const Persister = persistStore(store);
