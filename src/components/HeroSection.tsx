import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain } from "lucide-react";

const HeroSection = () => {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const y = useTransform(scrollY, [0, 400], [0, 100]);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 grid-bg radial-fade opacity-30" />
      
      {/* Floating orbs */}
      <div className="absolute left-[15%] top-[20%] h-72 w-72 rounded-full bg-primary/8 blur-[120px] animate-float" />
      <div className="absolute right-[10%] top-[40%] h-96 w-96 rounded-full bg-glow-secondary/6 blur-[140px] animate-float-slow" />
      <div className="absolute bottom-[20%] left-[40%] h-48 w-48 rounded-full bg-primary/5 blur-[80px] animate-float" />

      <motion.div style={{ opacity, y }} className="container relative z-10 mx-auto max-w-5xl px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-medium uppercase tracking-widest text-primary backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
            Gestão de Conhecimento Inteligente
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mt-8 font-display text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl lg:text-8xl"
        >
          O conhecimento certo,
          <br />
          <span className="text-gradient">na hora certa.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
        >
          Knowledge AI transforma dados internos da sua empresa em agentes conversacionais inteligentes — com controle total de acesso e compartilhamento.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Button variant="hero" size="xl">
            Começar Agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button variant="hero-outline" size="lg">
            Saiba Mais
          </Button>
        </motion.div>

        {/* Visual element - floating nodes */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1.2, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative mx-auto mt-20 max-w-3xl"
        >
          <div className="glass rounded-2xl p-1">
            <div className="rounded-xl bg-card/80 p-8 md:p-12">
              {/* Mock chat interface */}
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 border border-primary/20">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-xl rounded-tl-none bg-secondary/50 px-4 py-3 text-sm text-secondary-foreground">
                    Olá! Sou o agente de RH. Posso ajudar com políticas internas, benefícios e procedimentos. O que você precisa?
                  </div>
                </div>
                <div className="flex items-start justify-end gap-3">
                  <div className="rounded-xl rounded-tr-none bg-primary/15 px-4 py-3 text-sm text-foreground">
                    Qual é a política de trabalho remoto?
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 border border-primary/20">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-xl rounded-tl-none bg-secondary/50 px-4 py-3 text-sm text-secondary-foreground">
                    <span className="text-primary font-medium">Biblioteca: Políticas RH 2026</span>
                    <br />
                    Colaboradores podem trabalhar remotamente até 3 dias por semana, mediante aprovação do gestor direto...
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Glow under the card */}
          <div className="absolute -bottom-10 left-1/2 h-20 w-3/4 -translate-x-1/2 rounded-full bg-primary/10 blur-[60px]" />
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex h-8 w-5 items-start justify-center rounded-full border border-muted-foreground/30 p-1">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="h-1.5 w-1 rounded-full bg-muted-foreground/60"
          />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
