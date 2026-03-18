import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

/**
 * Minimal OAuth callback page — opened inside a popup by handleConnectDrive().
 *
 * Google's OAuth pages set Cross-Origin-Opener-Policy: same-origin, which
 * severs window.opener before we land here. We use BroadcastChannel instead
 * of postMessage so the parent window can receive the result regardless.
 */
export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const libraryId = searchParams.get("library_id");
    const connected = searchParams.get("connected") === "true";
    const error = searchParams.get("error");

    // BroadcastChannel works same-origin without needing window.opener
    const bc = new BroadcastChannel("oauth_drive");
    bc.postMessage({
      type: "oauth_drive_connected",
      library_id: libraryId,
      connected,
      error: error ?? null,
    });
    bc.close();

    // Attempt to close popup (works when opened via window.open)
    setClosing(true);
    window.close();

    // Fallback: if window.close() was blocked, redirect after a short delay
    const timer = setTimeout(() => {
      if (libraryId && connected) {
        navigate(`/admin/libraries/${libraryId}?tab=integrations`, { replace: true });
      } else {
        navigate("/admin/libraries", { replace: true });
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-sm text-muted-foreground">
      {closing ? (
        <>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          <p>Google Drive connected — closing…</p>
        </>
      ) : (
        <p>Processing…</p>
      )}
    </div>
  );
}
