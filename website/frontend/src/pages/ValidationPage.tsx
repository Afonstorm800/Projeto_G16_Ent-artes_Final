import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import DualConfirmation from "@/components/DualConfirmation";
import { useAuth } from "@/contexts/AuthContext";
import { sessionsApi } from "@/services/session";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BookingRequest {
  id: number;
  student: string;
  guardian: string;
  modality: string;
  format: string;
  day: string;
  time: string;
  professor: string;
  objective: string;
  status: "pending" | "approved" | "rejected" | "prof_pending" | "direction_pending";
  studio: string | null;
}

interface Session {
  id: number;
  student: string;
  modality: string;
  date: string;
  professor: string;
  guardian: string;
  encConfirmed: boolean;
  profConfirmed: boolean;
  status: "ready" | "completed" | "pending" | "scheduled";
}

const ValidationPage = () => {
  const { user } = useAuth();
  const role = user?.tipo ?? "direcao";

  const tabs = useMemo(() => {
    if (role === "professor") return [
      { id: "prof-requests", label: "Pedidos para mim" },
      { id: "sessions-48h", label: "Confirmação 48h" },
    ];
    if (role === "encarregado") return [
      { id: "my-requests", label: "Os meus pedidos" },
      { id: "sessions-48h", label: "Confirmação 48h" },
    ];
    return [
      { id: "direction-requests", label: "Aprovação Final" },
      { id: "sessions-48h", label: "Confirmação 48h" },
    ];
  }, [role]);

  const [tab, setTab] = useState(tabs[0].id);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [selectedStudioId, setSelectedStudioId] = useState<string>("0");
  const [estudios, setEstudios] = useState<{id: number, nome: string}[]>([]);

  const fetchBookings = async () => {
    try {
      let res;
      if (role === "professor") {
        res = await sessionsApi.getPendingProfessor();
      } else if (role === "direcao") {
        res = await sessionsApi.getPendingDirecao();
      } else if (role === "encarregado") {
        // Encarregados also use getConfirmations to see the status of their requests
        res = await sessionsApi.getConfirmations();
      } else {
          res = { data: [] };
      }
      
      const data = Array.isArray(res?.data) ? res.data : [];

      const mapped: BookingRequest[] = data.map((s: any) => {
        let statusKey: any = "pending";
        
        // Map backend state to StatusBadge keys
        if (s.estado === 0) statusKey = "prof_pending";
        else if (s.estado === 1) statusKey = "direction_pending";
        else if (s.estado === 2) statusKey = "approved";
        else if (s.estado === 5) statusKey = "rejected";

        return {
            id: s.id,
            student: s.participantes?.map((p: any) => p.aluno?.nome).join(', ') || "N/A",
            guardian: "Encarregado",
            modality: s.modalidade?.nome || "N/A",
            format: ["Individual", "Duo", "Trio", "Ensemble"][s.formato] || "Individual",
            day: new Date(s.dataHoraInicio).toLocaleDateString('pt-PT', { weekday: 'short' }),
            time: new Date(s.dataHoraInicio).getHours().toString().padStart(2, '0') + ":00",
            professor: s.professor?.nome || "N/A",
            objective: s.objetivo,
            status: statusKey,
            studio: s.estudio?.nome || null
        };
      });
      setBookings(mapped);
    } catch (error) {
      console.error("ValidationPage: fetchBookings error", error);
      toast.error("Erro ao carregar pedidos");
    }
  };

  const fetchSessions = async () => {
    try {
        const res = await sessionsApi.getConfirmations();
        const data = Array.isArray(res?.data) ? res.data : [];
        console.log("ValidationPage: Raw sessions data from API:", data);

        const mapped: Session[] = data.map((s: any) => ({
            id: s.id,
            student: s.participantes?.map((p: any) => p.aluno?.nome).join(', ') || "N/A",
            modality: s.modalidade?.nome || "N/A",
            date: new Date(s.dataHoraInicio).toLocaleString('pt-PT'),
            professor: s.professor?.nome || "N/A",
            guardian: "Encarregado",
            encConfirmed: s.encConfirmado,
            profConfirmed: s.profConfirmado,
            status: (s.encConfirmado && s.profConfirmado) ? "direction_pending" : (s.estado === 4 ? "completed" : "scheduled")
        }));
        console.log("ValidationPage: Mapped sessions:", mapped);
        setSessions(mapped);
    } catch (error) {
        console.error("ValidationPage: Error fetching sessions", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchBookings(), fetchSessions()]);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, [role, tab]);

  useEffect(() => {
    if (role === "direcao") {
        sessionsApi.getEstudios().then(res => setEstudios(res.data));
    }
  }, [role]);

  const handleProfAction = async (id: number, action: "accepted" | "rejected") => {
    try {
      if (action === "accepted") {
        await sessionsApi.professorAccept(id);
        toast.success("Pedido aceite e enviado para a Direção");
      } else {
        await sessionsApi.professorReject(id, "Rejeitado pelo professor");
        toast.success("Pedido rejeitado");
      }
      fetchBookings();
    } catch (error) {
      toast.error("Erro ao processar ação");
    }
  };

  const openApproveModal = (id: number) => {
    setSelectedBookingId(id);
    setSelectedStudioId("0");
    setIsApproveModalOpen(true);
  };

  const handleConfirmApproval = async () => {
    if (!selectedBookingId) return;
    try {
      const studioId = selectedStudioId === "0" ? undefined : parseInt(selectedStudioId);
      await sessionsApi.approveBooking(selectedBookingId, studioId);
      toast.success("Pedido validado e sala atribuída");
      setIsApproveModalOpen(false);
      fetchBookings();
    } catch (error) {
      toast.error("Erro ao aprovar pedido");
    }
  };

  const handleRejectBooking = async (id: number) => {
    try {
      await sessionsApi.rejectBooking(id);
      toast.success("Pedido rejeitado");
      fetchBookings();
    } catch (error) {
      toast.error("Erro ao rejeitar");
    }
  };

  const confirmSession = async (id: number, who: "enc" | "prof") => {
    try {
        if (who === "enc") await sessionsApi.confirmByEnc(id);
        else await sessionsApi.confirmByProf(id);
        toast.success("Presença confirmada!");
        fetchSessions();
    } catch (error) {
        toast.error("Erro ao confirmar presença");
    }
  };

  const validateFinal = async (id: number) => {
    try {
        await sessionsApi.validateSession(id);
        toast.success("Aula validada para faturação");
        fetchSessions();
    } catch (error) {
        toast.error("Erro ao validar aula");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Validações</h1>
        <p className="text-muted-foreground mt-1">Gestão de pedidos e confirmações de presença</p>
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.id ? "bg-card text-foreground shadow-card" : "text-muted-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
          <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      ) : (
        <div className="space-y-4">
            {tab === "sessions-48h" ? (
                sessions.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground italic bg-muted/20 rounded-lg border border-dashed">
                        Nenhuma sessão para confirmar de momento.
                    </div>
                ) : (
                    sessions.map((s) => (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          key={s.id}
                          className="bg-card rounded-lg shadow-sm border border-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                            <div className="min-w-[120px]">
                                <StatusBadge status={s.status} />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground">{s.modality}</h3>
                                <p className="text-xs text-muted-foreground">{s.date}</p>
                            </div>
                            <div className="text-sm border-l border-border pl-4 hidden md:block">
                                <p className="text-xs text-muted-foreground uppercase font-bold text-[10px]">Aluno</p>
                                <p className="font-medium">{s.student}</p>
                            </div>
                            <div className="text-sm border-l border-border pl-4 hidden md:block">
                                <p className="text-xs text-muted-foreground uppercase font-bold text-[10px]">Professor</p>
                                <p className="font-medium">{s.professor}</p>
                            </div>
                          </div>
        
                          <div className="flex items-center gap-4">
                            <DualConfirmation 
                                id={s.id} 
                                encConfirmed={s.encConfirmed} 
                                profConfirmed={s.profConfirmed} 
                                onConfirm={confirmSession}
                                role={role}
                            />
                            {role === "encarregado" && !s.encConfirmed && (
                                <Button size="sm" onClick={() => confirmSession(s.id, "enc")}>
                                    Confirmar Presença
                                </Button>
                            )}
                            {role === "professor" && !s.profConfirmed && (
                                <Button size="sm" onClick={() => confirmSession(s.id, "prof")}>
                                    Confirmar Presença
                                </Button>
                            )}
                            {role === "direcao" && (
                                <div className="flex gap-2">
                                    {!s.encConfirmed && (
                                        <Button size="sm" variant="outline" onClick={() => confirmSession(s.id, "enc")}>
                                            Confirmar EE
                                        </Button>
                                    )}
                                    {!s.profConfirmed && (
                                        <Button size="sm" variant="outline" onClick={() => confirmSession(s.id, "prof")}>
                                            Confirmar Prof
                                        </Button>
                                    )}
                                    {s.encConfirmed && s.profConfirmed && (
                                        <Button size="sm" onClick={() => validateFinal(s.id)}>Validar</Button>
                                    )}
                                </div>
                            )}
                          </div>
                        </motion.div>
                    ))
                )
            ) : (
                bookings.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground italic bg-muted/20 rounded-lg border border-dashed">
                        Nenhum pedido encontrado.
                    </div>
                ) : (
                    bookings.map((b) => (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          key={b.id}
                          className="bg-card rounded-lg shadow-sm border border-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                           <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                                <div className="min-w-[120px]">
                                    <StatusBadge status={b.status} />
                                </div>
                                <div className="min-w-[150px]">
                                    <h3 className="font-bold text-foreground">{b.modality}</h3>
                                    <p className="text-xs text-muted-foreground">{b.format} · {b.day}, {b.time}</p>
                                </div>
                                <div className="text-sm border-l border-border pl-4">
                                    <p className="text-muted-foreground text-[10px] uppercase font-bold">Aluno/Prof</p>
                                    <p className="font-medium">{b.student} · {b.professor}</p>
                                </div>
                                <div className="text-sm border-l border-border pl-4 flex-1">
                                    <p className="text-muted-foreground text-[10px] uppercase font-bold">Objetivo</p>
                                    <p className="italic text-xs line-clamp-1">"{b.objective}"</p>
                                </div>
                                {b.studio && (
                                    <div className="text-sm border-l border-border pl-4">
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold">Sala</p>
                                        <p className="font-bold text-primary text-xs">{b.studio}</p>
                                    </div>
                                )}
                           </div>
        
                          <div className="flex gap-2 shrink-0">
                            {role === "professor" && b.status === "prof_pending" && (
                              <>
                                <Button size="sm" variant="outline" className="border-destructive text-destructive" onClick={() => handleProfAction(b.id, "rejected")}>Rejeitar</Button>
                                <Button size="sm" onClick={() => handleProfAction(b.id, "accepted")}>Aceitar</Button>
                              </>
                            )}
                            {role === "direcao" && b.status === "direction_pending" && (
                              <>
                                <Button size="sm" variant="outline" className="border-destructive text-destructive" onClick={() => handleRejectBooking(b.id)}>Rejeitar</Button>
                                <Button size="sm" onClick={() => openApproveModal(b.id)}>Aprovar & Alocar</Button>
                              </>
                            )}
                            {role === "encarregado" && (
                              <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">
                                {b.status === "approved" ? "Pedido Confirmado" : b.status === "rejected" ? "Pedido Recusado" : "A aguardar aprovação"}
                              </span>
                            )}
                          </div>
                        </motion.div>
                    ))
                )
            )}
        </div>
      )}

      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aprovar Marcação</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Atribuir Sala de Estúdio</label>
              <Select value={selectedStudioId} onValueChange={setSelectedStudioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um estúdio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sem estúdio (TBD)</SelectItem>
                  {estudios.map((e) => (
                    <SelectItem key={e.id} value={e.id.toString()}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground italic">Ao aprovar, o encarregado será notificado e a marcação será confirmada no horário.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmApproval}>Confirmar Aprovação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ValidationPage;
