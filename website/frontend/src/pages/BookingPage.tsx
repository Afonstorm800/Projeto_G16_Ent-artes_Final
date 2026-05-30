import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, X, User, ChevronLeft } from "lucide-react";
import { sessionsApi, AvailableSlot } from "@/services/session";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Professor {
  id: number;
  nome: string;
  initials: string;
  modalidades: { id: number; nome: string }[];
}

const formats = ["Individual", "Duo", "Trio", "Ensemble"];
const formatsMap: Record<string, number> = {
    "Individual": 0,
    "Duo": 1,
    "Trio": 2,
    "Ensemble": 3
};

type Step = "pick-professor" | "pick-slot" | "form";

const BookingPage = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("pick-professor");
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [students, setStudents] = useState<{ id: number; nome: string }[]>([]);
  
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  
  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("15:00");
  
  const [recurrenceType, setRecurrenceType] = useState(0); // 0=None, 1=Daily, 2=Weekly, 3=BiWeekly, 4=Monthly, 5=Yearly
  const [recurrenceCount, setRecurrenceCount] = useState(1);
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [recurrenceMonth, setRecurrenceMonth] = useState(1);

  const [modalityId, setModalityId] = useState<number>(0);
  const [format, setFormat] = useState(formats[0]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [objective, setObjective] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
        try {
            const [profsRes, studentsRes] = await Promise.all([
                sessionsApi.getProfessors(),
                user.tipo === "direcao" ? sessionsApi.getAllStudents() : sessionsApi.getMyStudents()
            ]);
            setProfessors(profsRes.data.map(p => ({ 
                ...p, 
                initials: p.nome.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) 
            })));
            setStudents(studentsRes.data);
        } catch (error) {
            toast.error("Erro ao carregar dados iniciais");
        }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (slot) {
        const start = new Date(slot.startTime);
        const end = new Date(slot.endTime);
        setStartTime(`${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`);
        setEndTime(`${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`);
        setRecurrenceDays([start.getDay()]);
    }
  }, [slot]);

  const fetchSlots = async (profId: number, modId: number, formatStr: string, offset: number) => {
    if (!modId) return;
    setLoading(true);
    try {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1) + (offset * 7);
        const targetMonday = new Date(now.setDate(diff));
        const dateStr = targetMonday.toISOString().split('T')[0];

        const res = await sessionsApi.getAvailableSlots(dateStr, modId, formatsMap[formatStr], profId);
        setAvailableSlots(res.data);
    } catch (error) {
        toast.error("Erro ao carregar horários");
    } finally {
        setLoading(false);
    }
  };

  const handleSelectProfessor = (p: Professor) => {
    setSelectedProfessor(p);
    setStep("pick-slot");
    const defaultModId = p.modalidades.length > 0 ? p.modalidades[0].id : 0;
    setModalityId(defaultModId);
    setWeekOffset(0);
    fetchSlots(p.id, defaultModId, format, 0);
  };

  const handleSelectSlot = (s: AvailableSlot) => {
    setSlot(s);
    setStep("form");
  };

  const handleSubmit = async () => {
    if (!selectedProfessor || !slot || selectedStudentIds.length === 0) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
    }
    
    setLoading(true);
    try {
        const baseDate = new Date(slot.startTime);
        const [sH, sM] = startTime.split(':').map(Number);
        const [eH, eM] = endTime.split(':').map(Number);

        const dataHoraInicio = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), sH, sM).toISOString();
        const dataHoraFim = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), eH, eM).toISOString();

        await sessionsApi.createBooking({
            dataHoraInicio,
            dataHoraFim,
            formato: formatsMap[format],
            objetivo: objective,
            modalidadeId: modalityId,
            professorId: selectedProfessor.id,
            estudioId: slot.estudioId,
            alunosIds: selectedStudentIds,
            recurrenceType,
            recurrenceCount,
            recurrenceDays,
            recurrenceMonth
        });
        setSubmitted(true);
        toast.success("Pedido enviado com sucesso!");
    } catch (error) {
        toast.error("Erro ao submeter pedido");
    } finally {
        setLoading(false);
    }
  };

  const reset = () => {
    setStep("pick-professor");
    setSelectedProfessor(null);
    setSlot(null);
    setSubmitted(false);
    setObjective("");
    setSelectedStudentIds([]);
    setRecurrenceType(0);
    setRecurrenceCount(1);
    setRecurrenceDays([]);
    setWeekOffset(0);
  };

  const toggleDay = (day: number) => {
    setRecurrenceDays(prev => 
        prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const daysOfWeek = [
    { id: 1, label: "Seg" },
    { id: 2, label: "Ter" },
    { id: 3, label: "Qua" },
    { id: 4, label: "Qui" },
    { id: 5, label: "Sex" },
    { id: 6, label: "Sáb" },
    { id: 0, label: "Dom" }
  ];

  const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
  const hours = Array.from({ length: 11 }, (_, i) => `${9 + i}:00`);

  const getDayDate = (dayIdx: number) => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7) + dayIdx;
    return new Date(now.setDate(diff));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Marcação de Coaching</h1>
        <p className="text-muted-foreground mt-1">Escolha um professor, um horário disponível e descreva o objectivo</p>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <StepDot active={step === "pick-professor"} done={step !== "pick-professor"} n={1} label="Professor" />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <StepDot active={step === "pick-slot"} done={step === "form"} n={2} label="Horário" />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <StepDot active={step === "form"} done={false} n={3} label="Detalhes" />
      </div>

      {step === "pick-professor" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {professors.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => handleSelectProfessor(p)}
              className="bg-card rounded-lg border border-border shadow-card p-5 text-left hover:border-primary/40 hover:shadow-elevated transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-semibold shrink-0">
                  {p.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground">{p.nome}</h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                      {p.modalidades.map(m => (
                          <span key={m.id} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {m.nome}
                          </span>
                      ))}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {step === "pick-slot" && selectedProfessor && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card rounded-lg border border-border p-4 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-semibold text-sm">
                {selectedProfessor.initials}
              </div>
              <div>
                <p className="font-semibold text-foreground">{selectedProfessor.nome}</p>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => {
                            const newOffset = weekOffset - 1;
                            setWeekOffset(newOffset);
                            fetchSlots(selectedProfessor.id, modalityId, format, newOffset);
                        }}
                        className="p-1 hover:bg-muted rounded text-muted-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-medium text-foreground">
                        {getDayDate(0).toLocaleDateString('pt-PT', {day:'numeric', month:'short'})} – {getDayDate(4).toLocaleDateString('pt-PT', {day:'numeric', month:'short'})}
                    </span>
                    <button 
                         onClick={() => {
                            const newOffset = weekOffset + 1;
                            setWeekOffset(newOffset);
                            fetchSlots(selectedProfessor.id, modalityId, format, newOffset);
                        }}
                        className="p-1 hover:bg-muted rounded text-muted-foreground"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
                <select 
                    value={modalityId} 
                    onChange={(e) => {
                        const mid = parseInt(e.target.value);
                        setModalityId(mid);
                        fetchSlots(selectedProfessor.id, mid, format, weekOffset);
                    }}
                    className="text-xs rounded border border-input bg-background px-2 py-1"
                >
                    {selectedProfessor.modalidades.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
                <Button variant="outline" size="sm" onClick={() => setStep("pick-professor")}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Mudar professor
                </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">A carregar horários...</div>
          ) : (
            <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden overflow-x-auto">
                <div className="min-w-[600px]">
                    <div className="grid grid-cols-6 bg-muted border-b border-border">
                        <div className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hora</div>
                        {days.map((d, i) => (
                            <div key={d} className="p-3 text-center border-l border-border">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{d}</p>
                                <p className="text-[10px] text-muted-foreground/60">{getDayDate(i).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}</p>
                            </div>
                        ))}
                    </div>
                    {hours.map((hour) => (
                        <div key={hour} className="grid grid-cols-6 border-b border-border last:border-0">
                            <div className="p-3 text-xs font-medium text-muted-foreground flex items-center">{hour}</div>
                            {days.map((day, dIdx) => {
                                const dayDate = getDayDate(dIdx);
                                const slotsForTime = availableSlots.filter(s => {
                                    const sDate = new Date(s.startTime);
                                    return sDate.getDate() === dayDate.getDate() && 
                                        sDate.getMonth() === dayDate.getMonth() &&
                                        sDate.getHours() === parseInt(hour.split(':')[0]);
                                });
                                const isAvailable = slotsForTime.length > 0;
                                return (
                                    <button
                                        key={`${day}-${hour}`}
                                        onClick={() => isAvailable && handleSelectSlot(slotsForTime[0])}
                                        disabled={!isAvailable}
                                        className={`p-3 text-center text-xs transition-all duration-150 border-l border-border h-12 flex items-center justify-center ${
                                            isAvailable
                                            ? "bg-primary/5 hover:bg-primary/10 text-primary cursor-pointer font-medium"
                                            : "bg-background text-muted-foreground/20"
                                        }`}
                                    >
                                        {isAvailable ? "Disponível" : "–"}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {step === "form" && selectedProfessor && slot && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-card shadow-elevated border-l border-border z-50 overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">Detalhes do Pedido</h2>
                <button onClick={reset} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 space-y-2">
                <p className="text-sm font-medium text-primary flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> {selectedProfessor.nome}
                </p>
                <p className="text-sm text-foreground">
                    {new Date(slot.startTime).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Hora Início</label>
                        <input 
                            type="time" 
                            value={startTime} 
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full bg-background border border-input rounded p-1 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Hora Fim</label>
                        <input 
                            type="time" 
                            value={endTime} 
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full bg-background border border-input rounded p-1 text-sm"
                        />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{slot.estudioNome}</p>
              </div>

              {submitted ? (
                <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4 text-center space-y-2">
                  <p className="text-secondary font-semibold text-sm">✓ Pedido enviado!</p>
                  <p className="text-xs text-muted-foreground">
                    O professor irá aceitar ou rejeitar; depois a Direção valida e atribui sala.
                  </p>
                  <Button variant="outline" size="sm" onClick={reset} className="mt-2">
                    Nova marcação
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                    <div>
                        <label className="text-sm font-medium text-foreground block mb-2">Alunos Participantes</label>
                        <div className="space-y-2">
                            {students.map(s => (
                                <label key={s.id} className="flex items-center gap-2 text-sm">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedStudentIds.includes(s.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedStudentIds([...selectedStudentIds, s.id]);
                                            else setSelectedStudentIds(selectedStudentIds.filter(id => id !== s.id));
                                        }}
                                        className="rounded border-input text-primary focus:ring-primary"
                                    />
                                    {s.nome}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Formato</label>
                      <div className="grid grid-cols-2 gap-2">
                        {formats.map((f) => (
                          <button
                            key={f}
                            onClick={() => {
                                setFormat(f);
                                fetchSlots(selectedProfessor.id, modalityId, f, weekOffset);
                            }}
                            className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                              format === f
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-foreground border-input hover:bg-muted"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 border-t border-border pt-4">
                      <label className="text-sm font-medium text-foreground block">Recorrência</label>
                      
                      <select 
                        value={recurrenceType} 
                        onChange={(e) => setRecurrenceType(parseInt(e.target.value))}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value={0}>Sem recorrência</option>
                        <option value={1}>Diária</option>
                        <option value={2}>Semanal</option>
                        <option value={3}>Quinzenal (Bi-semanal)</option>
                        <option value={4}>Mensal</option>
                        <option value={5}>Anual</option>
                      </select>

                      {recurrenceType > 0 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">
                                    Repetir por quantos {recurrenceType === 1 ? "dias" : recurrenceType === 2 ? "semanas" : recurrenceType === 3 ? "quinzenas" : recurrenceType === 4 ? "meses" : "anos"}?
                                </label>
                                <input 
                                    type="number" 
                                    min={1} 
                                    max={52} 
                                    value={recurrenceCount} 
                                    onChange={(e) => setRecurrenceCount(parseInt(e.target.value))}
                                    className="w-full rounded border-input bg-background px-2 py-1 text-sm"
                                />
                            </div>

                            {(recurrenceType === 2 || recurrenceType === 3) && (
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-2">Dias da semana</label>
                                    <div className="flex flex-wrap gap-2">
                                        {daysOfWeek.map(d => (
                                            <button
                                                key={d.id}
                                                onClick={() => toggleDay(d.id)}
                                                className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                                                    recurrenceDays.includes(d.id) 
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

                            {recurrenceType === 4 && (
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1">Dia do mês (1-31)</label>
                                    <input 
                                        type="number" 
                                        min={1} 
                                        max={31} 
                                        value={recurrenceDays[0] || new Date(slot.startTime).getDate()} 
                                        onChange={(e) => setRecurrenceDays([parseInt(e.target.value)])}
                                        className="w-full rounded border-input bg-background px-2 py-1 text-sm"
                                    />
                                </div>
                            )}

                            {recurrenceType === 5 && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-muted-foreground block mb-1">Dia</label>
                                        <input 
                                            type="number" min={1} max={31} 
                                            value={recurrenceDays[0] || new Date(slot.startTime).getDate()} 
                                            onChange={(e) => setRecurrenceDays([parseInt(e.target.value)])}
                                            className="w-full rounded border-input bg-background px-2 py-1 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground block mb-1">Mês (1-12)</label>
                                        <input 
                                            type="number" min={1} max={12} 
                                            value={recurrenceMonth} 
                                            onChange={(e) => setRecurrenceMonth(parseInt(e.target.value))}
                                            className="w-full rounded border-input bg-background px-2 py-1 text-sm"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                      )}
                      
                      <p className="text-[10px] text-muted-foreground italic">Nota: Sessões recorrentes só serão criadas se o horário estiver livre.</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Objectivo do coaching</label>
                      <textarea
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        rows={4}
                        placeholder="Ex.: preparar audição, trabalhar variação do Lago dos Cisnes..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    <Button className="w-full" disabled={!objective.trim() || selectedStudentIds.length === 0 || loading} onClick={handleSubmit}>
                        {loading ? "A submeter..." : "Submeter Pedido"}
                    </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StepDot = ({ active, done, n, label }: { active: boolean; done: boolean; n: number; label: string }) => (
  <div className="flex items-center gap-2">
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : done
            ? "bg-secondary text-secondary-foreground border-secondary"
            : "bg-background text-muted-foreground border-border"
      }`}
    >
      {n}
    </div>
    <span className={`text-sm ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>
  </div>
);

export default BookingPage;
