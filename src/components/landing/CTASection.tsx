"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    email: "",
    company_name: "",
    phone: "",
    employee_count: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.company_name || !form.phone || !form.employee_count) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      // Save to database
      const { error: dbError } = await supabase.from("access_requests").insert({
        email: form.email.trim(),
        company_name: form.company_name.trim(),
        phone: form.phone.trim(),
        employee_count: form.employee_count,
      });

      if (dbError) throw dbError;

      // Try to send email notification
      try {
        await supabase.functions.invoke("send-access-request-email", {
          body: form,
        });
      } catch {
        // Email sending is best-effort, don't fail the form
        console.warn("Email notification failed, but request was saved.");
      }

      setSubmitted(true);
      toast.success("Solicitação enviada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const employeeOptions = [
    { value: "", label: "Nº de funcionários" },
    { value: "1-50", label: "1 – 50" },
    { value: "51-200", label: "51 – 200" },
    { value: "201-500", label: "201 – 500" },
    { value: "500+", label: "500+" },
  ];

  return (
    <section id="solicitar-acesso" className="relative py-16 sm:py-32">
      <div className="container mx-auto max-w-2xl px-4 sm:px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              Solicitar acesso
            </h2>
            <p className="mt-4 text-muted-foreground">
              Preencha os dados abaixo e entraremos em contato.
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 rounded-2xl border border-border/30 bg-card/50 p-12 text-center backdrop-blur-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground">
                <Check className="h-6 w-6 text-background" />
              </div>
              <h3 className="font-display text-xl font-semibold">Recebemos sua solicitação</h3>
              <p className="text-sm text-muted-foreground">
                Entraremos em contato em breve pelo email informado.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <input
                  type="text"
                  name="company_name"
                  placeholder="Nome da empresa"
                  value={form.company_name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="w-full rounded-lg border border-border/40 bg-card/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 backdrop-blur-sm transition-colors focus:border-foreground/30 focus:outline-none"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email corporativo"
                  value={form.email}
                  onChange={handleChange}
                  required
                  maxLength={255}
                  className="w-full rounded-lg border border-border/40 bg-card/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 backdrop-blur-sm transition-colors focus:border-foreground/30 focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="tel"
                  name="phone"
                  placeholder="Telefone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  maxLength={20}
                  className="w-full rounded-lg border border-border/40 bg-card/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 backdrop-blur-sm transition-colors focus:border-foreground/30 focus:outline-none"
                />
                <select
                  name="employee_count"
                  value={form.employee_count}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-border/40 bg-card/50 px-4 py-3 text-sm text-foreground backdrop-blur-sm transition-colors focus:border-foreground/30 focus:outline-none [&>option]:bg-card [&>option]:text-foreground"
                >
                  {employeeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-6 py-3.5 text-sm font-medium text-background transition-all hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Solicitar Acesso
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-muted-foreground/50">
                Seus dados estão seguros. Não compartilhamos com terceiros.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
