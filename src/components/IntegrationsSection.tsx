import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const integrations = [
  { name: "GitHub", logo: "/images/github-logo.svg", category: "Versionamento" },
  { name: "Databricks", logo: "/images/databricks-logo.png", category: "Engenharia de Dados" },
  { name: "Snowflake", logo: "/images/snowflake-logo.svg", category: "Data Warehouse" },
  { name: "BigQuery", logo: "/images/bigquery-logo.svg", category: "Data Warehouse" },
  { name: "PostgreSQL", logo: "/images/postgresql-logo.svg", category: "Banco de Dados" },
  { name: "MongoDB", logo: "/images/mongodb-logo.svg", category: "Banco de Dados" },
  { name: "MySQL", logo: "/images/mysql-logo.svg", category: "Banco de Dados" },
  { name: "Amazon Redshift", logo: "/images/redshift-logo.svg", category: "Data Warehouse" },
];

const IntegrationsSection = () => {
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true, margin: "-80px" });

  return (
    <section id="integracoes" className="relative py-32">
      {/* Subtle top divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto max-w-6xl px-6">
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
            Importe dados de repositórios, data warehouses e bancos de dados. Suas fontes de conhecimento, unificadas em um só lugar.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {integrations.map((integration, index) => (
            <IntegrationCard key={integration.name} integration={integration} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

const IntegrationCard = ({
  integration,
  index,
}: {
  integration: (typeof integrations)[0];
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
      className="group flex flex-col items-center gap-4 rounded-xl border border-border/50 bg-card/40 p-6 backdrop-blur-sm transition-all duration-500 hover:border-primary/30 hover:bg-card/60"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border/30 bg-secondary/30 p-3 transition-all duration-300 group-hover:border-primary/20 group-hover:bg-secondary/50">
        <img
          src={integration.logo}
          alt={`${integration.name} logo`}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      </div>
      <div className="text-center">
        <h3 className="font-display text-sm font-semibold text-foreground">
          {integration.name}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{integration.category}</p>
      </div>
    </motion.div>
  );
};

export default IntegrationsSection;
