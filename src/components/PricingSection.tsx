import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STRIPE_TIERS } from "@/lib/stripe-config";

type CellValue = boolean | string;

interface FeatureRow {
  label: string;
  growth: CellValue;
  business: CellValue;
  enterprise: CellValue;
}

const categories: { title: string; rows: FeatureRow[] }[] = [
  {
    title: "Capacidade",
    rows: [
      { label: "Agentes de IA", growth: "Ilimitados", business: "Ilimitados", enterprise: "Ilimitados" },
      { label: "Integrações de dados", growth: "Até 3", business: "Ilimitadas", enterprise: "Ilimitadas" },
      { label: "Usuários", growth: "Ilimitados", business: "Ilimitados", enterprise: "Ilimitados" },
    ],
  },
  {
    title: "Infraestrutura & IA",
    rows: [
      { label: "LLM BYOK (traga sua chave)", growth: true, business: true, enterprise: true },
      { label: "Modelo local (on-prem)", growth: true, business: true, enterprise: true },
      { label: "Modelo local cloud", growth: true, business: true, enterprise: true },
    ],
  },
  {
    title: "Segurança & Compliance",
    rows: [
      { label: "SSO / SAML", growth: false, business: true, enterprise: true },
      { label: "Audit logs", growth: false, business: false, enterprise: true },
      { label: "SLA dedicado", growth: false, business: false, enterprise: true },
    ],
  },
  {
    title: "Suporte & Onboarding",
    rows: [
      { label: "Setup", growth: "Grátis", business: "Variável", enterprise: "Variável" },
      { label: "Onboarding", growth: "Self-service", business: "CSM assistido", enterprise: "White-glove" },
      { label: "Suporte", growth: "E-mail", business: "Prioritário", enterprise: "Dedicado" },
    ],
  },
];

const plans = [
  { key: "growth" as const, ...STRIPE_TIERS.growth },
  { key: "business" as const, ...STRIPE_TIERS.business },
  { key: "enterprise" as const, ...STRIPE_TIERS.enterprise },
];

function CellContent({ value }: { value: CellValue }) {
  if (value === true)
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[hsl(var(--success)/0.15)]">
        <Check className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
      </span>
    );
  if (value === false)
    return <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />;
  return <span className="text-sm font-medium text-foreground">{value}</span>;
}

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
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

        {/* Plan header cards */}
        <div className="grid grid-cols-[1fr] md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-0">
          {/* Empty top-left */}
          <div className="hidden md:block" />

          {plans.map((plan) => {
            const isRec = "recommended" in plan && plan.recommended;
            return (
              <div
                key={plan.key}
                className={`relative p-6 text-center rounded-t-2xl transition-all ${
                  isRec
                    ? "bg-foreground/[0.06] border border-b-0 border-foreground/20 -mt-2 pt-8 z-10"
                    : "bg-foreground/[0.03] border border-b-0 border-border/30"
                }`}
              >
                {isRec && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-foreground text-background text-xs font-semibold px-3 py-0.5">
                      Recomendado
                    </Badge>
                  </div>
                )}
                <h3 className="font-display font-bold text-lg text-foreground">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{plan.description}</p>
                <div className="mt-4 mb-4">
                  <span className="text-3xl font-bold tracking-tight text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground text-sm ml-0.5">{plan.period}</span>
                  )}
                </div>
                {plan.key === "enterprise" ? (
                  <Button
                    variant="outline"
                    className="w-full border-foreground/20 text-foreground hover:bg-foreground/10"
                    onClick={() => {
                      document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Falar com vendas
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${
                      isRec
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "bg-foreground/10 text-foreground hover:bg-foreground/20 border border-foreground/20"
                    }`}
                    asChild
                  >
                    <a href="/signup">Começar trial grátis</a>
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {categories.map((cat, ci) => (
              <div key={ci}>
                {/* Category header */}
                <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] border-b border-foreground/10">
                  <div className="py-4 px-4">
                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      {cat.title}
                    </span>
                  </div>
                  {plans.map((plan) => {
                    const isRec = "recommended" in plan && plan.recommended;
                    return (
                      <div
                        key={plan.key}
                        className={`py-4 ${
                          isRec
                            ? "bg-foreground/[0.06] border-x border-foreground/20"
                            : ci === 0
                            ? "bg-foreground/[0.03] border-x border-border/30"
                            : "border-x border-border/30"
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Feature rows */}
                {cat.rows.map((row, ri) => (
                  <div
                    key={ri}
                    className="grid grid-cols-[1.4fr_1fr_1fr_1fr] border-b border-border/10 hover:bg-foreground/[0.02] transition-colors"
                  >
                    <div className="py-3.5 px-4 text-sm text-muted-foreground flex items-center">
                      {row.label}
                    </div>
                    {(["growth", "business", "enterprise"] as const).map((planKey) => {
                      const plan = plans.find((p) => p.key === planKey)!;
                      const isRec = "recommended" in plan && plan.recommended;
                      return (
                        <div
                          key={planKey}
                          className={`py-3.5 px-4 flex items-center justify-center ${
                            isRec
                              ? "bg-foreground/[0.06] border-x border-foreground/20"
                              : "border-x border-border/30"
                          }`}
                        >
                          <CellContent value={row[planKey]} />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}

            {/* Bottom rounded bar */}
            <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr]">
              <div />
              {plans.map((plan) => {
                const isRec = "recommended" in plan && plan.recommended;
                return (
                  <div
                    key={plan.key}
                    className={`h-6 rounded-b-2xl ${
                      isRec
                        ? "bg-foreground/[0.06] border border-t-0 border-foreground/20"
                        : "bg-foreground/[0.03] border border-t-0 border-border/30"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
