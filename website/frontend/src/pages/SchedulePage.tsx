import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { sessionsApi } from "@/services/session";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const days = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

interface Slot { day: string; hour: string; title: string; sub: string; type: string }

const SchedulePage = () => {
  const { user } = useAuth();
  const role = user?.tipo ?? "encarregado";
  const [events, setEvents] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const getDayDate = (dayIdx: number) => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7) + dayIdx;
    return new Date(now.setDate(diff));
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const startOfWeek = getDayDate(0);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = getDayDate(6);
        endOfWeek.setHours(23, 59, 59, 999);

        const res = await sessionsApi.getMySchedule(startOfWeek.toISOString(), endOfWeek.toISOString());
        const mapped = res.data.map((s: any) => {
            const date = new Date(s.dataHoraInicio);
            const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
            const hour = date.getHours().toString().padStart(2, '0') + ":00";
            
            return {
                day: dayNames[date.getDay()],
                hour: hour,
                title: s.modalidade?.nome || "Aula",
                sub: role === "professor" 
                    ? `${s.participantes?.map((p: any) => p.aluno?.nome || 'Aluno').join(", ") || 'Sem alunos'} · ${s.estudio?.nome || "S/ Sala"}`
                    : `${s.professor?.nome || "Professor"} · ${s.estudio?.nome || "S/ Sala"}`,
                type: s.objetivo ? "coaching" : "regular"
            };
        });
        setEvents(mapped);
      } catch (error) {
        toast.error("Erro ao carregar horário");
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [role, weekOffset]);

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Horário</h1>
          <p className="text-muted-foreground mt-1">
            {role === "professor"
              ? "Aulas regulares atribuídas pela Direção e coachings agendados"
              : "Aulas regulares e coachings dos educandos"}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-card border border-border p-2 rounded-lg shadow-sm">
            <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-medium px-2 min-w-[140px] text-center">
                {getDayDate(0).toLocaleDateString('pt-PT', {day:'numeric', month:'short'})} – {getDayDate(4).toLocaleDateString('pt-PT', {day:'numeric', month:'short'})}
            </div>
            <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
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
                      <div className={`rounded-md border p-2 h-full ${
                        ev.type === 'coaching' 
                          ? 'border-accent/40 bg-accent/10' 
                          : 'border-indigo-200 bg-indigo-50/50'
                      }`}>
                        <p className={`text-xs font-semibold leading-tight ${
                            ev.type === 'coaching' ? 'text-accent' : 'text-indigo-700'
                        }`}>{ev.title}</p>
                        <p className={`text-[10px] mt-0.5 ${
                            ev.type === 'coaching' ? 'text-muted-foreground' : 'text-indigo-600/80'
                        }`}>{ev.sub}</p>
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
