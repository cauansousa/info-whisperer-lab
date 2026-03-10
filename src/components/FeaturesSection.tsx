import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, FolderLock, Users, MessageSquare, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Brain,
    title: "Agentes Conversacionais",
    description: "Crie agentes inteligentes treinados com os dados da sua empresa. Respostas precisas, contextuais e instantâneas.",
  },
  {
    icon: FolderLock,
    title: "Bibliotecas de Conhecimento",
    description: "Organize seus dados em bibliotecas — como pastas inteligentes que alimentam seus agentes com informação relevante.",
  },
  {
    icon: Users,
    title: "Compartilhamento Granular",
    description: "Compartilhe bibliotecas com setores inteiros ou pessoas específicas. O controle está nas mãos dos gestores.",
  },
  {
    icon: Shield,
    title: "Governança e Controle",
    description: "Apenas superiores autorizados podem criar e compartilhar bibliotecas. Hierarquia respeitada, dados protegidos.",
  },
  {
    icon: MessageSquare,
    title: "Conversas Naturais",
    description: "Funcionários interagem naturalmente com os agentes, como se estivessem conversando com um colega especialista.",
  },
  {
    icon: Sparkles,
    title: "Aprendizado Contínuo",
    description: "À medida que novas informações são adicionadas às bibliotecas, os agentes se atualizam automaticamente.",
  },
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="group relative rounded-xl border border-border/50 bg-card/40 p-8 backdrop-blur-sm transition-all duration-500 hover:border-primary/30 hover:bg-card/60"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" 
        style={{ 
          background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), hsl(200 100% 55% / 0.06), transparent 40%)'
        }} 
      />
      
      <div className="relative z-10">
        <div className="mb-5 inline-flex rounded-lg border border-primary/20 bg-primary/10 p-3 transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary/15 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
          <Icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
        </div>
        <h3 className="mb-3 font-display text-lg font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
          {feature.title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-secondary-foreground">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
};

const FeaturesSection = () => {
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true, margin: "-80px" });

  return (
    <section id="features" className="relative py-16 sm:py-32">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
            Funcionalidades
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            Tudo que você precisa para{" "}
            <span className="text-gradient">gerir conhecimento</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Uma plataforma completa para organizar, compartilhar e acessar o conhecimento da sua empresa de forma inteligente.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
