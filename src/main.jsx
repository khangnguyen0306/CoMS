
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import './App.css';
import { Provider } from "react-redux";
import { store, Persister } from "./store/index.js";
import { PersistGate } from "redux-persist/integration/react";
import "@fontsource/roboto";
import { ThemeProvider } from "./config/ThemeConfig.jsx";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <PersistGate loading={null} persistor={Persister}>
          <App />
        </PersistGate>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
