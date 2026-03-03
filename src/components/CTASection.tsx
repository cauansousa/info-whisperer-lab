import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-32">
      <div className="container mx-auto max-w-4xl px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/50 to-glow-secondary/10 p-12 text-center md:p-20"
        >
          {/* Animated orbs */}
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-[100px] animate-float" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-glow-secondary/10 blur-[100px] animate-float-slow" />

          <div className="relative z-10">
            <h2 className="font-display text-3xl font-bold leading-tight md:text-5xl">
              Pronto para transformar a{" "}
              <span className="text-gradient">gestão de conhecimento</span>{" "}
              da sua empresa?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Junte-se às empresas que já estão usando Knowledge AI para empoderar seus times com informação acessível e segura.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button variant="hero" size="xl">
                Solicitar Acesso Antecipado
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="hero-outline" size="lg">
                Falar com Especialista
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
