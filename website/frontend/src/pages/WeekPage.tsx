import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Bell, Calendar as CalIcon, Loader2, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { sessionsApi } from "@/services/session";
import { dashboardApi } from "@/services/dashboard";
import { toast } from "sonner";
import { formatDistanceToNow, isSameDay } from "date-fns";
import { pt } from "date-fns/locale";

const days = ["Seg", "Ter", "Qua", "Qui", "Sex"];

interface Event { 
    id: number;
    date: Date;
    day: string; 
    hour: string; 
    durationSlots: number;
    title: string; 
    sub: string; 
    color: string; 
    status?: string;
    type: "regular" | "coaching";
    rawStart: Date;
    rawEnd: Date;
}

const WeekPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const getDayDate = (dayIdx: number) => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7) + dayIdx;
    return new Date(now.setDate(diff));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const startOfWeekDate = getDayDate(0);
      const endOfWeekDate = getDayDate(6);
      
      const startIso = startOfWeekDate.toISOString();
      const endIso = endOfWeekDate.toISOString();

      const [personalSchedRes, generalSchedRes, dashRes] = await Promise.all([
        sessionsApi.getMySchedule(startIso, endIso),
        sessionsApi.getGeneralSchedule(startIso, endIso),
        dashboardApi.getStats()
      ]);

      const dayNamesShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

      const generalEvents = (generalSchedRes?.data || [])
          .filter((s: any) => s && !s.objetivo) 
          .map((s: any) => {
              const start = new Date(s.dataHoraInicio);
              const end = new Date(s.dataHoraFim);
              const hour = isNaN(start.getTime()) ? "00:00" : start.getHours().toString().padStart(2, '0') + ":" + start.getMinutes().toString().padStart(2, '0');
              const durationMs = end.getTime() - start.getTime();
              const durationSlots = Math.max(0.5, durationMs / (1000 * 60 * 60));
              
              return {
                  id: s.id,
                  date: start,
                  day: dayNamesShort[start.getDay()] || "???",
                  hour: hour,
                  durationSlots,
                  title: s.modalidade?.nome || "Aula Regular",
                  sub: `${s.professor?.nome || "Prof."} · ${s.estudio?.nome || "S/ Sala"}`,
                  color: "border-indigo-200 bg-indigo-50/50 text-indigo-700",
                  type: "regular",
                  rawStart: start,
                  rawEnd: end
              };
          });

      const personalEvents = (personalSchedRes?.data || []).map((s: any) => {
          const start = new Date(s.dataHoraInicio);
          const end = new Date(s.dataHoraFim);
          const hour = isNaN(start.getTime()) ? "00:00" : start.getHours().toString().padStart(2, '0') + ":" + start.getMinutes().toString().padStart(2, '0');
          const durationMs = end.getTime() - start.getTime();
          const durationSlots = Math.max(0.5, durationMs / (1000 * 60 * 60));
          
          let statusLabel = "";
          let colorClass = "";
          
          switch(s.estado) {
              case 0:
              case 1:
                  statusLabel = " (Pendente)";
                  colorClass = "bg-amber-50 text-amber-700 border-amber-200 border-dashed animate-pulse";
                  break;
              case 2:
                  colorClass = "bg-primary/15 text-primary border-primary/30 shadow-sm";
                  break;
              case 5:
                  statusLabel = " (Recusada)";
                  colorClass = "bg-destructive/10 text-destructive border-destructive/20 opacity-50";
                  break;
              default:
                  colorClass = "bg-primary/10 text-primary border-primary/20";
          }

          return {
              id: s.id,
              date: start,
              day: dayNamesShort[start.getDay()] || "???",
              hour: hour,
              durationSlots,
              title: `Coaching: ${s.modalidade?.nome || 'Aula'}${statusLabel}`,
              sub: `${s.participantes?.map((p: any) => p.aluno?.nome || 'Aluno').join(", ") || 'Sem alunos'} · ${s.professor?.nome || 'Prof.'}`,
              color: colorClass,
              type: "coaching",
              status: s.estado,
              rawStart: start,
              rawEnd: end
          };
      });

      const allEvents = [...generalEvents, ...personalEvents];
      const uniqueEvents = allEvents.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      setEvents(uniqueEvents);

      const recentActivities = (dashRes as any)?.recentActivities || [];
      const mappedNotifs = recentActivities.map((a: any) => ({
          icon: a.type === "Empréstimo" ? "i" : a.type === "Sessão" ? "✓" : "!",
          text: a.description,
          time: a.date ? formatDistanceToNow(new Date(a.date), { addSuffix: true, locale: pt }) : "Recentemente",
          tone: a.status === "Aprovado" || a.status === "Concluida" ? "secondary" : "primary"
      }));
      setNotifications(mappedNotifs);

    } catch (error) {
      console.error("WeekPage: Error in fetchData:", error);
      toast.error("Erro ao carregar o seu horário");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [weekOffset]);

  const START_HOUR = 8;
  const END_HOUR = 22;
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => `${(START_HOUR + i).toString().padStart(2, '0')}:00`);

  const getGridRow = (date: Date) => {
      const h = date.getHours();
      const m = date.getMinutes();
      const totalMinutesFromStart = (h - START_HOUR) * 60 + m;
      return Math.floor(totalMinutesFromStart / 15) + 2;
  };

  // Logic to handle side-by-side overlaps
  const eventsWithOverlaps = useMemo(() => {
    const dayGroups: Record<string, Event[]> = {};
    
    events.forEach(e => {
      const dayKey = e.type === "coaching" ? e.date.toDateString() : e.day;
      if (!dayGroups[dayKey]) dayGroups[dayKey] = [];
      dayGroups[dayKey].push(e);
    });

    const result: (Event & { overlapCount: number, overlapIndex: number, dayIdx: number })[] = [];

    days.forEach((dayName, idx) => {
      const targetDate = getDayDate(idx);
      
      // Merge events that belong to this column
      const columnEvents = events.filter(e => {
        if (e.type === "coaching") return isSameDay(new Date(e.rawStart), targetDate);
        return e.day === dayName;
      });

      const sorted = [...columnEvents].sort((a, b) => a.rawStart.getTime() - b.rawStart.getTime());
      
      sorted.forEach(l => {
        const overlaps = sorted.filter(other => 
          other.id !== l.id && 
          other.rawStart < l.rawEnd && other.rawEnd > l.rawStart
        );
        
        const index = overlaps.filter(o => o.rawStart < l.rawStart || (o.rawStart.getTime() === l.rawStart.getTime() && o.id < l.id)).length;
        
        result.push({
          ...l,
          overlapCount: overlaps.length + 1,
          overlapIndex: index,
          dayIdx: idx
        });
      });
    });

    return result;
  }, [events, weekOffset]);

  if (loading && events.length === 0) {
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
          <h1 className="font-display text-3xl font-bold text-foreground">A Minha Semana</h1>
          <p className="text-muted-foreground mt-1">Horário geral e as suas marcações pessoais</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-lg shadow-card border border-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-2">
                <CalIcon className="h-4 w-4 text-primary" />
                <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">Calendário Semanal</h2>
            </div>
            <div className="flex gap-3 text-[9px] font-bold uppercase tracking-tighter">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-200" /> Geral</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary/40" /> Coaching</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400" /> Pendente</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <div className="grid grid-cols-6 min-w-[700px] grid-rows-[auto_repeat(56,minmax(15px,auto))] relative">
              <div className="bg-muted/50 p-3 border-b border-border sticky top-0 z-20"></div>
              {days.map((d, i) => (
                <div key={d} className="bg-muted/50 p-3 text-center border-l border-b border-border sticky top-0 z-20">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-foreground">{d}</p>
                    <p className="text-[10px] text-muted-foreground/60">{getDayDate(i).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}</p>
                </div>
              ))}

              {hours.map((hour, hIdx) => (
                  <div 
                    key={`label-${hour}`} 
                    className="p-3 text-[11px] font-medium text-muted-foreground border-t border-border flex items-start justify-end pr-4 bg-muted/5"
                    style={{ gridColumn: '1', gridRow: `${(hIdx * 4) + 2} / span 4` }}
                  >
                    {hour}
                  </div>
              ))}

              {hours.map((_, hIdx) => (
                  days.map((_, dIdx) => (
                      <div 
                        key={`bg-${hIdx}-${dIdx}`}
                        className="border-t border-l border-border/30 pointer-events-none"
                        style={{ gridColumn: dIdx + 2, gridRow: `${(hIdx * 4) + 2} / span 4` }}
                      />
                  ))
              ))}

              {eventsWithOverlaps.map((ev) => {
                  const width = 100 / ev.overlapCount;
                  const left = ev.overlapIndex * width;

                  return (
                      <div 
                        key={`event-${ev.id}`} 
                        className="p-0.5 z-10"
                        style={{ 
                            gridColumn: ev.dayIdx + 2,
                            gridRow: `${getGridRow(ev.rawStart)} / span ${Math.ceil(ev.durationSlots * 4)}`,
                            marginLeft: `${left}%`,
                            width: `${width}%`
                        }}
                      >
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-md border p-2 h-full flex flex-col justify-center transition-all hover:shadow-md hover:z-20 relative ${ev.color}`}
                        >
                            <p className="text-[10px] font-bold leading-tight line-clamp-2">{ev.title}</p>
                            <p className="text-[9px] opacity-80 mt-1 font-medium truncate">{ev.sub}</p>
                            {ev.type === "coaching" && (
                                <div className="absolute top-1 right-1">
                                    <Info className="h-2.5 w-2.5 opacity-40" />
                                </div>
                            )}
                        </motion.div>
                      </div>
                  );
              })}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden flex flex-col h-fit lg:sticky lg:top-8">
          <div className="p-4 border-b border-border flex items-center gap-2 bg-muted/20">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">Atividade Recente</h2>
          </div>
          <div className="divide-y divide-border overflow-y-auto max-h-[500px]">
            {notifications.length > 0 ? (
                notifications.map((n, i) => {
                    const toneClass = n.tone === "secondary" ? "bg-secondary/15 text-secondary border-secondary/20" : 
                                    n.tone === "accent" ? "bg-accent/15 text-accent border-accent/20" : 
                                    "bg-primary/15 text-primary border-primary/20";
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors"
                        >
                            <span className={`shrink-0 w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center border ${toneClass}`}>
                            {n.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                            <p className="text-sm text-foreground leading-tight">{n.text}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                            </div>
                        </motion.div>
                    );
                })
            ) : (
                <div className="p-8 text-center text-muted-foreground text-sm italic">
                    Sem atividade para apresentar.
                </div>
            )}
          </div>
          <div className="p-4 bg-muted/30 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center italic">
                  Utilize o menu de "Validações" para gerir os seus pedidos pendentes.
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekPage;
