import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface DualConfirmationProps {
  id: number;
  encConfirmed: boolean;
  profConfirmed: boolean;
  role: string;
  onConfirm: (id: number, who: "enc" | "prof") => Promise<void>;
}

const DualConfirmation = ({ id, encConfirmed, profConfirmed, role, onConfirm }: DualConfirmationProps) => {
  const [loading, setLoading] = useState<"enc" | "prof" | null>(null);

  const handleConfirm = async (who: "enc" | "prof") => {
    // Allow clicking if it's the user's role OR if it's Direcao
    if (who === "enc" && role !== "encarregado" && role !== "direcao") return;
    if (who === "prof" && role !== "professor" && role !== "direcao") return;
    
    // Don't click if already confirmed
    if (who === "enc" && encConfirmed) return;
    if (who === "prof" && profConfirmed) return;

    setLoading(who);
    try {
      await onConfirm(id, who);
    } finally {
      setLoading(null);
    }
  };

  const isEncClickable = (role === "encarregado" || role === "direcao") && !encConfirmed;
  const isProfClickable = (role === "professor" || role === "direcao") && !profConfirmed;

  return (
    <div className="flex items-center gap-1">
      {/* Guardian (EE) Confirmation */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleConfirm("enc")}
          disabled={!isEncClickable || loading !== null}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all border shadow-sm",
            encConfirmed 
                ? "bg-secondary text-secondary-foreground border-transparent" 
                : isEncClickable 
                    ? "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary active:scale-90" 
                    : "bg-muted text-muted-foreground/50 border-transparent cursor-not-allowed"
          )}
          title={isEncClickable ? "Confirmar Presença (EE)" : encConfirmed ? "Presença Confirmada" : "Aguardando EE"}
        >
          {loading === "enc" ? <Loader2 className="h-4 w-4 animate-spin" /> : encConfirmed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>
        <span className={cn("text-[10px] font-bold uppercase", encConfirmed ? "text-secondary" : "text-muted-foreground/60")}>EE</span>
      </div>

      <div className="w-4 h-px bg-border" />

      {/* Professor Confirmation */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleConfirm("prof")}
          disabled={!isProfClickable || loading !== null}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all border shadow-sm",
            profConfirmed 
                ? "bg-secondary text-secondary-foreground border-transparent" 
                : isProfClickable 
                    ? "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary active:scale-90" 
                    : "bg-muted text-muted-foreground/50 border-transparent cursor-not-allowed"
          )}
          title={isProfClickable ? "Confirmar Presença (Prof)" : profConfirmed ? "Presença Confirmada" : "Aguardando Professor"}
        >
          {loading === "prof" ? <Loader2 className="h-4 w-4 animate-spin" /> : profConfirmed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>
        <span className={cn("text-[10px] font-bold uppercase", profConfirmed ? "text-secondary" : "text-muted-foreground/60")}>Prof</span>
      </div>
    </div>
  );
};

export default DualConfirmation;
