import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, X, Package, ArrowLeftRight, ShoppingBag, Calendar as CalendarIcon } from "lucide-react";

type InventoryTab = "items" | "contributions" | "loans" | "sales";
type ItemType = "rent" | "sale";

interface Item {
  id: number;
  name: string;
  description: string;
  category: string;
  condition: string;
  type: ItemType;
  available: boolean;
  onLoan: boolean;
  // Para aluguer
  rentFee?: number;
  bookedDates?: string[]; // ISO yyyy-mm-dd
  // Para venda
  salePrice?: number;
  sold?: boolean;
  contributor: string;
  imageColor: string;
}

interface Contribution {
  id: number;
  name: string;
  type: ItemType;
  category: string;
  contributor: string;
  status: "pending" | "approved" | "rejected";
}

interface Loan {
  id: number;
  item: string;
  requester: string;
  startDate: string;
  endDate: string;
  fee: number;
  status: "pending" | "approved" | "returned" | "rejected";
}

interface Sale {
  id: number;
  item: string;
  buyer: string;
  date: string;
  price: number;
  status: "pending" | "approved" | "completed" | "rejected";
}

const items: Item[] = [
  { id: 1, name: "Tutu de Ballet Rosa", description: "Tutu clássico para ensaios e apresentações", category: "Figurino", condition: "Bom", type: "rent", available: true, onLoan: false, rentFee: 5, bookedDates: ["2026-04-02", "2026-04-03", "2026-04-04"], contributor: "Maria Costa", imageColor: "bg-pink-100" },
  { id: 2, name: "Sapatilhas de Ponta #12", description: "Sapatilhas de ponta tamanho 38", category: "Calçado", condition: "Excelente", type: "sale", available: false, onLoan: false, salePrice: 35, sold: true, contributor: "Ana Silva", imageColor: "bg-amber-100" },
  { id: 3, name: "Collant Preto M", description: "Collant de malha para aulas diárias", category: "Figurino", condition: "Bom", type: "sale", available: true, onLoan: false, salePrice: 12, contributor: "Pedro Santos", imageColor: "bg-slate-100" },
  { id: 4, name: "Coroa de Flores", description: "Acessório para espetáculo de Primavera", category: "Acessório", condition: "Novo", type: "rent", available: true, onLoan: false, rentFee: 2, bookedDates: [], contributor: "Carla Gomes", imageColor: "bg-green-100" },
  { id: 5, name: "Véu de Dança", description: "Véu transparente para dança contemporânea", category: "Acessório", condition: "Bom", type: "rent", available: true, onLoan: false, rentFee: 4, bookedDates: ["2026-04-10"], contributor: "Luís Mendes", imageColor: "bg-blue-100" },
  { id: 6, name: "Saia de Flamenco Vermelha", description: "Saia longa com babados para flamenco", category: "Figurino", condition: "Excelente", type: "rent", available: false, onLoan: true, rentFee: 6, bookedDates: ["2026-03-15", "2026-03-16", "2026-03-17"], contributor: "Maria Costa", imageColor: "bg-red-100" },
  { id: 7, name: "Sapatos Sapateado #38", description: "Par de sapatos profissionais quase novos", category: "Calçado", condition: "Excelente", type: "sale", available: true, onLoan: false, salePrice: 60, contributor: "Rui Tavares", imageColor: "bg-amber-100" },
];

const initialContributions: Contribution[] = [
  { id: 10, name: "Tutu de Ensaio Branco", type: "rent", category: "Figurino", contributor: "Sofia Almeida", status: "pending" },
  { id: 11, name: "Par de Castanholas", type: "sale", category: "Acessório", contributor: "Miguel Ferreira", status: "pending" },
];

const initialLoans: Loan[] = [
  { id: 20, item: "Sapatilhas de Ponta #12", requester: "Rita Gomes", startDate: "2026-03-10", endDate: "2026-03-25", fee: 8, status: "approved" },
  { id: 21, item: "Saia de Flamenco Vermelha", requester: "Sara Mendes", startDate: "2026-03-15", endDate: "2026-03-30", fee: 18, status: "approved" },
  { id: 22, item: "Véu de Dança", requester: "João Silva", startDate: "2026-04-10", endDate: "2026-04-12", fee: 8, status: "pending" },
];

const initialSales: Sale[] = [
  { id: 30, item: "Sapatilhas de Ponta #12", buyer: "Rita Gomes", date: "2026-03-10", price: 35, status: "completed" },
  { id: 31, item: "Sapatos Sapateado #38", buyer: "Marta Pinto", date: "2026-03-22", price: 60, status: "pending" },
];

const InventoryPage = () => {
  const { user } = useAuth();
  const role = user?.tipo ?? "encarregado";
  const isDirection = role === "direcao";

  const tabs: { id: InventoryTab; label: string }[] = isDirection
    ? [
        { id: "items", label: "Inventário" },
        { id: "contributions", label: "Contribuições" },
        { id: "loans", label: "Alugueres" },
        { id: "sales", label: "Vendas" },
      ]
    : [
        { id: "items", label: "Inventário" },
        { id: "loans", label: "Os meus alugueres" },
        { id: "sales", label: "As minhas compras" },
      ];

  const [tab, setTab] = useState<InventoryTab>("items");
  const [filter, setFilter] = useState<"all" | ItemType>("all");
  const [contributions, setContributions] = useState(initialContributions);
  const [loans, setLoans] = useState(initialLoans);
  const [sales, setSales] = useState(initialSales);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [actionItem, setActionItem] = useState<{ item: Item; action: "rent" | "buy" } | null>(null);

  const handleApproveContribution = (id: number) => {
    setContributions((prev) => prev.map((c) => (c.id === id ? { ...c, status: "approved" as const } : c)));
  };
  const handleLoanAction = (id: number, action: "approved" | "rejected") => {
    setLoans((prev) => prev.map((l) => (l.id === id ? { ...l, status: action } : l)));
  };
  const handleReturn = (id: number) => {
    setLoans((prev) => prev.map((l) => (l.id === id ? { ...l, status: "returned" as const } : l)));
  };
  const handleSaleAction = (id: number, action: "approved" | "rejected") => {
    setSales((prev) => prev.map((s) => (s.id === id ? { ...s, status: action } : s)));
  };

  const filteredItems = items.filter((it) => filter === "all" || it.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Marketplace Comunitário</h1>
          <p className="text-muted-foreground mt-1">Figurinos, acessórios e cenários · venda e aluguer</p>
        </div>
        <Button onClick={() => setShowContributeModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> Submeter Item
        </Button>
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

      {tab === "items" && (
        <>
          <div className="flex gap-2">
            {(["all", "rent", "sale"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  filter === f ? "bg-foreground text-background border-foreground" : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                {f === "all" ? "Todos" : f === "rent" ? "Para Aluguer" : "À Venda"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-lg shadow-card border border-border overflow-hidden group flex flex-col"
              >
                <div className={`h-40 ${item.imageColor} flex items-center justify-center relative`}>
                  <Package className="h-12 w-12 text-muted-foreground/30" />
                  <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                    <StatusBadge status={item.type === "sale" ? (item.sold ? "sold" : "for_sale") : (item.onLoan ? "on_loan" : "for_rent")} />
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex-1">{item.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">{item.category} · {item.condition}</span>
                    {item.type === "sale" ? (
                      <span className="text-sm font-semibold text-foreground">{item.salePrice?.toFixed(2)} €</span>
                    ) : (
                      <span className="text-sm font-semibold text-foreground">{item.rentFee?.toFixed(2)} €<span className="text-xs text-muted-foreground font-normal">/dia</span></span>
                    )}
                  </div>

                  {item.type === "sale" && !item.sold && (
                    <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => setActionItem({ item, action: "buy" })}>
                      <ShoppingBag className="h-3.5 w-3.5 mr-1" /> Comprar
                    </Button>
                  )}
                  {item.type === "rent" && item.available && (
                    <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => setActionItem({ item, action: "rent" })}>
                      <ArrowLeftRight className="h-3.5 w-3.5 mr-1" /> Alugar
                    </Button>
                  )}
                  {item.type === "rent" && !item.available && (
                    <p className="text-xs text-muted-foreground text-center mt-3 py-1.5">Sem disponibilidade</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {tab === "contributions" && isDirection && (
        <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-3 font-semibold text-muted-foreground">Item</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Tipo</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Categoria</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Contribuidor</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Estado</th>
                <th className="text-right p-3 font-semibold text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contributions.map((c) => (
                <tr key={c.id}>
                  <td className="p-3 font-medium text-foreground">{c.name}</td>
                  <td className="p-3"><StatusBadge status={c.type === "sale" ? "for_sale" : "for_rent"} /></td>
                  <td className="p-3 text-foreground">{c.category}</td>
                  <td className="p-3 text-foreground">{c.contributor}</td>
                  <td className="p-3"><StatusBadge status={c.status} /></td>
                  <td className="p-3 text-right">
                    {c.status === "pending" && (
                      <Button size="sm" onClick={() => handleApproveContribution(c.id)}>Aprovar</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "loans" && (
        <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-3 font-semibold text-muted-foreground">Item</th>
                {isDirection && <th className="text-left p-3 font-semibold text-muted-foreground">Requisitante</th>}
                <th className="text-left p-3 font-semibold text-muted-foreground">Início</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Fim Previsto</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Total</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Estado</th>
                <th className="text-right p-3 font-semibold text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loans.map((l) => (
                <tr key={l.id}>
                  <td className="p-3 font-medium text-foreground">{l.item}</td>
                  {isDirection && <td className="p-3 text-foreground">{l.requester}</td>}
                  <td className="p-3 text-foreground">{l.startDate || "–"}</td>
                  <td className="p-3 text-foreground">{l.endDate || "–"}</td>
                  <td className="p-3 text-foreground">{l.fee.toFixed(2)} €</td>
                  <td className="p-3"><StatusBadge status={l.status} /></td>
                  <td className="p-3 text-right">
                    {isDirection && l.status === "pending" && (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" onClick={() => handleLoanAction(l.id, "approved")}>Aprovar</Button>
                        <Button size="sm" variant="outline" onClick={() => handleLoanAction(l.id, "rejected")}>Rejeitar</Button>
                      </div>
                    )}
                    {!isDirection && l.status === "approved" && (
                      <Button size="sm" variant="outline" onClick={() => handleReturn(l.id)}>Devolver</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "sales" && (
        <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-3 font-semibold text-muted-foreground">Item</th>
                {isDirection && <th className="text-left p-3 font-semibold text-muted-foreground">Comprador</th>}
                <th className="text-left p-3 font-semibold text-muted-foreground">Data</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Preço</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Estado</th>
                {isDirection && <th className="text-right p-3 font-semibold text-muted-foreground">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.map((s) => (
                <tr key={s.id}>
                  <td className="p-3 font-medium text-foreground">{s.item}</td>
                  {isDirection && <td className="p-3 text-foreground">{s.buyer}</td>}
                  <td className="p-3 text-foreground">{s.date}</td>
                  <td className="p-3 text-foreground">{s.price.toFixed(2)} €</td>
                  <td className="p-3"><StatusBadge status={s.status === "completed" ? "completed" : s.status} /></td>
                  {isDirection && (
                    <td className="p-3 text-right">
                      {s.status === "pending" && (
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" onClick={() => handleSaleAction(s.id, "approved")}>Aprovar</Button>
                          <Button size="sm" variant="outline" onClick={() => handleSaleAction(s.id, "rejected")}>Rejeitar</Button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Contribute Modal */}
      <AnimatePresence>
        {showContributeModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 z-50 flex items-center justify-center p-4"
            onClick={() => setShowContributeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-card rounded-lg shadow-elevated border border-border w-full max-w-md p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">Submeter Item</h2>
                <button onClick={() => setShowContributeModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="px-3 py-2 rounded-md text-sm font-medium border border-primary bg-primary/5 text-primary">Para aluguer</button>
                    <button className="px-3 py-2 rounded-md text-sm font-medium border border-input bg-background text-foreground">Para venda</button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Nome do Item</label>
                  <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Ex: Tutu de Ballet Branco" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Descrição</label>
                  <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} placeholder="Descreva o item..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Categoria</label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option>Figurino</option><option>Calçado</option><option>Acessório</option><option>Cenário</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Preço (€)</label>
                    <input type="number" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="ex: 5,00" />
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={() => setShowContributeModal(false)}>Submeter para Validação</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Modal: rent vs buy */}
      <AnimatePresence>
        {actionItem && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 z-50 flex items-center justify-center p-4"
            onClick={() => setActionItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-card rounded-lg shadow-elevated border border-border w-full max-w-md p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {actionItem.action === "buy" ? "Comprar Item" : "Alugar Item"}
                </h2>
                <button onClick={() => setActionItem(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="font-medium text-foreground">{actionItem.item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {actionItem.item.category} ·{" "}
                  {actionItem.action === "buy"
                    ? `${actionItem.item.salePrice?.toFixed(2)} €`
                    : `${actionItem.item.rentFee?.toFixed(2)} €/dia`}
                </p>
              </div>

              {actionItem.action === "rent" ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-1.5">
                      <CalendarIcon className="h-3.5 w-3.5" /> Período de aluguer
                    </label>
                    <MiniCalendar booked={actionItem.item.bookedDates ?? []} />
                    <p className="text-xs text-muted-foreground mt-2">Dias a vermelho já estão reservados.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Data início</label>
                      <input type="date" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Data fim</label>
                      <input type="date" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Mensagem (opcional)</label>
                  <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} placeholder="Forma de levantamento, contacto..." />
                </div>
              )}
              <Button className="w-full" onClick={() => setActionItem(null)}>
                {actionItem.action === "buy" ? "Confirmar Compra" : "Pedir Aluguer"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Mini calendar mock for rental availability
const MiniCalendar = ({ booked }: { booked: string[] }) => {
  // Render April 2026
  const year = 2026;
  const month = 3; // April (0-indexed)
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const labels = ["S", "T", "Q", "Q", "S", "S", "D"];

  return (
    <div className="rounded-md border border-border p-3 bg-background">
      <p className="text-xs font-semibold text-foreground mb-2 text-center">Abril 2026</p>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-1">
        {labels.map((l, i) => <div key={i}>{l}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const isBooked = booked.includes(iso);
          return (
            <div
              key={i}
              className={`text-xs rounded h-7 flex items-center justify-center cursor-pointer transition-colors ${
                isBooked
                  ? "bg-destructive/15 text-destructive line-through"
                  : "bg-secondary/10 text-foreground hover:bg-secondary/30"
              }`}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryPage;
