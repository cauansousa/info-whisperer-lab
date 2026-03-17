import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

/**
 * Minimal OAuth callback page.
 * Opened inside a popup window by handleConnectDrive().
 * Notifies the parent window via postMessage and closes itself.
 */
export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const libraryId = searchParams.get("library_id");
    const connected = searchParams.get("connected") === "true";
    const error = searchParams.get("error");

    if (window.opener) {
      // Notify parent window
      window.opener.postMessage(
        {
          type: "oauth_drive_connected",
          library_id: libraryId,
          connected,
          error: error ?? null,
        },
        window.location.origin
      );
      // Close the popup
      window.close();
    } else {
      // Direct navigation (not a popup) — redirect to the library page
      if (libraryId && connected) {
        navigate(`/admin/libraries/${libraryId}?tab=integrations&connected=true`, {
          replace: true,
        });
      } else {
        navigate("/admin/libraries", { replace: true });
      }
    }
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Connecting Google Drive…
    </div>
  );
}
