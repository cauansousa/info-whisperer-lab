import { Brain } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border/50 py-12">
    <div className="container mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <span className="font-display text-lg font-semibold text-foreground">
            Knowledge <span className="text-primary">AI</span>
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Knowledge AI. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
