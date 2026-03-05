import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, ShieldCheck, Server, Cloud } from "lucide-react";

const dataSources = [
  { name: "GitHub", logo: "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png", category: "Versionamento" },
  { name: "Databricks", logo: "https://upload.wikimedia.org/wikipedia/commons/6/63/Databricks_Logo.png", category: "Engenharia de Dados" },
  { name: "Snowflake", logo: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Snowflake_Logo.svg", category: "Data Warehouse" },
  { name: "BigQuery", logo: "https://cdn.worldvectorlogo.com/logos/google-bigquery-logo-1.svg", category: "Data Warehouse" },
  { name: "PostgreSQL", logo: "https://www.postgresql.org/media/img/about/press/elephant.png", category: "Banco de Dados" },
  { name: "MongoDB", logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/MongoDB_Logo.svg", category: "Banco de Dados" },
  { name: "MySQL", logo: "https://www.mysql.com/common/logos/logo-mysql-170x115.png", category: "Banco de Dados" },
  { name: "Amazon Redshift", logo: "https://upload.wikimedia.org/wikipedia/commons/7/73/Amazon-Redshift-Logo.svg", category: "Data Warehouse" },
];

const aiModels = [
  { name: "OpenAI GPT", type: "cloud" as const },
  { name: "Google Gemini", type: "cloud" as const },
  { name: "Anthropic Claude", type: "cloud" as const },
  { name: "Meta Llama", type: "cloud" as const },
  { name: "Modelo Local", type: "local" as const },
];

const IntegrationsSection = () => {
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true, margin: "-80px" });
  const modelsRef = useRef(null);
  const modelsInView = useInView(modelsRef, { once: true, margin: "-80px" });

  return (
    <section id="integracoes" className="relative py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
            Integrações
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
            Conecte-se com suas{" "}
            <span className="text-gradient">ferramentas favoritas</span>
          </h2>
        </motion.div>

        {/* Data Sources — horizontal scroll strip */}
        <div className="mb-20">
          <p className="mb-8 text-center text-sm uppercase tracking-widest text-muted-foreground">
            Fontes de Dados
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {dataSources.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="group flex flex-col items-center gap-2"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/40 bg-white/90 p-3 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <img
                    src={item.logo}
                    alt={`${item.name} logo`}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>
                <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                  {item.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Models — narrative approach */}
        <motion.div
          ref={modelsRef}
          initial={{ opacity: 0, y: 40 }}
          animate={modelsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="rounded-2xl border border-border/40 bg-card/30 p-8 md:p-12"
        >
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            {/* Left — narrative */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium uppercase tracking-wider text-primary">
                  Segurança primeiro
                </span>
              </div>
              <h3 className="mb-4 font-display text-2xl font-bold leading-tight md:text-3xl">
                Escolha o modelo.{" "}
                <span className="text-muted-foreground">Proteja seus dados.</span>
              </h3>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                Use os melhores modelos do mercado via cloud — ou rode um modelo local na sua própria infraestrutura. 
                Seus dados sensíveis nunca precisam sair do seu ambiente.
              </p>
              <div className="flex items-start gap-3 rounded-lg border border-border/30 bg-secondary/30 p-4">
                <Server className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Modelo Local (On-Premise)</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Dados 100% dentro da sua rede. Compliance total com LGPD e regulamentações internas. Zero dependência de APIs externas.
                  </p>
                </div>
              </div>
            </div>

            {/* Right — model list */}
            <div className="space-y-3">
              {aiModels.map((model, i) => (
                <motion.div
                  key={model.name}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                  className={`group flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 hover:bg-card/60 ${
                    model.type === "local"
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/40 bg-card/20"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    model.type === "local" 
                      ? "border border-primary/30 bg-primary/10" 
                      : "border border-border/30 bg-secondary/40"
                  }`}>
                    {model.type === "local" ? (
                      <Server className="h-5 w-5 text-primary" />
                    ) : (
                      <Brain className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{model.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {model.type === "local" ? "On-Premise · Seus servidores" : "Cloud · API"}
                    </p>
                  </div>
                  {model.type === "local" && (
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                      Seguro
                    </span>
                  )}
                  {model.type === "cloud" && (
                    <Cloud className="h-4 w-4 text-muted-foreground/50" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
