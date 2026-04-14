import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AlfaTrackerFY27 from "./App";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <AlfaTrackerFY27 />
  </StrictMode>
);
