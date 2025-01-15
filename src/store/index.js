import { authApi } from "../services/AuthAPI";
import { bussinessAPI } from "../services/BsAPI";
import { partnerAPI } from "../services/PartnerAPI";
import AuthReducer from "../slices/auth.slice";
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
    [bussinessAPI.reducerPath]: bussinessAPI.reducer,
    bsInfo: bussinessAPI,
    [partnerAPI.reducerPath]: partnerAPI.reducer,
    partner: partnerAPI
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      bussinessAPI.middleware,
      partnerAPI.middleware,
    ),
});

export const Persister = persistStore(store);
