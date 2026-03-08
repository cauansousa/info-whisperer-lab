import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { FileSpreadsheet, Database, FileText, ShieldCheck, Server, Cloud } from "lucide-react";

const dataSources = [
  { name: "Planilhas & Excel", icon: FileSpreadsheet, description: "Importe direto do Excel, Google Sheets e outros" },
  { name: "Bancos de Dados", icon: Database, description: "Conecte qualquer banco de dados da sua empresa" },
  { name: "Documentos", icon: FileText, description: "PDFs, CSVs, relatórios e arquivos internos" },
];

const aiModels = [
  { name: "OpenAI GPT", type: "cloud" as const },
  { name: "Google Gemini", type: "cloud" as const },
  { name: "Anthropic Claude", type: "cloud" as const },
  { name: "Meta Llama", type: "cloud" as const },
  { name: "Modelo Local", type: "local" as const },
];

const IntegrationsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="integracoes" className="relative py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto max-w-6xl px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
            Integrações
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
            Conecte os dados que{" "}
            <span className="text-gradient">você já tem.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Planilhas, bancos de dados ou documentos — tudo vira inteligência em minutos.
          </p>
        </motion.div>

        {/* Data sources — simple cards */}
        <div className="mb-16 grid gap-4 md:grid-cols-3">
          {dataSources.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border/30 bg-card/30 p-8 text-center transition-all duration-300 hover:bg-card/50"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/5">
                <item.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* AI Models */}
        <div className="mx-auto grid max-w-3xl gap-2">
          <p className="mb-3 text-center text-sm font-medium text-muted-foreground">
            Escolha o modelo de IA ideal para sua operação
          </p>
          {aiModels.map((model, i) => (
            <motion.div
              key={model.name}
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 + i * 0.06, duration: 0.4 }}
              className={`flex items-center gap-4 rounded-xl border px-5 py-4 transition-all duration-300 ${
                model.type === "local"
                  ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                  : "border-border/30 bg-card/30 hover:bg-card/50"
              }`}
            >
              {model.type === "local" ? (
                <Server className="h-5 w-5 shrink-0 text-primary" />
              ) : (
                <Cloud className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <span className="flex-1 text-sm font-medium text-foreground">{model.name}</span>
              {model.type === "local" && (
                <span className="flex items-center gap-1.5 text-[11px] text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Dados nunca saem da sua rede
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
