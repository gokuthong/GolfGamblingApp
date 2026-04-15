import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import App from "./App";

// Skip service worker registration on Capacitor native (like PhotoAlbumApp)
const isNative = typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.();

if ("serviceWorker" in navigator && !isNative) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW registration failed, continue without it
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
