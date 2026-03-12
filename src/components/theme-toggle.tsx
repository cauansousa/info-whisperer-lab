"use client";

import { useEffect, useMemo, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const ORDER: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const active = useMemo(
    () => (theme as "light" | "dark" | "system") ?? "system",
    [theme]
  );

  const icon = active === "light" ? <Sun className="h-4 w-4" /> : active === "dark" ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />;
  const label = active === "light" ? "Modo claro" : active === "dark" ? "Modo escuro" : `Seguir sistema${systemTheme ? ` (${systemTheme})` : ""}`;

  function handleToggle() {
    const idx = ORDER.indexOf(active);
    const next = ORDER[(idx + 1) % ORDER.length];
    setTheme(next);
  }

  if (!mounted) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-9 w-9 rounded-full border border-border/60 bg-background/70 backdrop-blur hover:bg-muted/60"
        )}
        aria-label={label}
        onClick={handleToggle}
        type="button"
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center">
        <p className="text-xs font-medium">Alternar tema ({label})</p>
      </TooltipContent>
    </Tooltip>
  );
}
