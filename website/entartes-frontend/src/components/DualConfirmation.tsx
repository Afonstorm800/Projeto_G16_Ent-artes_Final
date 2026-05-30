import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DualConfirmationProps {
  encConfirmed: boolean;
  profConfirmed: boolean;
}

const DualConfirmation = ({ encConfirmed, profConfirmed }: DualConfirmationProps) => {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            encConfirmed ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          {encConfirmed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
        </div>
        <span className="text-xs text-muted-foreground">EE</span>
      </div>
      <div className="w-4 h-px bg-border" />
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            profConfirmed ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          {profConfirmed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
        </div>
        <span className="text-xs text-muted-foreground">Prof</span>
      </div>
    </div>
  );
};

export default DualConfirmation;
