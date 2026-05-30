import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import DualConfirmation from "@/components/DualConfirmation";
import { useAuth } from "@/contexts/AuthContext";

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
  // Two-stage workflow: professor first, then direction
  profStatus: "pending" | "accepted" | "rejected";
  directionStatus: "pending" | "approved" | "rejected" | "n/a";
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
  status: "ready" | "completed" | "pending";
}

const initialBookings: BookingRequest[] = [
  { id: 1, student: "Rita Gomes", guardian: "Carla Gomes", modality: "Ballet Clássico", format: "Individual", day: "Ter", time: "16:00", professor: "Pedro Santos", objective: "Preparar audição CNB", profStatus: "pending", directionStatus: "n/a", studio: null },
  { id: 2, student: "João Silva", guardian: "Ana Silva", modality: "Dança Contemporânea", format: "Duo", day: "Qua", time: "15:00", professor: "Maria Costa", objective: "Trabalhar peça de exame", profStatus: "accepted", directionStatus: "pending", studio: null },
  { id: 3, student: "Sara Mendes", guardian: "Luís Mendes", modality: "Jazz", format: "Individual", day: "Qui", time: "14:00", professor: "Pedro Santos", objective: "Coreografia para festival", profStatus: "pending", directionStatus: "n/a", studio: null },
  { id: 4, student: "Miguel Ferreira", guardian: "Carla Gomes", modality: "Hip Hop", format: "Trio", day: "Sex", time: "16:00", professor: "Ana Lopes", objective: "Preparar showcase de fim de ano", profStatus: "accepted", directionStatus: "approved", studio: "Estúdio 1" },
];

const initialSessions: Session[] = [
  { id: 101, student: "Rita Gomes", modality: "Ballet Clássico", date: "2026-03-20 16:00", professor: "Pedro Santos", guardian: "Carla Gomes", encConfirmed: true, profConfirmed: true, status: "ready" },
  { id: 102, student: "João Silva", modality: "Dança Contemporânea", date: "2026-03-19 15:00", professor: "Maria Costa", guardian: "Ana Silva", encConfirmed: true, profConfirmed: false, status: "pending" },
  { id: 103, student: "Sara Mendes", modality: "Jazz", date: "2026-03-18 14:00", professor: "Pedro Santos", guardian: "Luís Mendes", encConfirmed: false, profConfirmed: true, status: "pending" },
  { id: 104, student: "Miguel Ferreira", modality: "Hip Hop", date: "2026-03-17 10:00", professor: "Ana Lopes", guardian: "Carla Gomes", encConfirmed: true, profConfirmed: true, status: "ready" },
  { id: 105, student: "Rita Gomes", modality: "Ballet Clássico", date: "2026-03-16 16:00", professor: "Pedro Santos", guardian: "Carla Gomes", encConfirmed: false, profConfirmed: false, status: "pending" },
];

const ValidationPage = () => {
  const { user } = useAuth();
  const role = user?.tipo ?? "direcao";

  // Tabs available per role
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
  const [bookings, setBookings] = useState(initialBookings);
  const [sessions, setSessions] = useState(initialSessions);

  const profAction = (id: number, action: "accepted" | "rejected") => {
    setBookings((prev) => prev.map((b) =>
      b.id === id
        ? { ...b, profStatus: action, directionStatus: action === "accepted" ? "pending" : "n/a" }
        : b
    ));
  };

  const directionAction = (id: number, action: "approved" | "rejected") => {
    setBookings((prev) => prev.map((b) =>
      b.id === id
        ? { ...b, directionStatus: action, studio: action === "approved" ? "Estúdio 2" : null }
        : b
    ));
  };

  const confirmSession = (id: number, who: "enc" | "prof") => {
    setSessions((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      const next = { ...s, encConfirmed: who === "enc" ? true : s.encConfirmed, profConfirmed: who === "prof" ? true : s.profConfirmed };
      if (next.encConfirmed && next.profConfirmed) next.status = "ready";
      return next;
    }));
  };

  const validateSession = (id: number) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "completed" as const } : s)));
  };

  // Filter rows per role
  const profRequests = bookings.filter((b) => b.profStatus === "pending");
  const directionRequests = bookings.filter((b) => b.profStatus === "accepted" && b.directionStatus === "pending");
  const allMyRequests = bookings; // for EE: would normally filter by guardian; we show all for the mock

  const sessionsForRole = sessions.filter((s) => {
    if (role === "professor") return s.professor === "Pedro Santos" || true; // demo: show all
    if (role === "encarregado") return true;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {role === "professor" ? "Pedidos & Confirmações" : role === "encarregado" ? "Os meus Pedidos" : "Validações"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {role === "direcao" && "Aprovação final de marcações já aceites pelos professores"}
          {role === "professor" && "Aceitar pedidos de coaching e confirmar sessões realizadas"}
          {role === "encarregado" && "Acompanhar pedidos e confirmar sessões realizadas"}
        </p>
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

      {/* PROFESSOR: pedidos para aceitar/rejeitar */}
      {tab === "prof-requests" && (
        <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 font-semibold text-muted-foreground">Aluno</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Modalidade</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Formato</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Horário</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Objectivo</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profRequests.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Sem pedidos pendentes.</td></tr>
                )}
                {profRequests.map((b, i) => (
                  <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <td className="p-3 font-medium text-foreground">{b.student}</td>
                    <td className="p-3 text-foreground">{b.modality}</td>
                    <td className="p-3 text-foreground">{b.format}</td>
                    <td className="p-3 text-foreground">{b.day} {b.time}</td>
                    <td className="p-3 text-muted-foreground max-w-xs">{b.objective}</td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" onClick={() => profAction(b.id, "accepted")}>Aceitar</Button>
                        <Button size="sm" variant="outline" onClick={() => profAction(b.id, "rejected")}>Rejeitar</Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DIREÇÃO: aprovação final */}
      {tab === "direction-requests" && (
        <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 font-semibold text-muted-foreground">Aluno</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Encarregado</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Professor</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Modalidade · Formato</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Horário</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Estado</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {directionRequests.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Sem pedidos a aguardar aprovação.</td></tr>
                )}
                {directionRequests.map((b, i) => (
                  <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <td className="p-3 font-medium text-foreground">{b.student}</td>
                    <td className="p-3 text-muted-foreground">{b.guardian}</td>
                    <td className="p-3 text-foreground">{b.professor}</td>
                    <td className="p-3 text-foreground">{b.modality} · {b.format}</td>
                    <td className="p-3 text-foreground">{b.day} {b.time}</td>
                    <td className="p-3"><StatusBadge status="direction_pending" /></td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" onClick={() => directionAction(b.id, "approved")}>Validar & Atribuir Sala</Button>
                        <Button size="sm" variant="outline" onClick={() => directionAction(b.id, "rejected")}>Rejeitar</Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ENCARREGADO: os meus pedidos com estado actual do workflow */}
      {tab === "my-requests" && (
        <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 font-semibold text-muted-foreground">Aluno</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Professor</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Modalidade</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Horário</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Sala</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allMyRequests.map((b, i) => {
                  const status =
                    b.profStatus === "rejected" || b.directionStatus === "rejected"
                      ? "rejected"
                      : b.directionStatus === "approved"
                        ? "approved"
                        : b.profStatus === "accepted"
                          ? "direction_pending"
                          : "prof_pending";
                  return (
                    <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td className="p-3 font-medium text-foreground">{b.student}</td>
                      <td className="p-3 text-foreground">{b.professor}</td>
                      <td className="p-3 text-foreground">{b.modality}</td>
                      <td className="p-3 text-foreground">{b.day} {b.time}</td>
                      <td className="p-3 text-foreground">{b.studio ?? "–"}</td>
                      <td className="p-3"><StatusBadge status={status} /></td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO 48H — visível a todos */}
      {tab === "sessions-48h" && (
        <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 font-semibold text-muted-foreground">Aluno</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Modalidade</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Data</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Professor</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Confirmações</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Estado</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessionsForRole.map((s, i) => {
                  const bothConfirmed = s.encConfirmed && s.profConfirmed;
                  return (
                    <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td className="p-3 font-medium text-foreground">{s.student}</td>
                      <td className="p-3 text-foreground">{s.modality}</td>
                      <td className="p-3 text-foreground">{s.date}</td>
                      <td className="p-3 text-foreground">{s.professor}</td>
                      <td className="p-3"><DualConfirmation encConfirmed={s.encConfirmed} profConfirmed={s.profConfirmed} /></td>
                      <td className="p-3"><StatusBadge status={s.status} /></td>
                      <td className="p-3 text-right">
                        {/* Direção valida quando ambos confirmaram */}
                        {role === "direcao" && s.status === "ready" && bothConfirmed && (
                          <Button size="sm" onClick={() => validateSession(s.id)}>Validar</Button>
                        )}
                        {/* Professor confirma a sua parte */}
                        {role === "professor" && !s.profConfirmed && s.status !== "completed" && (
                          <Button size="sm" onClick={() => confirmSession(s.id, "prof")}>Confirmar conclusão</Button>
                        )}
                        {/* EE confirma a sua parte */}
                        {role === "encarregado" && !s.encConfirmed && s.status !== "completed" && (
                          <Button size="sm" onClick={() => confirmSession(s.id, "enc")}>Confirmar conclusão</Button>
                        )}
                        {/* Estado de espera */}
                        {s.status === "pending" && !bothConfirmed && (
                          ((role === "professor" && s.profConfirmed) ||
                           (role === "encarregado" && s.encConfirmed) ||
                           role === "direcao") && (
                            <span className="text-xs text-muted-foreground">
                              A aguardar {!s.encConfirmed && "EE"}{!s.encConfirmed && !s.profConfirmed && " e "}{!s.profConfirmed && "Prof"}
                            </span>
                          )
                        )}
                        {role === "direcao" && s.status === "pending" && (
                          <span className="text-xs text-muted-foreground">Sem ação</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationPage;
