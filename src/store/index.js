import { authApi } from "../services/AuthAPI";
import { bussinessAPI } from "../services/BsAPI";
import { partnerAPI } from "../services/PartnerAPI";
import { ContractAPI } from "../services/ContractAPI";
import { TemplateAPI } from "../services/TemplateAPI";
import { uploadAPI } from "../services/uploadAPI";
import { clauseAPI } from "../services/ClauseAPI";
import { userAPI } from "../services/UserAPI";
import { processAPI } from "../services/ProcessAPI";
import { ConfigAPI } from "../services/ConfigAPI";
import { notiAPI } from "../services/NotiAPI";
import { AuditTrailAPI } from "../services/AuditTrailAPI";
import { appendixApi } from "../services/AppendixAPI";
import { DepartmentAPI } from "../services/Department";
import AuthReducer from "../slices/authSlice";
import themeReducer from "../slices/themeSlice";
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import sessionStorage from "redux-persist/lib/storage/session";

const persistConfig = {
  key: "root",
  storage: sessionStorage,
  whitelist: ["user", "token","avartar","notiNumber"],
};

const AuthPerisReducer = persistReducer(persistConfig, AuthReducer);

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    auth: AuthPerisReducer,
    [bussinessAPI.reducerPath]: bussinessAPI.reducer,
    [partnerAPI.reducerPath]: partnerAPI.reducer,
    [ContractAPI.reducerPath]: ContractAPI.reducer,
    [TemplateAPI.reducerPath]: TemplateAPI.reducer,
    [uploadAPI.reducerPath]: uploadAPI.reducer,
    [clauseAPI.reducerPath]: clauseAPI.reducer,
    [userAPI.reducerPath]: userAPI.reducer,
    [processAPI.reducerPath]: processAPI.reducer,
    [ConfigAPI.reducerPath]: ConfigAPI.reducer,
    [notiAPI.reducerPath]: notiAPI.reducer,
    [AuditTrailAPI.reducerPath]: AuditTrailAPI.reducer,
    [DepartmentAPI.reducerPath]: DepartmentAPI.reducer,
    [appendixApi.reducerPath]: appendixApi.reducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(
      authApi.middleware,
      bussinessAPI.middleware,
      partnerAPI.middleware,
      ContractAPI.middleware,
      TemplateAPI.middleware,
      uploadAPI.middleware,
      userAPI.middleware,
      clauseAPI.middleware,
      processAPI.middleware,
      ConfigAPI.middleware,
      notiAPI.middleware,
      AuditTrailAPI.middleware,
      DepartmentAPI.middleware,
      appendixApi.middleware
    ),
});

export const Persister = persistStore(store);