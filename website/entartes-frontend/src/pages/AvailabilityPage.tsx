import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

const days = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const hours = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

const AvailabilityPage = () => {
  const [available, setAvailable] = useState<Record<string, boolean>>({
    "Seg-10:00": true, "Ter-16:00": true, "Qui-14:00": true, "Sex-11:00": true,
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key: string) => {
    setAvailable((a) => ({ ...a, [key]: !a[key] }));
    setSaved(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Disponibilidade</h1>
          <p className="text-muted-foreground mt-1">
            Os encarregados só podem pedir coachings em horários marcados como disponíveis.
          </p>
        </div>
        <Button onClick={() => setSaved(true)}>
          <Save className="h-4 w-4 mr-2" /> {saved ? "Disponibilidade Guardada" : "Guardar"}
        </Button>
      </div>

      {saved && (
        <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-3 text-sm text-secondary">
          ✓ Disponibilidade atualizada. Os encarregados verão estes horários ao pedir coaching.
        </div>
      )}

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
              const key = `${day}-${hour}`;
              const isOn = !!available[key];
              return (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  className={`p-3 text-center text-sm transition-colors border-l border-border ${
                    isOn
                      ? "bg-primary/15 text-primary hover:bg-primary/25"
                      : "bg-background text-muted-foreground/40 hover:bg-muted"
                  }`}
                >
                  {isOn ? "Disponível" : "—"}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Aulas regulares fixas (definidas pela Direção no início do ano) não aparecem aqui — apenas a sua disponibilidade extra para coachings.
      </p>
    </div>
  );
};

export default AvailabilityPage;
