import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply the saved accent before first paint (avoids a color flash).
try {
  const a = localStorage.getItem("td:accent");
  if (a && a !== "violet") document.documentElement.dataset.accent = a;
} catch { /* storage unavailable */ }

createRoot(document.getElementById("root")!).render(<App />);
