import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ShieldCheck, Server, Cloud } from "lucide-react";

const dataSources = [
  { name: "GitHub", logo: "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png" },
  { name: "Databricks", logo: "https://upload.wikimedia.org/wikipedia/commons/6/63/Databricks_Logo.png" },
  { name: "Snowflake", logo: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Snowflake_Logo.svg" },
  { name: "BigQuery", logo: "https://cdn.worldvectorlogo.com/logos/google-bigquery-logo-1.svg" },
  { name: "PostgreSQL", logo: "https://www.postgresql.org/media/img/about/press/elephant.png" },
  { name: "MongoDB", logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/MongoDB_Logo.svg" },
  { name: "MySQL", logo: "https://www.mysql.com/common/logos/logo-mysql-170x115.png" },
  { name: "Amazon Redshift", logo: "https://upload.wikimedia.org/wikipedia/commons/7/73/Amazon-Redshift-Logo.svg" },
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
            Suas fontes.{" "}
            <span className="text-gradient">Seu modelo.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Conecte seus dados e escolha o modelo de IA — inclusive modelos locais para máxima segurança.
          </p>
        </motion.div>

        {/* Data sources strip */}
        <div className="mb-16 flex flex-wrap items-center justify-center gap-5 md:gap-8">
          {dataSources.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
              className="group flex flex-col items-center gap-2"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border/40 bg-white/90 p-2.5 transition-transform duration-300 group-hover:scale-110">
                <img src={item.logo} alt={item.name} className="h-full w-full object-contain" loading="lazy" />
              </div>
              <span className="text-[11px] text-muted-foreground">{item.name}</span>
            </motion.div>
          ))}
        </div>

        {/* AI Models — clean list with security highlight */}
        <div className="mx-auto grid max-w-3xl gap-2">
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
