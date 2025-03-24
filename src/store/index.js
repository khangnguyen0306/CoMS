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
import { AppendixAPI } from "../services/AppendixAPI";
import { DepartmentAPI } from "../services/Department";
import AuthReducer from "../slices/authSlice";
import themeReducer from "../slices/themeSlice";
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
    [uploadAPI.reducerPath]: uploadAPI.reducer,
    task: uploadAPI,
    [clauseAPI.reducerPath]: clauseAPI.reducer,
    clause: clauseAPI,
    [userAPI.reducerPath]: userAPI.reducer,
    user: userAPI,
    [processAPI.reducerPath]: processAPI.reducer,
    user: processAPI,
    [ConfigAPI.reducerPath]: ConfigAPI.reducer,
    config: ConfigAPI,
    [notiAPI.reducerPath]: notiAPI.reducer,
    notifi: notiAPI,
    [AuditTrailAPI.reducerPath]: AuditTrailAPI.reducer,
    auditrail: AuditTrailAPI,
    [DepartmentAPI.reducerPath]: DepartmentAPI.reducer,
    department: DepartmentAPI,
    [AppendixAPI.reducerPath]: AppendixAPI.reducer,
    appendix: AppendixAPI,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
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
      AppendixAPI.middleware
    ),
});

export const Persister = persistStore(store);
