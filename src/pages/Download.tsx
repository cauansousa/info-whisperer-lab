import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Download, Apple, Monitor, ExternalLink, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const GITHUB_REPO = "cauansousa/info-whisperer-lab";

type OS = "mac" | "windows" | "linux";
type ReleaseAsset = { name: string; browser_download_url: string; size: number };
type Release = {
  tag_name: string;
  published_at: string;
  html_url: string;
  assets: ReleaseAsset[];
};

function detectOS(): OS {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "mac";
  if (ua.includes("win")) return "windows";
  return "linux";
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

function getAsset(assets: ReleaseAsset[], ext: string): ReleaseAsset | undefined {
  return assets.find((a) => a.name.toLowerCase().endsWith(ext));
}

const features = [
  "Chat com IA usando seus dados",
  "Bibliotecas de conhecimento privadas",
  "Agentes configuráveis por equipe",
  "Suporte a modelos locais via Ollama",
  "Funciona com backend cloud ou on-premise",
];

export default function DownloadPage() {
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const os = detectOS();

  useEffect(() => {
    fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`)
      .then((r) => {
        if (!r.ok) throw new Error("no release");
        return r.json();
      })
      .then(setRelease)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const dmg = release ? getAsset(release.assets, ".dmg") : undefined;
  const exe = release ? getAsset(release.assets, ".exe") : undefined;
  const msi = release ? getAsset(release.assets, ".msi") : undefined;

  const primaryAsset = os === "mac" ? dmg : os === "windows" ? (exe ?? msi) : undefined;
  const primaryLabel = os === "mac" ? "macOS (Universal)" : os === "windows" ? "Windows (x64)" : "Não disponível";
  const primaryIcon = os === "mac" ? Apple : Monitor;

  const version = release?.tag_name ?? "—";
  const releaseDate = release
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(release.published_at))
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-8 py-5 border-b border-border/20 bg-background/80 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border/40 bg-secondary/50">
            <Brain className="h-3.5 w-3.5" />
          </div>
          <span className="font-display text-sm font-semibold">Knowledge AI</span>
        </Link>
        <Link
          to="/login"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Entrar →
        </Link>
      </header>

      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-secondary/30 px-4 py-1.5 text-xs text-muted-foreground mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            {loading ? "Verificando versão…" : error ? "Versão não disponível" : `Versão ${version} · ${releaseDate}`}
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight mb-4">
            Download Knowledge AI
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            A plataforma de conhecimento empresarial. Instale em segundos, funciona offline com Ollama ou conecte ao seu backend cloud.
          </p>
        </motion.div>

        {/* Primary download */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col items-center mb-12"
        >
          {primaryAsset ? (
            <a
              href={primaryAsset.browser_download_url}
              className="group flex items-center gap-3 rounded-2xl bg-foreground px-8 py-4 text-background font-medium text-lg transition-opacity hover:opacity-90 shadow-lg shadow-foreground/10"
            >
              <Download className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
              Download para {primaryLabel}
              <span className="text-sm font-normal opacity-60 ml-1">
                {formatBytes(primaryAsset.size)}
              </span>
            </a>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-secondary/20 px-8 py-4 text-muted-foreground text-lg">
              {loading ? "Carregando…" : os === "linux" ? "Linux ainda não suportado" : "Sem versão publicada"}
            </div>
          )}

          {primaryAsset && (
            <p className="mt-3 text-xs text-muted-foreground/60">
              {os === "mac" ? "Requer macOS 11 Big Sur ou superior" : "Requer Windows 10 (64-bit) ou superior"}
            </p>
          )}
        </motion.div>

        {/* Other platforms */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-20"
        >
          {dmg && os !== "mac" && (
            <a
              href={dmg.browser_download_url}
              className="flex items-center gap-2 rounded-lg border border-border/30 bg-secondary/20 px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-border/60 hover:text-foreground"
            >
              <Apple className="h-4 w-4" />
              macOS · {formatBytes(dmg.size)}
            </a>
          )}
          {(exe ?? msi) && os !== "windows" && (
            <a
              href={(exe ?? msi)!.browser_download_url}
              className="flex items-center gap-2 rounded-lg border border-border/30 bg-secondary/20 px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-border/60 hover:text-foreground"
            >
              <Monitor className="h-4 w-4" />
              Windows x64 · {formatBytes((exe ?? msi)!.size)}
            </a>
          )}
          {release && (
            <a
              href={release.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border/30 bg-secondary/20 px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-border/60 hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              Todas as versões
            </a>
          )}
        </motion.div>

        {/* Installation steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="rounded-2xl border border-border/30 bg-secondary/10 p-8 mb-8"
        >
          <h2 className="font-display text-lg font-semibold mb-6 text-center">
            Como instalar
          </h2>

          {os === "mac" ? (
            <ol className="space-y-5 max-w-lg mx-auto">
              {[
                { n: 1, text: "Faz download do ficheiro .dmg acima" },
                { n: 2, text: 'Abre o .dmg e arrasta Knowledge AI para a pasta Applications' },
                { n: 3, text: null },
                { n: 4, text: "Abre o app normalmente — duplo clique em Applications" },
              ].map(({ n, text }) => (
                <li key={n} className="flex gap-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/40 bg-secondary/30 text-xs font-medium">
                    {n}
                  </span>
                  {text ? (
                    <span className="text-sm text-muted-foreground pt-0.5">{text}</span>
                  ) : (
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm text-muted-foreground mb-2">
                        Como o app não está notarizado pela Apple, executa este comando no <strong className="text-foreground">Terminal</strong> antes de abrir:
                      </p>
                      <div className="flex items-center gap-2 rounded-lg bg-background border border-border/40 px-4 py-2.5 font-mono text-xs text-foreground/80 select-all cursor-text">
                        xattr -dr com.apple.quarantine /Applications/Knowledge\ AI.app
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          ) : os === "windows" ? (
            <ol className="space-y-5 max-w-lg mx-auto">
              {[
                "Faz download do ficheiro .exe acima",
                "Executa o instalador",
                'Se o Windows Defender bloquear, clica em "Mais informações" → "Executar mesmo assim"',
                "Segue o assistente de instalação e abre o app",
              ].map((text, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/40 bg-secondary/30 text-xs font-medium">
                    {i + 1}
                  </span>
                  <span className="text-sm text-muted-foreground pt-0.5">{text}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground text-center">Linux ainda não é suportado oficialmente.</p>
          )}
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl border border-border/30 bg-secondary/10 p-8"
        >
          <h2 className="font-display text-lg font-semibold mb-6 text-center">O que está incluído</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-foreground/50" />
                {f}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Web alternative */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-12"
        >
          Prefere usar no navegador?{" "}
          <Link to="/login" className="text-foreground underline underline-offset-2 hover:no-underline">
            Acesse a versão web
          </Link>
        </motion.p>
      </main>
    </div>
  );
}
