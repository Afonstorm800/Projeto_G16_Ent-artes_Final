import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, X, User } from "lucide-react";

interface Professor {
  id: string;
  name: string;
  modalities: string[];
  bio: string;
  initials: string;
}

const professors: Professor[] = [
  { id: "p1", name: "Pedro Santos", modalities: ["Ballet Clássico", "Jazz"], bio: "15 anos de experiência · Formação no Conservatório Nacional", initials: "PS" },
  { id: "p2", name: "Maria Costa", modalities: ["Dança Contemporânea", "Ballet Clássico"], bio: "Bailarina principal CNB · Coreógrafa", initials: "MC" },
  { id: "p3", name: "Ana Lopes", modalities: ["Hip Hop", "Jazz"], bio: "Especialista em dança urbana e fusão", initials: "AL" },
  { id: "p4", name: "Rui Tavares", modalities: ["Sapateado", "Jazz"], bio: "Membro do Tap Dance Portugal", initials: "RT" },
];

const days = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const hours = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

const availabilityByProfessor: Record<string, { available: Record<string, string[]>; booked: Record<string, string[]> }> = {
  p1: {
    available: { Seg: ["10:00", "14:00"], Ter: ["09:00", "16:00"], Qua: ["15:00"], Qui: ["09:00", "14:00"], Sex: ["10:00", "11:00"] },
    booked: { Seg: ["09:00"], Ter: ["14:00"], Qua: ["09:00"], Qui: ["10:00"], Sex: [] },
  },
  p2: {
    available: { Seg: ["11:00", "15:00"], Ter: ["10:00"], Qua: ["10:00", "17:00"], Qui: ["16:00"], Sex: ["15:00"] },
    booked: { Seg: [], Ter: ["11:00"], Qua: ["14:00"], Qui: [], Sex: ["09:00"] },
  },
  p3: {
    available: { Seg: ["09:00", "17:00"], Ter: ["15:00"], Qua: ["11:00"], Qui: ["17:00"], Sex: ["14:00", "16:00"] },
    booked: { Seg: [], Ter: ["09:00"], Qua: [], Qui: ["09:00"], Sex: [] },
  },
  p4: {
    available: { Seg: ["12:00"], Ter: ["12:00", "17:00"], Qua: ["12:00"], Qui: ["12:00"], Sex: ["12:00", "17:00"] },
    booked: { Seg: [], Ter: [], Qua: ["17:00"], Qui: [], Sex: [] },
  },
};

const formats = ["Individual", "Duo", "Trio", "Ensemble"];
const durations = [30, 45, 60, 90, 120];

type Step = "pick-professor" | "pick-slot" | "form";

const BookingPage = () => {
  const [step, setStep] = useState<Step>("pick-professor");
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [slot, setSlot] = useState<{ day: string; hour: string } | null>(null);
  const [modality, setModality] = useState("");
  const [format, setFormat] = useState(formats[0]);
  const [duration, setDuration] = useState(60);
  const [objective, setObjective] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selectProfessor = (p: Professor) => {
    setProfessor(p);
    setModality(p.modalities[0]);
    setStep("pick-slot");
  };

  const selectSlot = (day: string, hour: string) => {
    setSlot({ day, hour });
    setStep("form");
  };

  const reset = () => {
    setStep("pick-professor");
    setProfessor(null);
    setSlot(null);
    setSubmitted(false);
    setObjective("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Marcação de Coaching</h1>
        <p className="text-muted-foreground mt-1">Escolha um professor, um horário disponível e descreva o objectivo</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-sm">
        <StepDot active={step === "pick-professor"} done={step !== "pick-professor"} n={1} label="Professor" />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <StepDot active={step === "pick-slot"} done={step === "form"} n={2} label="Horário" />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <StepDot active={step === "form"} done={false} n={3} label="Detalhes" />
      </div>

      {/* Step 1: Professor */}
      {step === "pick-professor" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {professors.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => selectProfessor(p)}
              className="bg-card rounded-lg border border-border shadow-card p-5 text-left hover:border-primary/40 hover:shadow-elevated transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-semibold shrink-0">
                  {p.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.bio}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.modalities.map((m) => (
                      <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground">
                        {m}
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

      {/* Step 2: Slot grid for selected professor */}
      {step === "pick-slot" && professor && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-semibold text-sm">
                {professor.initials}
              </div>
              <div>
                <p className="font-semibold text-foreground">{professor.name}</p>
                <p className="text-xs text-muted-foreground">Disponibilidade · semana de 24–28 Mar 2026</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStep("pick-professor")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Mudar professor
            </Button>
          </div>

          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-primary bg-primary/10" /> Livre</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted" /> Ocupado</span>
          </div>

          <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
            <div className="grid grid-cols-6">
              <div className="bg-muted p-3 text-xs font-semibold text-muted-foreground">Hora</div>
              {days.map((d) => (
                <div key={d} className="bg-muted p-3 text-xs font-semibold text-center text-muted-foreground">{d}</div>
              ))}
            </div>
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-6 border-t border-border">
                <div className="p-3 text-sm font-medium text-muted-foreground">{hour}</div>
                {days.map((day) => {
                  const av = availabilityByProfessor[professor.id];
                  const isAvailable = av.available[day]?.includes(hour);
                  const isBooked = av.booked[day]?.includes(hour);
                  return (
                    <button
                      key={`${day}-${hour}`}
                      onClick={() => isAvailable && selectSlot(day, hour)}
                      disabled={!isAvailable}
                      className={`p-3 text-center text-sm transition-all duration-150 border-l border-border ${
                        isAvailable
                          ? "bg-primary/5 hover:bg-primary/15 text-primary cursor-pointer border-primary/20"
                          : isBooked
                            ? "bg-muted/50 text-muted-foreground/50"
                            : "bg-background text-muted-foreground/30"
                      }`}
                    >
                      {isBooked ? "Ocupado" : isAvailable ? "Livre" : "–"}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: form */}
      <AnimatePresence>
        {step === "form" && professor && slot && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-card shadow-elevated border-l border-border z-50 overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">Detalhes do Pedido</h2>
                <button onClick={reset} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 space-y-1">
                <p className="text-sm font-medium text-primary flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> {professor.name}
                </p>
                <p className="text-sm text-foreground">{slot.day} · {slot.hour}</p>
                <p className="text-xs text-muted-foreground">Semana de 24–28 Março 2026</p>
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
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Modalidade</label>
                      <select
                        value={modality}
                        onChange={(e) => setModality(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {professor.modalities.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Formato</label>
                      <div className="grid grid-cols-2 gap-2">
                        {formats.map((f) => (
                          <button
                            key={f}
                            onClick={() => setFormat(f)}
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

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Duração (min)</label>
                      <div className="flex flex-wrap gap-2">
                        {durations.map((d) => (
                          <button
                            key={d}
                            onClick={() => setDuration(d)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                              duration === d
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-foreground border-input hover:bg-muted"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Objectivo do coaching</label>
                      <textarea
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        rows={4}
                        placeholder="Ex.: preparar audição, trabalhar variação do Lago dos Cisnes, melhorar técnica de pontas..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
                      <p className="font-medium text-foreground mb-1">Próximos passos</p>
                      <ol className="list-decimal list-inside space-y-0.5">
                        <li>{professor.name} aceita ou rejeita</li>
                        <li>Direção valida e atribui sala</li>
                        <li>Recebe confirmação por email</li>
                      </ol>
                    </div>
                  </div>

                  <Button className="w-full" disabled={!objective.trim()} onClick={() => setSubmitted(true)}>
                    Submeter Pedido
                  </Button>
                </>
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
