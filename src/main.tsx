import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply the saved accent before first paint (avoids a color flash).
// Cobalt became the default in v2 and everyone was moved onto it once;
// anything picked after that is kept.
try {
  if (localStorage.getItem("td:accent-v") !== "2") {
    localStorage.setItem("td:accent", "cobalt");
    localStorage.setItem("td:accent-v", "2");
  }
  const a = localStorage.getItem("td:accent");
  if (a && a !== "cobalt") document.documentElement.dataset.accent = a;
} catch { /* storage unavailable */ }

createRoot(document.getElementById("root")!).render(<App />);
