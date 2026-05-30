import { Calendar, CheckSquare, Package, Receipt, Clock, GraduationCap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface Stat { label: string; value: string; icon: typeof Calendar; color: string }

const statsByRole: Record<string, Stat[]> = {
  direcao: [
    { label: "Pedidos a aprovar", value: "3", icon: CheckSquare, color: "text-accent" },
    { label: "Sessões a validar", value: "2", icon: Clock, color: "text-primary" },
    { label: "Itens no marketplace", value: "38", icon: Package, color: "text-secondary" },
    { label: "Total a relatar (Mar)", value: "560 €", icon: Receipt, color: "text-primary" },
  ],
  professor: [
    { label: "Pedidos para aceitar", value: "2", icon: CheckSquare, color: "text-accent" },
    { label: "Aulas esta semana", value: "8", icon: Calendar, color: "text-primary" },
    { label: "Sessões por confirmar", value: "1", icon: Clock, color: "text-accent" },
    { label: "Alunos activos", value: "14", icon: GraduationCap, color: "text-secondary" },
  ],
};

const activityByRole: Record<string, { text: string; time: string }[]> = {
  direcao: [
    { text: "João Silva – Pedido aceite por Maria Costa, aguarda aprovação", time: "Há 1h" },
    { text: "Pedro Santos – Confirmou sessão de Ballet Clássico", time: "Há 3h" },
    { text: "Novo item submetido: Tutu de ensaio", time: "Há 5h" },
    { text: "Empréstimo aprovado: Sapatilhas de ponta #12", time: "Há 1d" },
    { text: "Relatório mensal Fevereiro exportado", time: "Há 3d" },
  ],
  professor: [
    { text: "Novo pedido de Rita Gomes – Ballet Clássico (Ter 16:00)", time: "Há 30m" },
    { text: "Sessão com João Silva aguarda confirmação do professor", time: "Há 2h" },
    { text: "Aula com Sara Mendes validada pela Direção", time: "Há 1d" },
  ],
};

const profDays = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const profHours = ["09:00", "10:00", "14:00", "16:00"];
const profSchedule = [
  { day: "Seg", hour: "10:00", title: "Ballet Iniciação" },
  { day: "Ter", hour: "16:00", title: "Coaching · Rita" },
  { day: "Qua", hour: "09:00", title: "Ballet Avançado" },
  { day: "Qui", hour: "10:00", title: "Jazz Intermédio" },
];

interface Props { onNavigate?: (p: string) => void }

const DashboardPage = ({ onNavigate }: Props) => {
  const { user } = useAuth();
  const role = user?.tipo ?? "direcao";
  const stats = statsByRole[role];
  const activity = activityByRole[role];

  const subtitleByRole: Record<string, string> = {
    direcao: "Visão geral da escola e ações pendentes",
    professor: "Coachings e confirmações pendentes",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Início — {user?.nome}
        </h1>
        <p className="text-muted-foreground mt-1">{subtitleByRole[role]}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              className="bg-card rounded-lg p-5 shadow-card border border-border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color} opacity-70`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {role === "professor" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-lg shadow-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Horário desta semana</h2>
              <span className="text-xs text-muted-foreground">24–28 Março 2026</span>
            </div>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-6 min-w-[560px]">
                <div className="bg-muted p-2 text-xs font-semibold text-muted-foreground">Hora</div>
                {profDays.map((d) => (
                  <div key={d} className="bg-muted p-2 text-xs font-semibold text-center text-muted-foreground">{d}</div>
                ))}
                {profHours.map((h) => (
                  <div key={h} className="contents">
                    <div className="p-2 text-xs text-muted-foreground border-t border-border">{h}</div>
                    {profDays.map((d) => {
                      const ev = profSchedule.find((e) => e.day === d && e.hour === h);
                      return (
                        <div key={`${d}-${h}`} className="p-1 border-t border-l border-border min-h-[44px]">
                          {ev && (
                            <div className="rounded bg-primary/10 border border-primary/30 p-1.5 h-full">
                              <p className="text-[10px] font-semibold text-primary leading-tight">{ev.title}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-card border border-border p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">Pedidos pendentes</h3>
              <p className="text-sm text-muted-foreground mt-1">2 pedidos de coaching aguardam resposta.</p>
            </div>
            <Button className="mt-4 w-full" onClick={() => onNavigate?.("validation")}>
              Ver pedidos <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg shadow-card border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="font-display text-lg font-semibold text-foreground">Atividade Recente</h2>
        </div>
        <div className="divide-y divide-border">
          {activity.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="px-5 py-3.5 flex items-center justify-between"
            >
              <p className="text-sm text-foreground">{item.text}</p>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{item.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
