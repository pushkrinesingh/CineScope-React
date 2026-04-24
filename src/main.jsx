import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Router from "./Components/Router";
import { BrowserRouter } from "react-router-dom";

document.documentElement.setAttribute("data-theme", "dark");
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Router />
  </BrowserRouter>,
);
