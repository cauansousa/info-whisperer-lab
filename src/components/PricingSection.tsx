import { Check, X, Minus } from "lucide-react";
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
  if (value === true) return <Check className="h-5 w-5 text-[hsl(var(--success))] mx-auto" />;
  if (value === false) return <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />;
  return <span className="text-sm text-foreground">{value}</span>;
}

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
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

        {/* Header row with plan cards */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-[35%] p-0" />
                {plans.map((plan) => {
                  const isRec = "recommended" in plan && plan.recommended;
                  return (
                    <th
                      key={plan.key}
                      className={`w-[21.6%] p-4 text-center align-bottom rounded-t-xl ${
                        isRec
                          ? "bg-primary/5 border border-b-0 border-primary/30"
                          : "bg-card/60 border border-b-0 border-border/40"
                      }`}
                    >
                      {isRec && (
                        <Badge className="bg-primary text-primary-foreground mb-2 text-xs">
                          Recomendado
                        </Badge>
                      )}
                      <div className="font-display font-bold text-lg text-foreground">{plan.name}</div>
                      <p className="text-xs text-muted-foreground mt-1 font-normal">{plan.description}</p>
                      <div className="mt-3">
                        <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                        {plan.period && (
                          <span className="text-muted-foreground text-sm font-normal">{plan.period}</span>
                        )}
                      </div>
                      <div className="mt-4">
                        {plan.key === "enterprise" ? (
                          <Button
                            variant="hero-outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" });
                            }}
                          >
                            Falar com vendas
                          </Button>
                        ) : (
                          <Button
                            variant={isRec ? "hero" : "hero-outline"}
                            size="sm"
                            className="w-full"
                            asChild
                          >
                            <a href="/signup">Começar trial grátis</a>
                          </Button>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {categories.map((cat, ci) => (
                <>
                  {/* Category header */}
                  <tr key={`cat-${ci}`}>
                    <td
                      colSpan={4}
                      className="pt-6 pb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/30"
                    >
                      {cat.title}
                    </td>
                  </tr>

                  {/* Feature rows */}
                  {cat.rows.map((row, ri) => (
                    <tr
                      key={`row-${ci}-${ri}`}
                      className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-2 text-sm text-foreground">{row.label}</td>
                      {(["growth", "business", "enterprise"] as const).map((planKey) => {
                        const plan = plans.find((p) => p.key === planKey)!;
                        const isRec = "recommended" in plan && plan.recommended;
                        return (
                          <td
                            key={planKey}
                            className={`py-3 px-4 text-center ${
                              isRec
                                ? "bg-primary/5 border-x border-primary/30"
                                : "bg-card/60 border-x border-border/40"
                            }`}
                          >
                            <CellContent value={row[planKey]} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>

            {/* Bottom border rounding */}
            <tfoot>
              <tr>
                <td className="p-0" />
                {plans.map((plan) => {
                  const isRec = "recommended" in plan && plan.recommended;
                  return (
                    <td
                      key={plan.key}
                      className={`h-4 rounded-b-xl ${
                        isRec
                          ? "bg-primary/5 border border-t-0 border-primary/30"
                          : "bg-card/60 border border-t-0 border-border/40"
                      }`}
                    />
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
