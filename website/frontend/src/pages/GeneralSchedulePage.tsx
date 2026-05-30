import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2, ChevronLeft, ChevronRight, Trash2, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sessionsApi } from "@/services/session";
import { toast } from "sonner";

type LessonType = "regular" | "coaching";

interface Lesson { 
    id: number;
    day: string; 
    hour: string; 
    durationSlots: number;
    title: string; 
    professor: string; 
    studio: string; 
    type: LessonType;
    startHour: number;
    rawStart: Date;
    rawEnd: Date;
}

const GeneralSchedulePage = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "regular" | "coaching">("all");
  const [showAdd, setShowAdd] = useState(false);
  
  const [professors, setProfessors] = useState<any[]>([]);
  const [modalities, setModalities] = useState<any[]>([]);
  const [studios, setEstudios] = useState<any[]>([]);

  const [draft, setDraft] = useState({ 
    modalityId: 0, 
    professorId: 0, 
    studioId: 0,
    startTime: "10:00",
    endTime: "11:00",
    baseDate: new Date().toISOString().split('T')[0],
    recurrenceType: 2, 
    recurrenceCount: 1,
    recurrenceDays: [] as number[],
    recurrenceMonth: 1
  });

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
        
        startOfWeekDate.setHours(0, 0, 0, 0);
        endOfWeekDate.setHours(23, 59, 59, 999);

        const [schedRes, profsRes, modsRes, studiosRes] = await Promise.all([
            sessionsApi.getGeneralSchedule(startOfWeekDate.toISOString(), endOfWeekDate.toISOString()),
            sessionsApi.getProfessors(),
            sessionsApi.getModalities(),
            sessionsApi.getEstudios()
        ]);
        
        const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const mapped = schedRes.data.map((s: any) => {
            const start = new Date(s.dataHoraInicio);
            const end = new Date(s.dataHoraFim);
            const hour = start.getHours().toString().padStart(2, '0') + ":" + start.getMinutes().toString().padStart(2, '0');
            const durationMs = end.getTime() - start.getTime();
            const durationSlots = Math.max(0.5, durationMs / (1000 * 60 * 60));
            
            return {
                id: s.id,
                day: dayNames[start.getDay()],
                hour: hour,
                durationSlots,
                startHour: start.getHours(),
                title: s.modalidade?.nome || "Aula",
                professor: s.professor?.nome || "Professor",
                studio: s.estudio?.nome || "S/ Sala",
                type: s.objetivo ? "coaching" : "regular",
                rawStart: start,
                rawEnd: end
            };
        });
        setLessons(mapped);
        setProfessors(profsRes.data);
        setModalities(modsRes.data);
        setEstudios(studiosRes.data);
        
        if (modsRes.data.length > 0 && draft.modalityId === 0) setDraft(d => ({ ...d, modalityId: modsRes.data[0].id }));
        if (profsRes.data.length > 0 && draft.professorId === 0) setDraft(d => ({ ...d, professorId: profsRes.data[0].id }));
        if (studiosRes.data.length > 0 && draft.studioId === 0) setDraft(d => ({ ...d, studioId: studiosRes.data[0].id }));

    } catch (error) {
        toast.error("Erro ao carregar dados do horário");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [weekOffset]);

  const addLesson = async () => {
    try {
      const [sH, sM] = draft.startTime.split(':').map(Number);
      const [eH, eM] = draft.endTime.split(':').map(Number);
      const base = new Date(draft.baseDate);
      
      const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), sH, sM).toISOString();
      const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), eH, eM).toISOString();

      await sessionsApi.createBooking({
        dataHoraInicio: start,
        dataHoraFim: end,
        formato: 0,
        objetivo: "", 
        modalidadeId: draft.modalityId,
        professorId: draft.professorId,
        estudioId: draft.studioId,
        alunosIds: [], 
        recurrenceType: draft.recurrenceType,
        recurrenceCount: draft.recurrenceCount,
        recurrenceDays: draft.recurrenceDays,
        recurrenceMonth: draft.recurrenceMonth
      });
      
      toast.success("Aulas adicionadas ao horário");
      setShowAdd(false);
      fetchData();
    } catch (error) {
      toast.error("Erro ao adicionar aula");
    }
  };

  const handleDelete = async (id: number) => {
      if (!confirm("Remover esta aula do horário?")) return;
      try {
          await sessionsApi.deleteSession(id);
          toast.success("Aula removida");
          fetchData();
      } catch (error) {
          toast.error("Erro ao remover aula");
      }
  };

  const toggleDay = (day: number) => {
    setDraft(prev => ({
        ...prev,
        recurrenceDays: prev.recurrenceDays.includes(day) 
            ? prev.recurrenceDays.filter(d => d !== day) 
            : [...prev.recurrenceDays, day]
    }));
  };

  const gridDays = [
      { id: 1, label: "Segunda", short: "Seg" },
      { id: 2, label: "Terça", short: "Ter" },
      { id: 3, label: "Quarta", short: "Qua" },
      { id: 4, label: "Quinta", short: "Qui" },
      { id: 5, label: "Sexta", short: "Sex" },
      { id: 6, label: "Sábado", short: "Sáb" }
  ];

  const START_HOUR = 8;
  const END_HOUR = 22;
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => `${(START_HOUR + i).toString().padStart(2, '0')}:00`);

  const getGridRow = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      const totalMinutesFromStart = (h - START_HOUR) * 60 + m;
      return Math.floor(totalMinutesFromStart / 15) + 2;
  };

  // Group lessons by day to calculate overlaps
  const lessonsWithOverlaps = useMemo(() => {
    const filtered = lessons.filter(l => filter === "all" || l.type === filter);
    const dayGroups: Record<string, Lesson[]> = {};
    
    filtered.forEach(l => {
      if (!dayGroups[l.day]) dayGroups[l.day] = [];
      dayGroups[l.day].push(l);
    });

    const result: (Lesson & { overlapCount: number, overlapIndex: number })[] = [];

    Object.values(dayGroups).forEach(group => {
      const sorted = [...group].sort((a, b) => a.rawStart.getTime() - b.rawStart.getTime());
      
      sorted.forEach((l, i) => {
        const overlaps = sorted.filter(other => 
          other.id !== l.id && 
          other.rawStart < l.rawEnd && other.rawEnd > l.rawStart
        );
        
        // This is a simplified overlap index calculation
        // For 100% correctness we would need a more complex "columns" algorithm
        // but for 2-3 simultaneous classes this works well.
        const index = overlaps.filter(o => o.rawStart < l.rawStart || (o.rawStart.getTime() === l.rawStart.getTime() && o.id < l.id)).length;
        
        result.push({
          ...l,
          overlapCount: overlaps.length + 1,
          overlapIndex: index
        });
      });
    });

    return result;
  }, [lessons, filter]);

  const daysOfWeekFull = [
    { id: 1, label: "Seg" }, { id: 2, label: "Ter" }, { id: 3, label: "Qua" },
    { id: 4, label: "Qui" }, { id: 5, label: "Sex" }, { id: 6, label: "Sáb" }, { id: 0, label: "Dom" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Horário Geral</h1>
          <p className="text-muted-foreground mt-1">Gestão de todas as aulas e estúdios</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(prev => prev - 1)}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-2 text-xs font-medium bg-muted rounded border border-border">
                {getDayDate(0).toLocaleDateString('pt-PT', {day:'numeric', month:'short'})} – {getDayDate(4).toLocaleDateString('pt-PT', {day:'numeric', month:'short'})}
            </span>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(prev => prev + 1)}>
                <ChevronRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4 mr-2" /> Nova Aula
            </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${filter === "all" ? "bg-foreground text-background border-foreground" : "bg-background text-foreground border-border hover:bg-muted"}`}>Todas</button>
        <button onClick={() => setFilter("regular")} className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${filter === "regular" ? "bg-indigo-600 text-white border-indigo-600" : "bg-background text-foreground border-border hover:bg-muted"}`}>Aulas Regulares</button>
        <button onClick={() => setFilter("coaching")} className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${filter === "coaching" ? "bg-accent text-white border-accent" : "bg-background text-foreground border-border hover:bg-muted"}`}>Coachings</button>
      </div>

      <div className="bg-card rounded-lg shadow-card border border-border overflow-x-auto">
        <div className="min-w-[900px] grid grid-cols-[100px_repeat(6,1fr)] grid-rows-[auto_repeat(56,minmax(20px,auto))] relative">
          <div className="bg-muted p-3 border-b border-border sticky top-0 z-20"></div>
          {gridDays.map((d, i) => (
            <div key={d.id} className="bg-muted p-3 text-center border-l border-b border-border sticky top-0 z-20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{d.label}</p>
              <p className="text-[10px] text-muted-foreground/60">{getDayDate(i).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}</p>
            </div>
          ))}

          {hours.map((hour, hIdx) => (
              <div 
                key={`label-${hour}`} 
                className="p-3 text-xs font-medium text-muted-foreground border-t border-border flex items-start justify-end pr-4 bg-muted/10"
                style={{ gridColumn: '1', gridRow: `${(hIdx * 4) + 2} / span 4` }}
              >
                {hour}
              </div>
          ))}

          {hours.map((_, hIdx) => (
              gridDays.map((_, dIdx) => (
                  <div 
                    key={`bg-${hIdx}-${dIdx}`}
                    className="border-t border-l border-border/30 pointer-events-none"
                    style={{ gridColumn: dIdx + 2, gridRow: `${(hIdx * 4) + 2} / span 4` }}
                  />
              ))
          ))}

          {lessonsWithOverlaps.map((lesson) => {
              const dayIdx = gridDays.findIndex(gd => gd.short === lesson.day);
              if (dayIdx === -1) return null;

              // Calculate width and offset based on overlaps
              // If overlapCount is 2, index 0 gets left:0 width:50%, index 1 gets left:50% width:50%
              const width = 100 / lesson.overlapCount;
              const left = lesson.overlapIndex * width;

              return (
                  <div 
                    key={`lesson-${lesson.id}`} 
                    className="p-0.5 z-10"
                    style={{ 
                        gridColumn: dayIdx + 2,
                        gridRow: `${getGridRow(lesson.hour)} / span ${Math.ceil(lesson.durationSlots * 4)}`,
                        marginLeft: `${left}%`,
                        width: `${width}%`
                    }}
                  >
                      <div className={`rounded-md border p-2 h-full shadow-sm flex flex-col group transition-all hover:z-20 hover:scale-[1.02] ${
                        lesson.type === "coaching"
                          ? "border-accent/40 bg-accent/10"
                          : "border-indigo-200 bg-indigo-50/90"
                      }`}>
                        <div className="flex justify-between items-start gap-1">
                            <p className={`text-[10px] font-bold leading-tight ${lesson.type === "coaching" ? "text-accent" : "text-indigo-700"}`}>
                            {lesson.title}
                            </p>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(lesson.id); }}
                                className={`opacity-0 group-hover:opacity-100 p-0.5 hover:bg-destructive/10 rounded transition-all ${lesson.type === 'coaching' ? 'text-destructive' : 'text-indigo-400 hover:text-destructive'}`}
                            >
                                <Trash2 className="h-2.5 w-2.5" />
                            </button>
                        </div>
                        <p className="text-[8px] mt-1 font-semibold text-muted-foreground uppercase opacity-70">
                            {lesson.hour}
                        </p>
                        <p className={`text-[9px] mt-0.5 font-medium leading-tight ${lesson.type === 'coaching' ? 'text-muted-foreground' : 'text-indigo-600/80'}`}>
                            {lesson.professor} <br/> {lesson.studio}
                        </p>
                      </div>
                  </div>
              );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/20 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card rounded-lg shadow-elevated border border-border w-full max-w-md p-6 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">Configurar Aula Regular</h2>
                <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium block mb-1">Data Base</label>
                        <input type="date" value={draft.baseDate} onChange={e => setDraft({...draft, baseDate: e.target.value})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Sala</label>
                        <select value={draft.studioId} onChange={e => setDraft({...draft, studioId: parseInt(e.target.value)})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            {studios.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium block mb-1">Hora Início</label>
                        <input type="time" value={draft.startTime} onChange={e => setDraft({...draft, startTime: e.target.value})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Hora Fim</label>
                        <input type="time" value={draft.endTime} onChange={e => setDraft({...draft, endTime: e.target.value})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                    </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Modalidade</label>
                  <select value={draft.modalityId} onChange={e => setDraft({...draft, modalityId: parseInt(e.target.value)})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {modalities.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Professor</label>
                  <select value={draft.professorId} onChange={e => setDraft({...draft, professorId: parseInt(e.target.value)})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {professors.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>

                <div className="space-y-4 border-t border-border pt-4">
                  <label className="text-sm font-medium text-foreground block">Recorrência</label>
                  
                  <select 
                    value={draft.recurrenceType} 
                    onChange={(e) => setDraft({...draft, recurrenceType: parseInt(e.target.value)})}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value={0}>Apenas uma vez</option>
                    <option value={1}>Diária</option>
                    <option value={2}>Semanal</option>
                    <option value={3}>Quinzenal</option>
                    <option value={4}>Mensal</option>
                    <option value={5}>Anual</option>
                  </select>

                  {draft.recurrenceType > 0 && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">
                                Repetir por quantos {draft.recurrenceType === 1 ? "dias" : draft.recurrenceType === 2 ? "semanas" : draft.recurrenceType === 3 ? "quinzenas" : draft.recurrenceType === 4 ? "meses" : "anos"}?
                            </label>
                            <input 
                                type="number" 
                                min={1} 
                                max={52} 
                                value={draft.recurrenceCount} 
                                onChange={(e) => setDraft({...draft, recurrenceCount: parseInt(e.target.value)})}
                                className="w-full rounded border-input bg-background px-2 py-1 text-sm"
                            />
                        </div>

                        {(draft.recurrenceType === 2 || draft.recurrenceType === 3) && (
                            <div>
                                <label className="text-xs text-muted-foreground block mb-2">Dias da semana</label>
                                <div className="flex flex-wrap gap-2">
                                    {daysOfWeekFull.map(d => (
                                        <button
                                            key={d.id}
                                            onClick={() => toggleDay(d.id)}
                                            className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                                                draft.recurrenceDays.includes(d.id) 
                                                ? "bg-primary text-primary-foreground border-primary" 
                                                : "bg-muted text-muted-foreground border-transparent hover:border-input"
                                            }`}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {draft.recurrenceType === 4 && (
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">Dia do mês (1-31)</label>
                                <input 
                                    type="number" 
                                    min={1} 
                                    max={31} 
                                    value={draft.recurrenceDays[0] || new Date(draft.baseDate).getDate()} 
                                    onChange={(e) => setDraft({...draft, recurrenceDays: [parseInt(e.target.value)]})}
                                    className="w-full rounded border-input bg-background px-2 py-1 text-sm"
                                />
                            </div>
                        )}
                    </div>
                  )}
                </div>
              </div>

              <Button className="w-full" onClick={addLesson}>Adicionar ao Horário</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GeneralSchedulePage;
