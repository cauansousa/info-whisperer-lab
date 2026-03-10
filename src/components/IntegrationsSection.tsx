import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { FileSpreadsheet, Database, FileText, ShieldCheck, Server, Cloud, Lock } from "lucide-react";

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
    <section id="integracoes" className="relative py-16 sm:py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
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

        {/* AI Models — security narrative */}
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Cloud models */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="rounded-2xl border border-border/30 bg-card/30 p-7"
          >
            <div className="mb-4 flex items-center gap-3">
              <Cloud className="h-6 w-6 text-muted-foreground" />
              <h3 className="text-base font-semibold text-foreground">IA na Nuvem</h3>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Acesse os modelos mais avançados do mercado para máxima performance nas respostas.
            </p>
            <div className="flex flex-wrap gap-2">
              {aiModels.filter(m => m.type === "cloud").map((model) => (
                <span key={model.name} className="rounded-full border border-border/40 bg-background/50 px-3 py-1 text-xs text-muted-foreground">
                  {model.name}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Local model — security highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="rounded-2xl border border-primary/30 bg-primary/5 p-7"
          >
            <div className="mb-4 flex items-center gap-3">
              <Server className="h-6 w-6 text-primary" />
              <h3 className="text-base font-semibold text-foreground">IA Privada</h3>
              <span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Recomendado
              </span>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Processe tudo dentro da sua infraestrutura. Seus dados sensíveis nunca saem da empresa.
            </p>
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-2 text-xs text-primary">
                <ShieldCheck className="h-4 w-4" /> Compliance com LGPD e políticas internas
              </span>
              <span className="flex items-center gap-2 text-xs text-primary">
                <Lock className="h-4 w-4" /> Zero exposição de dados a terceiros
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
