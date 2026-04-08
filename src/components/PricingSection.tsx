import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STRIPE_TIERS } from "@/lib/stripe-config";

const tiers = [
  { key: "starter" as const, ...STRIPE_TIERS.starter },
  { key: "growth" as const, ...STRIPE_TIERS.growth },
  { key: "business" as const, ...STRIPE_TIERS.business },
  { key: "enterprise" as const, ...STRIPE_TIERS.enterprise },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/30 text-muted-foreground">
            Planos
          </Badge>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Escolha o plano ideal para sua empresa
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comece com 14 dias grátis. Sem compromisso, cancele quando quiser.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const isRecommended = "recommended" in tier && tier.recommended;
            return (
              <Card
                key={tier.key}
                className={`relative flex flex-col border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 ${
                  isRecommended
                    ? "border-primary/60 shadow-[0_0_30px_hsl(var(--primary)/0.1)] scale-[1.02]"
                    : ""
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3">
                      Recomendado
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-display">{tier.name}</CardTitle>
                  <CardDescription className="text-sm">{tier.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                    {tier.period && (
                      <span className="text-muted-foreground text-sm">{tier.period}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Setup: {tier.setup}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-[hsl(var(--success))] mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {tier.key === "enterprise" ? (
                    <Button
                      variant="hero-outline"
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      Falar com vendas
                    </Button>
                  ) : (
                    <Button
                      variant={isRecommended ? "hero" : "hero-outline"}
                      size="lg"
                      className="w-full"
                      asChild
                    >
                      <a href="/signup">Começar trial grátis</a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
