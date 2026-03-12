"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Database, Share2, Bot, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Database,
    title: "Crie Bibliotecas",
    description: "Gestores criam bibliotecas e fazem upload de documentos, manuais, políticas e qualquer dado relevante da empresa.",
    color: "primary",
  },
  {
    number: "02",
    icon: Share2,
    title: "Compartilhe com Controle",
    description: "Defina quem acessa o quê. Compartilhe com setores inteiros ou colaboradores específicos, mantendo a governança.",
    color: "accent",
  },
  {
    number: "03",
    icon: Bot,
    title: "Converse com Agentes",
    description: "Funcionários acessam agentes treinados com as bibliotecas compartilhadas e obtêm respostas instantâneas e precisas.",
    color: "primary",
  },
];

const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="relative overflow-hidden py-16 sm:py-32">
      {/* Background grid */}
      <div className="absolute inset-0 grid-bg radial-fade opacity-40" />

      <div className="container relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-accent">
            Como Funciona
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            Simples.{" "}
            <span className="text-gradient">Poderoso.</span>{" "}
            Seguro.
          </h2>
        </motion.div>

        <div className="relative flex flex-col gap-8 lg:flex-row lg:gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
                className="group relative flex-1"
              >
                <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/30 p-5 sm:p-8 backdrop-blur-sm transition-all duration-500 hover:border-primary/30 hover:bg-card/50">
                  {/* Animated number background */}
                  <span className="absolute -right-4 -top-6 font-display text-[120px] font-bold leading-none text-foreground/[0.03] transition-all duration-500 group-hover:text-primary/[0.06] group-hover:scale-110">
                    {step.number}
                  </span>

                  <div className="relative z-10">
                    <div className="mb-6 inline-flex rounded-xl border border-primary/20 bg-primary/10 p-4 transition-all duration-500 group-hover:rotate-3 group-hover:scale-110 group-hover:border-primary/40 group-hover:shadow-[0_0_30px_color-mix(in_oklch,var(--primary)_30%,transparent)]">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Arrow connector */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-5 top-1/2 z-20 -translate-y-1/2">
                    <ArrowRight className="h-5 w-5 text-muted-foreground/40 animate-pulse-glow" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
