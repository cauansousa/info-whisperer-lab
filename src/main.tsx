import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN ?? "https://4e128b3314351d8c7046ce6f2f789f2b@o4511114186522624.ingest.us.sentry.io/4511114193666048",
  tracesSampleRate: 0.1,
  environment: import.meta.env.MODE,
});

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm font-medium text-destructive">Algo correu mal</p>
      <p className="text-xs text-muted-foreground">{error?.message}</p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-md border px-4 py-2 text-sm hover:bg-secondary/50"
      >
        Recarregar
      </button>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={({ error }) => <ErrorFallback error={error as Error} />}>
    <App />
  </Sentry.ErrorBoundary>
);
