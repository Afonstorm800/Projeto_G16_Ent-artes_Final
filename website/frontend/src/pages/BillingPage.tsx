import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Download, Users, ListChecks } from "lucide-react";
import { toast } from "sonner"; 
import { billingApi } from "@/services/billingApi"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

interface Invoice {
    id: number;
    guardian: string;
    month: string;
    sessions: number;
    totalHoras: number;
    paid: boolean;
}

interface ValidatedSession {
    id: number;
    dataHoraInicio: string;
    professorNome: string;
    alunoNome: string;
    modalidadeNome: string;
    encarregadoId: number;
    mes: number;
    ano: number;
}

const BillingPage = () => {
    const { user } = useAuth();
    const isDirecao = user?.tipo === "direcao";

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [sessions, setSessions] = useState<ValidatedSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    const fetchData = async () => {
        setLoading(true);
        try {
            const invRes = await billingApi.getInvoices(selectedYear, selectedMonth);
            // Adapt the incoming data to use totalHoras
            const mappedInvoices = (Array.isArray(invRes.data) ? invRes.data : []).map((inv: any) => ({
                id: inv.id,
                guardian: inv.guardian,
                month: inv.month,
                sessions: inv.sessions,
                totalHoras: inv.totalHoras || inv.total || 0, // Fallback if backend still uses total
                paid: inv.paid
            }));
            setInvoices(mappedInvoices);

            if (isDirecao) {
                const sessRes = await billingApi.getValidatedSessions();
                setSessions(Array.isArray(sessRes.data) ? sessRes.data : []);
            }
        } catch (error: any) {
            console.error("Erro ao carregar dados:", error);
            toast.error("Erro ao carregar dados de faturação");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear, isDirecao]);

    const handleRunIndividualBilling = async (encarregadoId: number, mes: number, ano: number) => {
        setProcessing(true);
        try {
            await billingApi.processIndividualBilling(ano, mes, encarregadoId);
            toast.success(`Relatório individual gerado com sucesso!`);
            fetchData();
        } catch (error: any) {
            toast.error("Erro ao gerar relatório.");
        } finally {
            setProcessing(false);
        }
    };

    const handleDownloadExcel = async (faturaId: number) => {
        try {
            const response = await billingApi.downloadExcel(faturaId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Relatorio_Fatura_${faturaId}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Excel descarregado!");
        } catch (error: any) {
            toast.error("Erro ao descarregar o ficheiro.");
        }
    };

    const groupedSessions = sessions.reduce((acc: any, s: ValidatedSession) => {
        const key = `${s.encarregadoId}-${s.mes}-${s.ano}`;
        if (!acc[key]) acc[key] = { 
            name: s.alunoNome, 
            encarregadoId: s.encarregadoId, 
            mes: s.mes, 
            ano: s.ano,
            sessions: [] 
        };
        acc[key].sessions.push(s);
        return acc;
    }, {});

    const groupedList = Object.values(groupedSessions);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">
                        {isDirecao ? "Gestão de Relatórios" : "Os Meus Relatórios"}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isDirecao 
                            ? "Controlo de sessões validadas e preparação de relatórios de horas."
                            : "Consulte os seus relatórios mensais de horas e participação."}
                    </p>
                </div>
            </div>

            <Tabs defaultValue="guardians" className="w-full">
                {isDirecao && (
                    <TabsList className="grid w-full max-md grid-cols-2 mb-4">
                        <TabsTrigger value="guardians" className="gap-2">
                            <Users className="h-4 w-4" /> Relatórios Gerados
                        </TabsTrigger>
                        <TabsTrigger value="sessions" className="gap-2">
                            <ListChecks className="h-4 w-4" /> Pendentes de Relatório
                        </TabsTrigger>
                    </TabsList>
                )}

                <TabsContent value="guardians">
                    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="font-semibold">
                                    {isDirecao ? "Resumo de Relatórios Gerados" : "O Meu Histórico"}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    {isDirecao ? "Faturas de horas prontas para consulta" : "Download do resumo detalhado das suas horas"}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <select 
                                    className="bg-background border border-input rounded px-2 py-1 text-xs"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(0, i).toLocaleString('pt', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                                <select 
                                    className="bg-background border border-input rounded px-2 py-1 text-xs"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                >
                                    {[2025, 2026, 2027].map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-3">Encarregado</th>
                                        <th className="text-left p-3">Mês/Ano</th>
                                        <th className="text-center p-3">Nº Sessões</th>
                                        <th className="text-left p-3">Horas Totais</th>
                                        <th className="text-left p-3">Estado</th>
                                        <th className="text-right p-3">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-muted-foreground italic">A carregar relatórios...</td></tr>
                                    ) : invoices.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum relatório gerado ainda.</td></tr>
                                    ) : (
                                        invoices.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="p-3 font-medium">{inv.guardian}</td>
                                                <td className="p-3 text-muted-foreground">{inv.month}</td>
                                                <td className="p-3 text-center">{inv.sessions}</td>
                                                <td className="p-3 font-semibold">{inv.totalHoras.toFixed(1)} h</td>
                                                <td className="p-3"><StatusBadge status={inv.paid ? "completed" : "pending"} /></td>
                                                <td className="p-3 text-right">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="h-8"
                                                        onClick={() => handleDownloadExcel(inv.id)}
                                                    >
                                                        <Download className="h-3 w-3 mr-1" /> Excel
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                {isDirecao && (
                    <TabsContent value="sessions">
                        <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-border bg-muted/30">
                                <h2 className="font-semibold">Sessões Validadas por Encarregado</h2>
                                <p className="text-xs text-muted-foreground">Gere o relatório individual de horas para cada encarregado aqui.</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="text-left p-3">Aluno / Encarregado</th>
                                            <th className="text-center p-3">Referência</th>
                                            <th className="text-center p-3">Nº Sessões</th>
                                            <th className="text-right p-3">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr><td colSpan={4} className="p-8 text-center text-muted-foreground italic">A carregar sessões...</td></tr>
                                        ) : groupedList.length === 0 ? (
                                            <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Não existem sessões validadas pendentes.</td></tr>
                                        ) : (
                                            groupedList.map((group: any) => (
                                                <tr key={`${group.encarregadoId}-${group.mes}-${group.ano}`} className="hover:bg-muted/20 transition-colors">
                                                    <td className="p-3 font-medium">{group.name}</td>
                                                    <td className="p-3 text-center">{group.mes}/{group.ano}</td>
                                                    <td className="p-3 text-center">{group.sessions.length}</td>
                                                    <td className="p-3 text-right">
                                                        <Button 
                                                            size="sm" 
                                                            onClick={() => handleRunIndividualBilling(group.encarregadoId, group.mes, group.ano)}
                                                            disabled={processing}
                                                        >
                                                            {processing ? "A processar..." : "Gerar Relatório"}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>
                )}
            </Tabs>

            {isDirecao && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-xs text-muted-foreground italic">
                    Nota: As sessões só aparecem na lista de "Pendentes" após a aprovação final da Direção na página de Validações.
                    Ao gerar o relatório, o sistema agrupa estas sessões e calcula o total de horas participadas.
                </div>
            )}
        </div>
    );
};

export default BillingPage;
