import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { StarProvider } from "./star";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <StarProvider>
        <App />
      </StarProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
