import { motion } from "framer-motion";
import { Bell, Calendar as CalIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const days = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const hours = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

interface Event { day: string; hour: string; title: string; sub: string; color: string }

const events: Event[] = [
  { day: "Ter", hour: "16:00", title: "Coaching · Ballet", sub: "Rita · Pedro Santos", color: "bg-primary/15 text-primary border-primary/30" },
  { day: "Qua", hour: "15:00", title: "Aula regular · Jazz", sub: "Miguel · Ana Lopes", color: "bg-secondary/15 text-secondary border-secondary/30" },
  { day: "Qui", hour: "14:00", title: "Coaching · Contemporânea", sub: "Rita · Maria Costa", color: "bg-accent/15 text-accent border-accent/30" },
  { day: "Sex", hour: "17:00", title: "Aula regular · Hip Hop", sub: "Miguel · Ana Lopes", color: "bg-primary/15 text-primary border-primary/30" },
];

const notifications = [
  { icon: "✓", text: "Pedido de Ballet (Ter 16:00) aceite por Pedro Santos.", time: "Há 30m", tone: "secondary" },
  { icon: "!", text: "Sessão de 16 Mar requer confirmação no prazo de 48h.", time: "Há 2h", tone: "accent" },
  { icon: "i", text: "Novo item no marketplace: Tutu de Ensaio Branco.", time: "Há 1d", tone: "primary" },
  { icon: "✓", text: "Aluguer da Saia de Flamenco aprovado pela Direção.", time: "Há 2d", tone: "secondary" },
];

const WeekPage = () => {
  const { user } = useAuth();
  const educandos = user?.educandos?.join(" e ") ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">A Semana</h1>
        <p className="text-muted-foreground mt-1">Horário dos educandos: {educandos}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-lg shadow-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <CalIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-lg font-semibold text-foreground">Semana de 24–28 Março 2026</h2>
          </div>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-6 min-w-[640px]">
              <div className="bg-muted p-3 text-xs font-semibold text-muted-foreground">Hora</div>
              {days.map((d) => (
                <div key={d} className="bg-muted p-3 text-xs font-semibold text-center text-muted-foreground">{d}</div>
              ))}
              {hours.map((hour) => (
                <div key={hour} className="contents">
                  <div className="p-3 text-xs font-medium text-muted-foreground border-t border-border">{hour}</div>
                  {days.map((day) => {
                    const ev = events.find((e) => e.day === day && e.hour === hour);
                    return (
                      <div key={`${day}-${hour}`} className="p-1.5 border-t border-l border-border min-h-[60px]">
                        {ev && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`rounded-md border p-2 h-full ${ev.color}`}
                          >
                            <p className="text-xs font-semibold leading-tight">{ev.title}</p>
                            <p className="text-[10px] opacity-80 mt-0.5">{ev.sub}</p>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-lg font-semibold text-foreground">Notificações Ent'Artes</h2>
          </div>
          <div className="divide-y divide-border">
            {notifications.map((n, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="px-4 py-3 flex items-start gap-3"
              >
                <span className={`shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center bg-${n.tone}/15 text-${n.tone}`}>
                  {n.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{n.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekPage;
