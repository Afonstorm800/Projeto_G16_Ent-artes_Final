import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const days = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const hours = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

interface Lesson { day: string; hour: string; title: string; professor: string; studio: string; type: "regular" | "coaching" }

const initialLessons: Lesson[] = [
  { day: "Seg", hour: "10:00", title: "Ballet Iniciação", professor: "Pedro Santos", studio: "Estúdio 1", type: "regular" },
  { day: "Seg", hour: "15:00", title: "Hip Hop", professor: "Ana Lopes", studio: "Estúdio 3", type: "regular" },
  { day: "Ter", hour: "11:00", title: "Contemporânea Avançada", professor: "Maria Costa", studio: "Estúdio 1", type: "regular" },
  { day: "Ter", hour: "16:00", title: "Coaching Ballet · Rita", professor: "Pedro Santos", studio: "Estúdio 2", type: "coaching" },
  { day: "Qua", hour: "09:00", title: "Ballet Avançado", professor: "Pedro Santos", studio: "Estúdio 1", type: "regular" },
  { day: "Qua", hour: "15:00", title: "Jazz (regular)", professor: "Ana Lopes", studio: "Estúdio 1", type: "regular" },
  { day: "Qui", hour: "10:00", title: "Jazz Intermédio", professor: "Pedro Santos", studio: "Estúdio 3", type: "regular" },
  { day: "Sex", hour: "12:00", title: "Sapateado", professor: "Rui Tavares", studio: "Estúdio 2", type: "regular" },
  { day: "Sex", hour: "17:00", title: "Hip Hop (regular)", professor: "Ana Lopes", studio: "Estúdio 1", type: "regular" },
];

const GeneralSchedulePage = () => {
  const [lessons, setLessons] = useState(initialLessons);
  const [filter, setFilter] = useState<"all" | "regular" | "coaching">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ day: "Seg", hour: "10:00", title: "", professor: "Pedro Santos", studio: "Estúdio 1" });

  const filtered = lessons.filter((l) => filter === "all" || l.type === filter);

  const addLesson = () => {
    if (!draft.title.trim()) return;
    setLessons((l) => [...l, { ...draft, type: "regular" }]);
    setShowAdd(false);
    setDraft({ day: "Seg", hour: "10:00", title: "", professor: "Pedro Santos", studio: "Estúdio 1" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Horário Geral</h1>
          <p className="text-muted-foreground mt-1">
            Horários regulares definidos pela Direção no início do ano letivo · coachings adicionados conforme aprovação
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar aula regular
        </Button>
      </div>

      <div className="flex gap-2">
        {(["all", "regular", "coaching"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              filter === f ? "bg-foreground text-background border-foreground" : "bg-background text-foreground border-border hover:bg-muted"
            }`}
          >
            {f === "all" ? "Tudo" : f === "regular" ? "Regulares" : "Coachings"}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-lg shadow-card border border-border overflow-x-auto">
        <div className="grid grid-cols-6 min-w-[820px]">
          <div className="bg-muted p-3 text-xs font-semibold text-muted-foreground">Hora</div>
          {days.map((d) => (
            <div key={d} className="bg-muted p-3 text-xs font-semibold text-center text-muted-foreground">{d}</div>
          ))}
          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="p-3 text-xs font-medium text-muted-foreground border-t border-border">{hour}</div>
              {days.map((day) => {
                const ev = filtered.find((e) => e.day === day && e.hour === hour);
                return (
                  <div key={`${day}-${hour}`} className="p-1.5 border-t border-l border-border min-h-[64px]">
                    {ev && (
                      <div className={`rounded-md border p-2 h-full ${
                        ev.type === "coaching"
                          ? "border-accent/40 bg-accent/10"
                          : "border-primary/30 bg-primary/10"
                      }`}>
                        <p className={`text-xs font-semibold leading-tight ${ev.type === "coaching" ? "text-accent" : "text-primary"}`}>
                          {ev.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{ev.professor} · {ev.studio}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card rounded-lg shadow-elevated border border-border w-full max-w-md p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">Nova aula regular</h2>
                <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Modalidade</label>
                  <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Ex: Ballet Iniciação" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Dia</label>
                    <select value={draft.day} onChange={(e) => setDraft({ ...draft, day: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {days.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Hora</label>
                    <select value={draft.hour} onChange={(e) => setDraft({ ...draft, hour: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {hours.map((h) => <option key={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Professor</label>
                  <select value={draft.professor} onChange={(e) => setDraft({ ...draft, professor: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {["Pedro Santos", "Maria Costa", "Ana Lopes", "Rui Tavares"].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Sala</label>
                  <select value={draft.studio} onChange={(e) => setDraft({ ...draft, studio: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {["Estúdio 1", "Estúdio 2", "Estúdio 3"].map((s) => <option key={s}>{s}</option>)}
                  </select>
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
