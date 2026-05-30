import { Calendar, CheckSquare, Package, Receipt, Clock, GraduationCap, ShoppingBag, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/services/dashboard";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

const DashboardPage = () => {
  const { user } = useAuth();
  const role = user?.tipo ?? "direcao";

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatsConfig = () => {
    if (role === "direcao") {
      return [
        { label: "Pedidos a aprovar", value: data?.stat1.toString() ?? "0", icon: CheckSquare, color: "text-accent" },
        { label: "Sessões a validar", value: data?.stat2.toString() ?? "0", icon: Clock, color: "text-primary" },
        { label: "Itens no marketplace", value: data?.stat3.toString() ?? "0", icon: Package, color: "text-secondary" },
        { label: `Faturação (${new Date().toLocaleString('pt', { month: 'short' })})`, value: `${data?.totalValor ?? 0} €`, icon: Receipt, color: "text-primary" },
      ];
    } else if (role === "professor") {
      return [
        { label: "Pedidos para aceitar", value: data?.stat1.toString() ?? "0", icon: CheckSquare, color: "text-accent" },
        { label: "Aulas esta semana", value: data?.stat2.toString() ?? "0", icon: Calendar, color: "text-primary" },
        { label: "Sessões por confirmar", value: data?.stat3.toString() ?? "0", icon: Clock, color: "text-accent" },
        { label: "Alunos activos", value: data?.stat4.toString() ?? "0", icon: GraduationCap, color: "text-secondary" },
      ];
    } else {
      return [
        { label: "Marcações pendentes", value: data?.stat1.toString() ?? "0", icon: Clock, color: "text-accent" },
        { label: "Aulas confirmadas", value: data?.stat2.toString() ?? "0", icon: Calendar, color: "text-primary" },
        { label: "Sessões por confirmar", value: data?.stat3.toString() ?? "0", icon: CheckSquare, color: "text-accent" },
        { label: "Alugueres activos", value: data?.stat4.toString() ?? "0", icon: ShoppingBag, color: "text-secondary" },
      ];
    }
  };

  const stats = getStatsConfig();
  const activities = data?.recentActivities ?? [];

  const subtitleByRole: Record<string, string> = {
    direcao: "Visão geral da escola e ações pendentes",
    professor: "Os seus coachings e confirmações pendentes",
    encarregado: "Acompanhamento das aulas e do marketplace",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          {activities.length > 0 ? (
            activities.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="px-5 py-3.5 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.type} • {item.userName} • {item.status}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: pt })}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhuma atividade recente encontrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
