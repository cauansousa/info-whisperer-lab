import { motion, useScroll, useTransform } from "framer-motion";
import ParticleNetwork from "@/components/ParticleNetwork";

const HeroSection = () => {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 0.95]);
  const y = useTransform(scrollY, [0, 500], [0, 80]);

  const letterVariants = {
    hidden: { opacity: 0, y: 60, rotateX: -40 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.8,
        delay: 0.3 + i * 0.04,
        ease: [0.21, 0.47, 0.32, 0.98] as [number, number, number, number],
      },
    }),
  };

  const words1 = "Conhecimento".split("");
  const words2 = "conectado.".split("");

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <ParticleNetwork />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,hsl(var(--background))_80%)]" />

      <motion.div
        style={{ opacity, scale, y }}
        className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6"
      >
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6"
          >
            <span className="inline-block text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Knowledge AI
            </span>
          </motion.div>

          <h1 className="font-display text-4xl font-bold leading-[0.95] tracking-tight sm:text-6xl md:text-8xl lg:text-[9rem]">
            <span className="block overflow-hidden" style={{ perspective: "600px" }}>
              {words1.map((char, i) => (
                <motion.span
                  key={`l1-${i}`}
                  custom={i}
                  variants={letterVariants}
                  initial="hidden"
                  animate="visible"
                  className="inline-block"
                  style={{ transformOrigin: "bottom" }}
                >
                  {char}
                </motion.span>
              ))}
            </span>
            <span className="mt-2 block overflow-hidden" style={{ perspective: "600px" }}>
              {words2.map((char, i) => (
                <motion.span
                  key={`l2-${i}`}
                  custom={i + words1.length}
                  variants={letterVariants}
                  initial="hidden"
                  animate="visible"
                  className="inline-block text-muted-foreground/40"
                  style={{ transformOrigin: "bottom" }}
                >
                  {char}
                </motion.span>
              ))}
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.4 }}
            className="mx-auto mt-10 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            Transforme dados internos em agentes inteligentes.
            <br />
            <span className="text-foreground/60">Controle total. Acesso granular. Zero fricção.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.8 }}
            className="mt-12 flex items-center justify-center"
          >
            <a
              href="#solicitar-acesso"
              className="group relative text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Solicitar acesso antecipado ↓
              <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
            </a>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-8 w-px bg-gradient-to-b from-transparent via-muted-foreground/40 to-transparent"
        />
      </motion.div>
    </section>
  );
};

export default HeroSection;
