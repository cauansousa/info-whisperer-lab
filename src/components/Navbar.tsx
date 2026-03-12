import { motion, AnimatePresence } from "framer-motion";
import { Brain, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Contato", href: "#contato" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating menu button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-300 hover:border-foreground/20 hover:bg-card"
      >
        <Menu className="h-4 w-4 text-foreground" />
      </button>

      {/* Side panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-border/30 bg-card/95 backdrop-blur-2xl"
            >
              {/* Close button */}
              <div className="flex items-center justify-between p-6">
                <a href="#" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-secondary/50">
                    <Brain className="h-4 w-4 text-foreground" />
                  </div>
                  <span className="font-display text-sm font-semibold text-foreground">
                    Knowledge AI
                  </span>
                </a>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-secondary"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex flex-1 flex-col gap-1 px-4 pt-4">
                {navItems.map((item, i) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                    className="group flex items-center rounded-lg px-4 py-3 text-sm text-muted-foreground transition-all duration-200 hover:bg-secondary/50 hover:text-foreground"
                  >
                    <span className="mr-3 h-px w-4 bg-muted-foreground/30 transition-all duration-300 group-hover:w-6 group-hover:bg-foreground" />
                    {item.label}
                  </motion.a>
                ))}
              </nav>

              {/* Bottom CTA */}
              <div className="border-t border-border/30 p-6">
                <motion.a
                  href="/login"
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex w-full items-center justify-center rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-80"
                >
                  Entrar
                </motion.a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
