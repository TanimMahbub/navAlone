import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Ships the core stylesheet — `import "navalone/css"` in a real app.
import "navalone/css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
