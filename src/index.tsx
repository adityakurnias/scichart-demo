import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { SciChartSurface, SciChart3DSurface } from "scichart";

import App from "./App";
import "./styles/main.scss";

const rootElement = document.getElementById("root");

SciChartSurface.UseCommunityLicense();
SciChartSurface.loadWasmFromCDN();
SciChart3DSurface.loadWasmFromCDN();

const root = createRoot(rootElement!);
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
