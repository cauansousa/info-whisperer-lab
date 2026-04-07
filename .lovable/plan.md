

# SaaS — Planos e Billing do Knowledge AI

## Planos definidos

| | **Growth** | **Business** | **Enterprise** |
|---|---|---|---|
| Preço | R$4.500/mês (anual) | R$11.000/mês (anual) | Sob medida (ACV mín. R$250k) |
| ICP | 200–500 funcionários | 500–1.500 funcionários | 1.500+ / regulados |
| LLM | BYOK | BYOK | BYOK |
| Integrações | Até 3 | Ilimitadas | Ilimitadas |
| Agentes | Ilimitados | Ilimitados | Ilimitados |
| SSO/SAML | — | ✓ | ✓ |
| Setup | Grátis | Variável | Variável |
| Onboarding | Self-service | CSM assistido | White-glove |

Trial: 14 dias grátis no plano Growth, depois precisa assinar.

---

## O que será construído

### 1. Habilitar Stripe
- Integração nativa do Lovable para configurar Stripe
- Criar 2 produtos com preços (Growth e Business — Enterprise é "Fale conosco")

### 2. Página de Pricing na Landing
- Nova seção `PricingSection` entre ROI Calculator e CTA
- 3 cards comparativos com features acima
- Growth: "Começar trial grátis" | Business: "Começar trial grátis" | Enterprise: "Falar com vendas"
- Destaque visual no Business (recomendado)

### 3. Tabela de subscriptions
```sql
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'trial',
  status text not null default 'trialing',
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 4. Edge Functions para Stripe
- `create-checkout`: sessão de checkout com plano selecionado
- `stripe-webhook`: escuta eventos e atualiza `subscriptions`
- `create-portal`: link do portal do cliente Stripe

### 5. Signup público com trial
- Abrir `/signup` para cadastro público
- Criar subscription com `plan = 'trial'` e `trial_ends_at = now() + 14 days`

### 6. Billing no Settings
- Aba "Plano e Cobrança" com plano atual, status, dias restantes
- Botões upgrade (Stripe Checkout) e gerenciar (Stripe Portal)

### 7. Trial banner + PlanGate
- Banner no dashboard: "Seu trial expira em X dias"
- Hook `usePlan()` com `plan`, `isTrialing`, `daysLeft`
- `PlanGate` para limitar integrações (até 3 no Growth)

---

## Ordem de implementação
1. Habilitar Stripe
2. Criar tabela `subscriptions`
3. Edge functions (checkout, webhook, portal)
4. `PricingSection` na landing
5. Signup público + trial
6. Aba Billing no Settings
7. Trial banner + PlanGate

## Arquivos envolvidos
- `src/components/PricingSection.tsx` — novo
- `src/pages/Index.tsx` — adicionar PricingSection
- `src/pages/Signup.tsx` — abrir acesso público
- `src/pages/Settings.tsx` — aba Billing
- `src/hooks/usePlan.ts` — novo
- `src/components/PlanGate.tsx` — novo
- `src/components/TrialBanner.tsx` — novo
- `supabase/functions/create-checkout/` — novo
- `supabase/functions/stripe-webhook/` — novo
- `supabase/functions/create-portal/` — novo

