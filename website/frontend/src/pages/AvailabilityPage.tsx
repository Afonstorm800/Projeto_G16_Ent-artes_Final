import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { sessionsApi } from "@/services/session";
import { toast } from "sonner";

const days = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const dayMap: Record<string, number> = { "Seg": 1, "Ter": 2, "Qua": 3, "Qui": 4, "Sex": 5 };
const reverseDayMap: Record<number, string> = { 1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex" };
const hours = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

const AvailabilityPage = () => {
  const [available, setAvailable] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await sessionsApi.getAvailability();
        const apiData = res.data;
        const mapped: Record<string, boolean> = {};
        
        apiData.forEach((item: any) => {
            const dayName = reverseDayMap[item.diaSemana];
            if (dayName) {
                // Assuming slots are 1 hour long for simplicity in this view
                const hourStr = item.horaInicio.substring(0, 5);
                mapped[`${dayName}-${hourStr}`] = true;
            }
        });
        setAvailable(mapped);
      } catch (error) {
        toast.error("Erro ao carregar disponibilidade");
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, []);

  const toggle = (key: string) => {
    setAvailable((a) => ({ ...a, [key]: !a[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
        const slots = Object.entries(available)
            .filter(([_, isAvailable]) => isAvailable)
            .map(([key, _]) => {
                const [day, hour] = key.split("-");
                return {
                    diaSemana: dayMap[day],
                    horaInicio: `${hour}:00`,
                    horaFim: `${parseInt(hour.split(":")[0]) + 1}:00:00` // 1h slot
                };
            });
            
        await sessionsApi.updateAvailability(slots);
        toast.success("Disponibilidade atualizada com sucesso!");
    } catch (error) {
        toast.error("Erro ao guardar disponibilidade");
    } finally {
        setSaving(false);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Disponibilidade</h1>
          <p className="text-muted-foreground mt-1">
            Os encarregados só podem pedir coachings em horários marcados como disponíveis.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? "A guardar..." : "Guardar"}
        </Button>
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
