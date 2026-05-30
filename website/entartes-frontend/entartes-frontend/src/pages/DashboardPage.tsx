import { Calendar, CheckSquare, Package, Receipt, Clock, GraduationCap, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

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
  encarregado: [
    { label: "Marcações pendentes", value: "1", icon: Clock, color: "text-accent" },
    { label: "Aulas confirmadas", value: "3", icon: Calendar, color: "text-primary" },
    { label: "Sessões por confirmar", value: "1", icon: CheckSquare, color: "text-accent" },
    { label: "Alugueres activos", value: "1", icon: ShoppingBag, color: "text-secondary" },
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
    { text: "Sessão com João Silva aguarda a sua confirmação", time: "Há 2h" },
    { text: "Aula com Sara Mendes validada pela Direção", time: "Há 1d" },
  ],
  encarregado: [
    { text: "Pedido de aula para Rita aguarda Pedro Santos", time: "Há 30m" },
    { text: "Sessão de Ballet (16 Mar) aguarda a sua confirmação", time: "Há 2d" },
    { text: "Aluguer aprovado: Saia de Flamenco Vermelha", time: "Há 3d" },
  ],
};

const DashboardPage = () => {
  const { user } = useAuth();
  const role = user?.tipo ?? "direcao";
  const stats = statsByRole[role];
  const activity = activityByRole[role];

  const subtitleByRole: Record<string, string> = {
    direcao: "Visão geral da escola e ações pendentes",
    professor: "Os seus coachings e confirmações pendentes",
    encarregado: "Acompanhamento das aulas e do marketplace",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Bem-vindo, {user?.nome.split(" ")[0]}
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
