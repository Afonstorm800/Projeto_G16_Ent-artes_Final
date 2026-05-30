import { useAuth } from "@/contexts/AuthContext";

const days = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const hours = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

interface Slot { day: string; hour: string; title: string; sub: string }

const eventsByRole: Record<string, Slot[]> = {
  encarregado: [
    { day: "Ter", hour: "16:00", title: "Coaching · Ballet", sub: "Rita · Pedro Santos · Estúdio 2" },
    { day: "Qua", hour: "15:00", title: "Jazz (regular)", sub: "Miguel · Ana Lopes · Estúdio 1" },
    { day: "Qui", hour: "14:00", title: "Coaching · Contemporânea", sub: "Rita · Maria Costa · Estúdio 3" },
    { day: "Sex", hour: "17:00", title: "Hip Hop (regular)", sub: "Miguel · Ana Lopes · Estúdio 1" },
  ],
  professor: [
    { day: "Seg", hour: "10:00", title: "Ballet Iniciação", sub: "Grupo A · Estúdio 1" },
    { day: "Ter", hour: "16:00", title: "Coaching · Rita Gomes", sub: "Ballet · Estúdio 2" },
    { day: "Qua", hour: "09:00", title: "Ballet Avançado", sub: "Grupo C · Estúdio 1" },
    { day: "Qui", hour: "10:00", title: "Jazz Intermédio", sub: "Grupo B · Estúdio 3" },
  ],
};

const SchedulePage = () => {
  const { user } = useAuth();
  const role = user?.tipo ?? "encarregado";
  const events = eventsByRole[role] ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Horário</h1>
        <p className="text-muted-foreground mt-1">
          {role === "professor"
            ? "Aulas regulares atribuídas pela Direção e coachings agendados"
            : "Aulas regulares e coachings dos educandos · semana de 24–28 Março 2026"}
        </p>
      </div>

      <div className="bg-card rounded-lg shadow-card border border-border overflow-x-auto">
        <div className="grid grid-cols-6 min-w-[720px]">
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
                      <div className="rounded-md border border-primary/30 bg-primary/10 p-2 h-full">
                        <p className="text-xs font-semibold leading-tight text-primary">{ev.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{ev.sub}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Os horários regulares são definidos no fim do ano letivo pela Direção. Coachings adicionais são agendados em "Marcações".
      </p>
    </div>
  );
};

export default SchedulePage;
