import { authApi } from "../services/AuthAPI";
import { bussinessAPI } from "../services/BsAPI";
import { partnerAPI } from "../services/PartnerAPI";
import { ContractAPI } from "../services/ContractAPI";
import { TemplateAPI } from "../services/TemplateAPI";
import { taskAPI } from "../services/TaskAPI";
import { clauseAPI } from "../services/ClauseAPI";
import { userAPI } from "../services/UserAPI";
import { processAPI } from "../services/ProcessAPI";
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
    partner: partnerAPI,
    [ContractAPI.reducerPath]: ContractAPI.reducer,
    contract: ContractAPI,
    [TemplateAPI.reducerPath]: TemplateAPI.reducer,
    template: TemplateAPI,
    [taskAPI.reducerPath]: taskAPI.reducer,
    task: taskAPI,
    [clauseAPI.reducerPath]: clauseAPI.reducer,
    clause: clauseAPI,
    [userAPI.reducerPath]: userAPI.reducer,
    user: userAPI,
    [processAPI.reducerPath]: processAPI.reducer,
    user: processAPI,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      bussinessAPI.middleware,
      partnerAPI.middleware,
      ContractAPI.middleware,
      TemplateAPI.middleware,
      taskAPI.middleware,
      userAPI.middleware,
      clauseAPI.middleware,
      processAPI.middleware
    ),
});

export const Persister = persistStore(store);
