import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  CreditCard,
  Check,
  ExternalLink,
  Crown,
  Star,
  Sparkles,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlan } from "@/hooks/usePlan";
import { STRIPE_TIERS } from "@/lib/stripe-config";
import { authSupabase } from "@/lib/auth-client";
import { supabase } from "@/integrations/supabase/client";

const CURRENT_VERSION = "0.1.5";
const GITHUB_REPO = "cauansousa/info-whisperer-lab";

export default function Settings() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = searchParams.get("tab") || "general";
  const billingStatus = searchParams.get("status");

  const [language, setLanguage] = useState("pt-BR");
  const [theme, setTheme] = useState("dark");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const { plan, subscribed, subscriptionEnd, loading: planLoading, refetch } = usePlan();

  useEffect(() => {
    if (billingStatus === "success") {
      refetch();
    }
  }, [billingStatus, refetch]);

  useEffect(() => {
    async function fetchLatestRelease() {
      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        if (res.ok) {
          const data = await res.json();
          setLatestVersion(data.tag_name?.replace(/^v/, "") || null);
        }
      } catch {
        /* ignore */
      }
    }
    fetchLatestRelease();
  }, []);

  const isUpToDate = latestVersion ? CURRENT_VERSION >= latestVersion : null;

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case "starter":
        return <Star className="h-5 w-5" />;
      case "pro":
        return <Sparkles className="h-5 w-5" />;
      case "business":
        return <Crown className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  const getPlanColor = (tier: string) => {
    switch (tier) {
      case "starter":
        return "border-blue-500/30 bg-blue-500/5";
      case "pro":
        return "border-purple-500/30 bg-purple-500/5";
      case "business":
        return "border-amber-500/30 bg-amber-500/5";
      default:
        return "border-border";
    }
  };

  const getBadgeVariant = (tier: string) => {
    switch (tier) {
      case "starter":
        return "default";
      case "pro":
        return "secondary";
      case "business":
        return "outline";
      default:
        return "default";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCheckout = async (priceId: string) => {
    setCheckoutLoading(priceId);
    try {
      const { data: { session } } = await authSupabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      console.error("Checkout error:", err);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data: { session } } = await authSupabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      console.error("Portal error:", err);
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie suas preferências e assinatura</p>
        </div>
      </div>

      {billingStatus === "success" && (
        <div className="mb-6 p-4 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400">
          ✅ Assinatura realizada com sucesso! Seu plano foi atualizado.
        </div>
      )}
      {billingStatus === "cancelled" && (
        <div className="mb-6 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
          ⚠️ O checkout foi cancelado. Você pode tentar novamente quando quiser.
        </div>
      )}

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Plano & Billing
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências</CardTitle>
              <CardDescription>Ajuste o idioma e o tema do aplicativo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Idioma</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (BR)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tema</label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sobre</CardTitle>
              <CardDescription>Informações da aplicação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Versão atual</span>
                <Badge variant="outline">{CURRENT_VERSION}</Badge>
              </div>
              {latestVersion && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Última versão</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={isUpToDate ? "default" : "destructive"}>
                      {latestVersion}
                    </Badge>
                    {isUpToDate ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <a
                        href={`https://github.com/${GITHUB_REPO}/releases/latest`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Seu Plano Atual</CardTitle>
              <CardDescription>
                {planLoading
                  ? "Carregando informações do plano..."
                  : subscribed
                  ? `Você está no plano ${plan?.charAt(0).toUpperCase()}${plan?.slice(1)}`
                  : "Você ainda não possui um plano ativo"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {planLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando assinatura...
                </div>
              ) : subscribed && plan ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${getPlanColor(plan)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {getPlanIcon(plan)}
                      <span className="font-semibold text-lg capitalize">{plan}</span>
                      <Badge variant={getBadgeVariant(plan)}>Ativo</Badge>
                    </div>
                    {subscriptionEnd && (
                      <p className="text-sm text-muted-foreground">
                        Próxima renovação: {formatDate(subscriptionEnd)}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" onClick={handleManageSubscription} disabled={portalLoading}>
                    {portalLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Abrindo portal...</>
                    ) : (
                      <><ExternalLink className="h-4 w-4 mr-2" /> Gerenciar Assinatura</>
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">Escolha um plano abaixo para começar.</p>
              )}
            </CardContent>
          </Card>

          {/* Plans */}
          <div className="grid gap-6 md:grid-cols-3">
            {STRIPE_TIERS.map((tier) => {
              const isCurrentPlan = plan === tier.key;
              return (
                <Card
                  key={tier.key}
                  className={`relative ${
                    isCurrentPlan ? getPlanColor(tier.key) : ""
                  } ${tier.key === "pro" ? "border-purple-500/50" : ""}`}
                >
                  {tier.key === "pro" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-purple-600 text-white">Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      {getPlanIcon(tier.key)}
                      <CardTitle className="capitalize">{tier.key}</CardTitle>
                    </div>
                    <CardDescription>{tier.description}</CardDescription>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {isCurrentPlan ? (
                      <Button variant="outline" className="w-full" disabled>
                        Plano Atual
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant={tier.key === "pro" ? "default" : "outline"}
                        onClick={() => handleCheckout(tier.priceId)}
                        disabled={!!checkoutLoading}
                      >
                        {checkoutLoading === tier.priceId ? (
                          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
                        ) : (
                          `Assinar ${tier.key.charAt(0).toUpperCase() + tier.key.slice(1)}`
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
