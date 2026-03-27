import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN ?? "https://4e128b3314351d8c7046ce6f2f789f2b@o4511114186522624.ingest.us.sentry.io/4511114193666048",
  tracesSampleRate: 0.1,
  environment: import.meta.env.MODE,
});

createRoot(document.getElementById("root")!).render(<App />);
