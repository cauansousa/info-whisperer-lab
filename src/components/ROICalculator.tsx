import { motion, useInView, useSpring, useTransform, MotionValue } from "framer-motion";
import { useRef, useState, useMemo, useEffect } from "react";
import { Calculator, Clock, TrendingUp, DollarSign } from "lucide-react";
import { Slider } from "@/components/ui/slider";

function AnimatedNumber({
  value,
  format,
}: {
  value: number;
  format: (v: number) => string;
}) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => format(v));
  const [text, setText] = useState(format(0));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => setText(v));
    return unsubscribe;
  }, [display]);

  return <>{text}</>;
}

const ROICalculator = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const [employees, setEmployees] = useState(50);
  const [hoursSearching, setHoursSearching] = useState(5);
  const [avgSalaryHour, setAvgSalaryHour] = useState(80);

  const results = useMemo(() => {
    const weeklyHoursSaved = employees * hoursSearching * 0.6; // 60% reduction
    const monthlyHoursSaved = weeklyHoursSaved * 4.3;
    const monthlySavings = monthlyHoursSaved * avgSalaryHour;
    const annualSavings = monthlySavings * 12;
    const equivalentEmployees = monthlyHoursSaved / (40 * 4.3); // full-time equivalents

    return {
      weeklyHoursSaved: Math.round(weeklyHoursSaved),
      monthlyHoursSaved: Math.round(monthlyHoursSaved),
      monthlySavings,
      annualSavings,
      equivalentEmployees: Math.round(equivalentEmployees * 10) / 10,
    };
  }, [employees, hoursSearching, avgSalaryHour]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

  return (
    <section id="roi" className="relative py-16 sm:py-32">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-card/50">
              <Calculator className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              Calculadora de ROI
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Descubra quanto sua empresa pode economizar ao centralizar o conhecimento com IA.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Inputs */}
            <div className="space-y-8 rounded-2xl border border-border/30 bg-card/50 p-6 sm:p-8 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Funcionários</label>
                  <span className="font-display text-lg font-semibold text-foreground">{employees}</span>
                </div>
                <Slider
                  value={[employees]}
                  onValueChange={(v) => setEmployees(v[0])}
                  min={5}
                  max={500}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5</span>
                  <span>500</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Horas/semana buscando informação</label>
                  <span className="font-display text-lg font-semibold text-foreground">{hoursSearching}h</span>
                </div>
                <Slider
                  value={[hoursSearching]}
                  onValueChange={(v) => setHoursSearching(v[0])}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1h</span>
                  <span>20h</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Custo médio/hora (R$)</label>
                  <span className="font-display text-lg font-semibold text-foreground">R$ {avgSalaryHour}</span>
                </div>
                <Slider
                  value={[avgSalaryHour]}
                  onValueChange={(v) => setAvgSalaryHour(v[0])}
                  min={20}
                  max={300}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>R$ 20</span>
                  <span>R$ 300</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground/60">
                * Estimativa baseada em redução de 60% no tempo de busca por informação.
              </p>
            </div>

            {/* Results */}
            <div className="flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex-1 rounded-2xl border border-border/30 bg-card/50 p-6 backdrop-blur-sm"
              >
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Economia anual estimada</span>
                </div>
                <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                  <AnimatedNumber value={results.annualSavings} format={formatCurrency} />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <AnimatedNumber value={results.monthlySavings} format={formatCurrency} />/mês
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex-1 rounded-2xl border border-border/30 bg-card/50 p-6 backdrop-blur-sm"
              >
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Horas recuperadas</span>
                </div>
                <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                  <AnimatedNumber value={results.monthlyHoursSaved} format={(v) => `${v.toLocaleString("pt-BR")}h`} />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  por mês · <AnimatedNumber value={results.weeklyHoursSaved} format={(v) => `${v.toLocaleString("pt-BR")}h`} />/semana
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex-1 rounded-2xl border border-border/30 bg-card/50 p-6 backdrop-blur-sm"
              >
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Equivalente em funcionários</span>
                </div>
                <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                  +<AnimatedNumber value={results.equivalentEmployees} format={(v) => `${v.toFixed(1)}`} />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  profissionais em tempo integral recuperados
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ROICalculator;
