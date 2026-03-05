import { motion, useInView } from "framer-motion";
import { useRef } from "react";

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
  { name: "OpenAI GPT", logo: "/images/openai-logo.png", category: "LLM Cloud" },
  { name: "Google Gemini", logo: "/images/gemini-logo.png", category: "LLM Cloud" },
  { name: "Anthropic Claude", logo: "/images/claude-logo.png", category: "LLM Cloud" },
  { name: "Meta Llama", logo: "/images/llama-logo.png", category: "LLM Open Source" },
  { name: "Modelo Local", logo: "/images/local-model-logo.png", category: "On-Premise" },
];

const IntegrationCard = ({
  item,
  index,
}: {
  item: { name: string; logo: string; category: string };
  index: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className="group flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm transition-all duration-500 hover:border-primary/30 hover:bg-card/60"
    >
      <div className="flex h-14 w-28 items-center justify-center rounded-lg bg-white/90 p-2.5">
        <img
          src={item.logo}
          alt={`${item.name} logo`}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      </div>
      <div className="text-center">
        <h3 className="font-display text-sm font-semibold text-foreground">
          {item.name}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{item.category}</p>
      </div>
    </motion.div>
  );
};

const IntegrationsSection = () => {
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true, margin: "-80px" });
  const modelsRef = useRef(null);
  const modelsInView = useInView(modelsRef, { once: true, margin: "-80px" });

  return (
    <section id="integracoes" className="relative py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto max-w-6xl px-6">
        {/* Section header */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
            Integrações
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
            Conecte-se com suas{" "}
            <span className="text-gradient">ferramentas favoritas</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Importe dados de qualquer fonte e escolha o modelo de IA ideal para o seu caso de uso — inclusive modelos locais.
          </p>
        </motion.div>

        {/* Data Sources */}
        <div className="mb-12">
          <h3 className="mb-6 text-center font-display text-lg font-semibold text-muted-foreground uppercase tracking-wider">
            Fontes de Dados
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {dataSources.map((item, index) => (
              <IntegrationCard key={item.name} item={item} index={index} />
            ))}
          </div>
        </div>

        {/* AI Models */}
        <motion.div
          ref={modelsRef}
          initial={{ opacity: 0, y: 30 }}
          animate={modelsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h3 className="mb-6 text-center font-display text-lg font-semibold text-muted-foreground uppercase tracking-wider">
            Modelos de IA
          </h3>
          <p className="mx-auto mb-8 max-w-xl text-center text-sm text-muted-foreground">
            Escolha o modelo que melhor se adapta à sua necessidade. Use provedores cloud ou rode um modelo local na sua própria infraestrutura.
          </p>
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {aiModels.map((item, index) => (
              <IntegrationCard key={item.name} item={item} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
