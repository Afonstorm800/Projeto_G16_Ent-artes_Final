import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { FileSpreadsheet, Download } from "lucide-react";

interface Invoice {
  id: number;
  guardian: string;
  month: string;
  sessions: number;
  total: number;
  paid: boolean;
  excelGenerated: boolean;
}

const initialInvoices: Invoice[] = [
  { id: 1, guardian: "Carla Gomes", month: "Março 2026", sessions: 4, total: 120.0, paid: false, excelGenerated: false },
  { id: 2, guardian: "Ana Silva", month: "Março 2026", sessions: 6, total: 180.0, paid: false, excelGenerated: false },
  { id: 3, guardian: "Luís Mendes", month: "Março 2026", sessions: 3, total: 90.0, paid: true, excelGenerated: true },
  { id: 4, guardian: "Carla Gomes", month: "Fevereiro 2026", sessions: 5, total: 150.0, paid: true, excelGenerated: true },
  { id: 5, guardian: "Ana Silva", month: "Fevereiro 2026", sessions: 4, total: 120.0, paid: true, excelGenerated: true },
];

const validatedSessions = [
  { student: "Rita Gomes", modality: "Ballet Clássico", date: "2026-03-20", price: 30.0 },
  { student: "Rita Gomes", modality: "Ballet Clássico", date: "2026-03-13", price: 30.0 },
  { student: "Rita Gomes", modality: "Ballet Clássico", date: "2026-03-06", price: 30.0 },
  { student: "Rita Gomes", modality: "Ballet Clássico", date: "2026-03-01", price: 30.0 },
];

const BillingPage = () => {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [billingRun, setBillingRun] = useState(false);

  const handleGenerateExcel = (id: number) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, excelGenerated: true } : inv)));
  };

  const handleRunBilling = () => {
    setBillingRun(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Relatório Mensal</h1>
          <p className="text-muted-foreground mt-1">
            Documento de referência para a contabilidade externa · a faturação do Ent'Artes é gerida fora da plataforma
          </p>
        </div>
        <Button onClick={handleRunBilling} disabled={billingRun}>
          <Receipt className="h-4 w-4 mr-2" />
          {billingRun ? "Relatório Gerado" : "Gerar Relatório Mensal"}
        </Button>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
        <p className="font-semibold text-primary mb-1">ⓘ Nota</p>
        <p className="text-muted-foreground">
          Este relatório agrupa as sessões validadas por encarregado e é exportado em Excel para entrega à contabilidade.
          O Ent'Artes <strong className="text-foreground">não emite faturas</strong> — esse processo é feito externamente.
        </p>
      </div>

      {billingRun && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary/10 border border-secondary/30 rounded-lg p-4"
        >
          <p className="text-sm text-secondary font-semibold">✓ Relatório mensal gerado com sucesso</p>
          <p className="text-xs text-muted-foreground mt-1">4 sessões validadas agrupadas em 2 linhas. Excel disponível para download e envio à contabilidade.</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-display text-lg font-semibold text-foreground">Resumo por Encarregado</h2>
              <p className="text-xs text-muted-foreground mt-1">Sessões validadas agrupadas — exportar para entregar à contabilidade externa</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-3 font-semibold text-muted-foreground">Encarregado</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Mês</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Sessões</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Total</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Estado</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv, i) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <td className="p-3 font-medium text-foreground">{inv.guardian}</td>
                      <td className="p-3 text-foreground">{inv.month}</td>
                      <td className="p-3 text-foreground">{inv.sessions}</td>
                      <td className="p-3 font-semibold text-foreground">{inv.total.toFixed(2)} €</td>
                      <td className="p-3">
                        <StatusBadge status={inv.paid ? "completed" : "pending"} />
                      </td>
                      <td className="p-3 text-right">
                        {inv.excelGenerated ? (
                          <Button size="sm" variant="outline">
                            <Download className="h-3.5 w-3.5 mr-1" /> Excel
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleGenerateExcel(inv.id)}>
                            <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Gerar Excel
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-card border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="font-display text-lg font-semibold text-foreground">Sessões Validadas</h2>
            <p className="text-xs text-muted-foreground mt-1">Março 2026 · Carla Gomes</p>
          </div>
          <div className="divide-y divide-border">
            {validatedSessions.map((s, i) => (
              <div key={i} className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">{s.student}</p>
                <p className="text-xs text-muted-foreground">{s.modality} · {s.date}</p>
                <p className="text-sm font-semibold text-foreground mt-1">{s.price.toFixed(2)} €</p>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border bg-muted/50">
            <div className="flex justify-between text-sm font-bold text-foreground">
              <span>Total</span>
              <span>120.00 €</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function Receipt(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
      <path d="M14 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/>
    </svg>
  );
}

export default BillingPage;
