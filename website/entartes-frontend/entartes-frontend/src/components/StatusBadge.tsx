import { cn } from "@/lib/utils";

type StatusType =
  | "pending"
  | "approved"
  | "rejected"
  | "scheduled"
  | "ready"
  | "completed"
  | "available"
  | "on_loan"
  | "returned"
  | "prof_pending"
  | "direction_pending"
  | "sold"
  | "for_sale"
  | "for_rent";

const statusConfig: Record<StatusType, { label: string; className: string; pulse?: boolean }> = {
  pending: { label: "Pendente", className: "bg-accent/15 text-accent border-accent/30", pulse: true },
  approved: { label: "Aprovado", className: "bg-secondary/15 text-secondary border-secondary/30" },
  rejected: { label: "Rejeitado", className: "bg-destructive/15 text-destructive border-destructive/30" },
  scheduled: { label: "Agendada", className: "bg-primary/15 text-primary border-primary/30" },
  ready: { label: "Pronto a Validar", className: "bg-accent/15 text-accent border-accent/30", pulse: true },
  completed: { label: "Concluída", className: "bg-secondary/15 text-secondary border-secondary/30" },
  available: { label: "Disponível", className: "bg-secondary/15 text-secondary border-secondary/30" },
  on_loan: { label: "Emprestado", className: "bg-accent/15 text-accent border-accent/30" },
  returned: { label: "Devolvido", className: "bg-primary/15 text-primary border-primary/30" },
  prof_pending: { label: "Aguarda Professor", className: "bg-accent/15 text-accent border-accent/30", pulse: true },
  direction_pending: { label: "Aguarda Direção", className: "bg-primary/15 text-primary border-primary/30", pulse: true },
  sold: { label: "Vendido", className: "bg-muted text-muted-foreground border-border" },
  for_sale: { label: "À Venda", className: "bg-primary/15 text-primary border-primary/30" },
  for_rent: { label: "Para Aluguer", className: "bg-secondary/15 text-secondary border-secondary/30" },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        config.className,
        config.pulse && "animate-pulse-subtle",
        className
      )}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
