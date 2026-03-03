import { motion, useScroll, useTransform } from "framer-motion";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 100], [0, 0.8]);
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 1]);

  return (
    <motion.nav
      style={{
        backgroundColor: `hsl(0 0% 3% / ${bgOpacity})`,
      }}
      className="fixed top-0 z-50 w-full backdrop-blur-xl"
    >
      <motion.div
        style={{ opacity: borderOpacity }}
        className="absolute bottom-0 left-0 right-0 h-px bg-border/50"
      />
      <div className="container mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 transition-all duration-300 group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
            <Brain className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
          </div>
          <span className="font-display text-lg font-semibold text-foreground">
            Knowledge <span className="text-primary">AI</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {["Funcionalidades", "Como Funciona", "Contato"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="relative text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {item}
            </a>
          ))}
        </div>

        <Button variant="hero" size="sm">
          Acesso Antecipado
        </Button>
      </div>
    </motion.nav>
  );
};

export default Navbar;
