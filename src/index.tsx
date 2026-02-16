import { createRoot, hydrateRoot } from "react-dom/client";

import { SciChartSurface, SciChart3DSurface } from "scichart";

import App from "./App";

const rootElement = document.getElementById("root");

SciChartSurface.UseCommunityLicense();
SciChartSurface.loadWasmFromCDN();
SciChart3DSurface.loadWasmFromCDN();

const root = createRoot(rootElement);
root.render(
  <>
    <App />
  </>,
);
