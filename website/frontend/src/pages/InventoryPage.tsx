import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, X, Package, ArrowLeftRight, ShoppingBag, Calendar as CalendarIcon, Info, Edit, Trash2, Globe } from "lucide-react";
import { inventoryApi, type Item as BackendItem, type Loan as BackendLoan } from "@/services/inventory";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type InventoryTab = "items" | "loans" | "sales" | "my-inventory";
type ItemType = "rent" | "sale";

interface Item {
  id: number;
  name: string;
  description: string;
  category: string;
  gender: number;
  size: string;
  condition: string;
  type: ItemType;
  available: boolean;
  onLoan: boolean;
  quantity: number;
  rentFee?: number;
  salePrice?: number;
  sold?: boolean;
  contributor: string;
  imageColor: string;
  backendItem?: BackendItem;
}

const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
        "Figurino": "bg-pink-100",
        "Calçado": "bg-amber-100",
        "Acessório": "bg-blue-100",
        "Cenário": "bg-green-100",
        "Vestuário": "bg-purple-100",
        "Acessórios": "bg-blue-100"
    };
    return colors[category] || "bg-slate-100";
};

const genderLabels: Record<number, string> = {
    0: "Masculino",
    1: "Feminino",
    2: "Unissexo"
};

interface InventoryPageProps {
  mode?: "marketplace" | "personal";
}

const InventoryPage = ({ mode = "marketplace" }: InventoryPageProps) => {
  const { user } = useAuth();
  const role = user?.tipo ?? "encarregado";
  const isDirection = role === "direcao";

  const tabs: { id: InventoryTab; label: string }[] = useMemo(() => {
    if (mode === "personal") return [{ id: "my-inventory", label: "O Meu Inventário" }];
    
    return isDirection
      ? [
          { id: "items", label: "Marketplace" },
          { id: "loans", label: "Alugueres Ativos" },
          { id: "sales", label: "Vendas" },
        ]
      : [
          { id: "items", label: "Marketplace" },
        ];
  }, [mode, isDirection]);

  const [tab, setTab] = useState<InventoryTab>(mode === "personal" ? "my-inventory" : "items");

  // Sync tab with mode if mode changes
  useEffect(() => {
    setTab(mode === "personal" ? "my-inventory" : "items");
  }, [mode]);
  const [filter, setFilter] = useState<"all" | ItemType>("all");
  const [myStatusFilter, setMyStatusFilter] = useState<"all" | "loaned" | "rent" | "sale" | "private">("all");
  const [loading, setLoading] = useState(false);
  
  const [items, setItems] = useState<Item[]>([]);
  const [personalItems, setPersonalItems] = useState<BackendItem[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loans, setLoans] = useState<BackendLoan[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BackendItem | null>(null);
  const [actionItem, setActionItem] = useState<{ item: Item; action: "rent" | "buy" } | null>(null);

  // Dialog States
  const [isApproveLoanModalOpen, setIsApproveLoanModalOpen] = useState(false);
  const [loanToApproveId, setLoanToApproveId] = useState<number | null>(null);
  const [approveTax, setApproveTax] = useState("");

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [loanToReturnId, setLoanToReturnId] = useState<number | null>(null);

  const [isConfirmBuyModalOpen, setIsConfirmBuyModalOpen] = useState(false);
  const [itemToBuyId, setItemToBuyId] = useState<number | null>(null);

  // Form states
  const [newItem, setNewItem] = useState({
      nome: "",
      descricao: "",
      categoria: "Figurino",
      genero: 2,
      tamanho: "",
      estadoConservacao: "Bom",
      fotoUrl: "",
      taxaSimbolica: 0,
      precoVenda: 0,
      tipo: 0 // 0=Aluguer, 1=Venda
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCustomItem, setIsCustomItem] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState<number | "all">("all");
  const [loanDate, setLoanDate] = useState("");

  // Filter personal items based on the new status filter
  const filteredPersonalItems = useMemo(() => {
    return personalItems.filter(item => {
      if (myStatusFilter === "all") return true;
      const activeLoan = item.emprestimos?.find(l => l.estado === 1);
      const isSold = !!item.venda;
      
      if (myStatusFilter === "loaned") return !!activeLoan;
      if (myStatusFilter === "rent") return item.tipo === 0 && item.estado === 2 && !activeLoan;
      if (myStatusFilter === "sale") return item.tipo === 1 && item.estado === 2 && !isSold;
      if (myStatusFilter === "private") return item.estado === 0;
      return true;
    });
  }, [personalItems, myStatusFilter]);

  const fetchData = async () => {
      setLoading(true);
      try {
          if (tab === "items") {
              const [itemsRes, catalogRes] = await Promise.all([
                  inventoryApi.getAvailableItems(),
                  inventoryApi.getCatalog()
              ]);
              setItems(itemsRes.data.map((i: any) => ({
                  id: i.id,
                  name: i.nome,
                  description: i.descricao,
                  category: i.categoria,
                  gender: i.genero,
                  size: i.tamanho,
                  condition: i.estadoConservacao,
                  type: i.tipo === 0 ? "rent" : "sale",
                  available: i.disponivel,
                  onLoan: !i.disponivel && i.tipo === 0,
                  sold: !i.disponivel && i.tipo === 1,
                  quantity: i.quantidade,
                  rentFee: i.taxaSimbolica,
                  salePrice: i.precoVenda,
                  fotoUrl: i.fotoUrl,
                  contributor: i.contribuidor?.nome || "Comunidade",
                  imageColor: getCategoryColor(i.categoria),
                  backendItem: i
              })));
              setCatalog(catalogRes.data);
          } else if (tab === "my-inventory") {
              const res = await inventoryApi.getMyInventory();
              setPersonalItems(res.data);
          } else if (tab === "loans") {
              const res = isDirection ? await inventoryApi.getAllLoans() : await inventoryApi.getMyLoans();
              setLoans(res.data);
          } else if (tab === "sales") {
              const res = isDirection ? await inventoryApi.getAllSales() : await inventoryApi.getMySales();
              setSales(res.data);
          }
      } catch (error) {
          toast.error("Erro ao carregar dados");
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
  }, [tab, role]);

  const openApproveLoanModal = (id: number) => {
    setLoanToApproveId(id);
    setApproveTax("5.00");
    setIsApproveLoanModalOpen(true);
  };

  const handleConfirmLoanApproval = async () => {
    if (!loanToApproveId) return;
    try {
        await inventoryApi.approveLoan(loanToApproveId, parseFloat(approveTax));
        toast.success("Aluguer aprovado");
        setIsApproveLoanModalOpen(false);
        fetchData();
    } catch (error) {
        toast.error("Erro ao processar");
    }
  };

  const handleReturn = async () => {
    if (!loanToReturnId) return;
    try {
        await inventoryApi.returnLoan(loanToReturnId);
        toast.success("Item devolvido");
        setIsReturnModalOpen(false);
        fetchData();
    } catch (error) {
        toast.error("Erro ao devolver");
    }
  };

  const handleSubmitItem = async () => {
      try {
          let currentItem = { ...newItem };

          if (selectedFile) {
              const uploadRes = await inventoryApi.uploadImage(selectedFile);
              currentItem.fotoUrl = uploadRes.data.url;
          }

          if (editingItem) {
              await inventoryApi.updateItem(editingItem.id, currentItem);
              toast.success("Item atualizado");
          } else {
              await inventoryApi.submitItem(currentItem);
              toast.success("Item adicionado ao seu inventário");
          }
          setShowContributeModal(false);
          setEditingItem(null);
          setSelectedFile(null);
          setNewItem({ 
            nome: "", 
            descricao: "", 
            categoria: "Figurino", 
            genero: 2,
            tamanho: "",
            estadoConservacao: "Bom", 
            fotoUrl: "",
            taxaSimbolica: 0, 
            precoVenda: 0, 
            tipo: 0 
          });
          setIsCustomItem(false);
          fetchData();
      } catch (error: any) {
          toast.error(error.response?.data?.message || "Erro ao processar item");
      }
  };
const handleEditItem = (item: BackendItem) => {
    setEditingItem(item);
    setSelectedFile(null);
    setNewItem({
        nome: item.nome,
        descricao: item.descricao,
        categoria: item.categoria,
        genero: item.genero,
        tamanho: item.tamanho,
        estadoConservacao: item.estadoConservacao,
        fotoUrl: item.fotoUrl || "",
        taxaSimbolica: item.taxaSimbolica,
        precoVenda: item.precoVenda,
        tipo: item.tipo
    });
    setShowContributeModal(true);
  };

  const handleDeleteItem = async (id: number) => {
      if (!confirm("Tem a certeza que deseja remover este item do seu inventário?")) return;
      try {
          await inventoryApi.deleteItem(id);
          toast.success("Item removido");
          fetchData();
      } catch (error: any) {
          toast.error(error.response?.data?.message || "Erro ao remover item");
      }
  };

  const handleSubmitToMarketplace = async (id: number) => {
      try {
          await inventoryApi.submitToMarketplace(id);
          toast.success("Item publicado no marketplace com sucesso");
          fetchData();
      } catch (error) {
          toast.error("Erro ao publicar no marketplace");
      }
  };

  const handleRequestLoan = async () => {
      if (!actionItem || !loanDate) return;
      try {
          await inventoryApi.requestLoan({ itemId: actionItem.item.id, dataFimPrevisto: loanDate });
          toast.success("Pedido de aluguer enviado");
          setActionItem(null);
          setLoanDate("");
          fetchData();
      } catch (error) {
          toast.error("Erro ao pedir aluguer");
      }
  };

  const handleBuyItem = async () => {
      if (!itemToBuyId) return;
      try {
          await inventoryApi.buyItem(itemToBuyId);
          toast.success("Compra realizada com sucesso!");
          setIsConfirmBuyModalOpen(false);
          setActionItem(null);
          fetchData();
      } catch (error) {
          toast.error("Erro ao realizar compra");
      }
  };

  const filteredItems = items.filter((it) => filter === "all" || it.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {mode === "personal" ? "O Meu Inventário" : "Marketplace Comunitário"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {mode === "personal" 
              ? "Gira os teus figurinos, acessórios e itens pessoais" 
              : "Figurinos, acessórios e cenários · venda e aluguer"}
          </p>
        </div>
        <Button onClick={() => { setEditingItem(null); setSelectedFile(null); setShowContributeModal(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar ao Inventário
        </Button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
          <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
              <p className="font-semibold">Aviso de Responsabilidade</p>
              <p className="opacity-90">A escola de dança Ent'Artes não se responsabiliza por quaisquer submissões, transações ou trocas efetuadas através deste marketplace. Todas as interações são da inteira responsabilidade dos utilizadores envolvidos.</p>
          </div>
      </div>

      {tabs.length > 1 && (
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
      )}

      {loading ? (
          <div className="text-center py-12 text-muted-foreground">A carregar...</div>
      ) : (
          <div className="mt-6">
            {tab === "items" && (
                <div className="space-y-4">
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
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          className="bg-card rounded-lg shadow-card border border-border overflow-hidden group flex flex-col"
                      >
                          <div className={`h-40 ${item.imageColor} flex items-center justify-center relative`}>
                            {item.fotoUrl ? (
                                <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${item.fotoUrl}`} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                                <Package className="h-12 w-12 text-muted-foreground/30" />
                            )}
                            <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                                <StatusBadge status={item.type === "sale" ? (item.sold ? "sold" : "for_sale") : (item.onLoan ? "on_loan" : "for_rent")} />
                            </div>
                          </div>
                          <div className="p-4 flex flex-col flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-foreground">{item.name}</h3>
                                {item.quantity > 1 && (
                                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                        Qtd: {item.quantity}
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-muted-foreground italic mb-2">Propriedade de: {item.contributor}</p>
                            <p className="text-xs text-muted-foreground mt-1 flex-1">{item.description}</p>
                            <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-muted-foreground">{item.category} · {genderLabels[item.gender]} · Tam: {item.size || "N/A"}</span>
                                {item.type === "sale" ? (
                                <span className="text-sm font-semibold text-foreground">{item.salePrice?.toFixed(2)} €</span>
                                ) : (
                                <span className="text-sm font-semibold text-foreground">{item.rentFee?.toFixed(2)} €<span className="text-xs text-muted-foreground font-normal">/dia</span></span>
                                )}
                            </div>
                            <div className="mt-1 text-[10px] text-muted-foreground italic">Condição: {item.condition}</div>

                            {item.type === "sale" && item.available && (
                                <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => {setItemToBuyId(item.id); setIsConfirmBuyModalOpen(true);}}>
                                <ShoppingBag className="h-3.5 w-3.5 mr-1" /> Comprar
                                </Button>
                            )}
                            {item.type === "rent" && item.available && (
                                <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => setActionItem({ item, action: "rent" })}>
                                <ArrowLeftRight className="h-3.5 w-3.5 mr-1" /> Alugar
                                </Button>
                            )}
                            {!item.available && (
                                <p className="text-xs text-muted-foreground text-center mt-3 py-1.5">Sem disponibilidade</p>
                            )}
                          </div>
                      </motion.div>
                      ))}
                  </div>
                </div>
            )}

            {tab === "my-inventory" && (
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMyStatusFilter("all")}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            myStatusFilter === "all" ? "bg-foreground text-background border-foreground" : "bg-background text-foreground border-border hover:bg-muted"
                            }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setMyStatusFilter("loaned")}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            myStatusFilter === "loaned" ? "bg-accent text-white border-accent" : "bg-background text-foreground border-border hover:bg-muted"
                            }`}
                        >
                            Emprestado
                        </button>
                        <button
                            onClick={() => setMyStatusFilter("rent")}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            myStatusFilter === "rent" ? "bg-secondary text-white border-secondary" : "bg-background text-foreground border-border hover:bg-muted"
                            }`}
                        >
                            Para Aluguer
                        </button>
                        <button
                            onClick={() => setMyStatusFilter("sale")}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            myStatusFilter === "sale" ? "bg-primary text-white border-primary" : "bg-background text-foreground border-border hover:bg-muted"
                            }`}
                        >
                            À Venda
                        </button>
                        <button
                            onClick={() => setMyStatusFilter("private")}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            myStatusFilter === "private" ? "bg-slate-500 text-white border-slate-500" : "bg-background text-foreground border-border hover:bg-muted"
                            }`}
                        >
                            Privado
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPersonalItems.length === 0 && (
                            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                                Nenhum item encontrado com este filtro.
                            </div>
                        )}
                        {filteredPersonalItems.map((item, i) => {
                            const activeLoan = item.emprestimos?.find(l => l.estado === 1); 
                            const isSold = !!item.venda;

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    className="bg-card rounded-lg shadow-card border border-border overflow-hidden flex flex-col"
                                >
                                    <div className={`h-32 ${getCategoryColor(item.categoria)} flex items-center justify-center relative`}>
                                        {item.fotoUrl ? (
                                            <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${item.fotoUrl}`} alt={item.nome} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="h-10 w-10 text-muted-foreground/30" />
                                        )}
                                        <div className="absolute top-2 right-2">
                                            <StatusBadge status={
                                                item.estado === 0 ? "private" : 
                                                item.estado === 1 ? "pending" : 
                                                item.estado === 3 ? "rejected" :
                                                activeLoan ? "on_loan" : 
                                                item.venda ? "sold" : "for_rent"
                                            } />
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1 space-y-2">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold text-foreground">{item.nome}</h3>
                                                <span className="text-[10px] font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded">
                                                    {item.tipo === 0 ? `${item.taxaSimbolica.toFixed(2)}€/dia` : `${(item.precoVenda || 0).toFixed(2)}€`}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">{item.categoria} · {genderLabels[item.genero]} · Tam: {item.tamanho || "N/A"}</p>
                                        </div>

                                        <p className="text-[11px] text-muted-foreground line-clamp-2 italic">"{item.descricao || "Sem descrição"}"</p>
                                        <p className="text-[10px] text-muted-foreground font-medium">Condição: {item.estadoConservacao}</p>

                                        {activeLoan && (
                                            <div className="bg-primary/5 border border-primary/20 rounded p-2 text-[10px]">
                                                <p className="font-bold text-primary flex items-center gap-1 uppercase">
                                                    <ArrowLeftRight className="h-3 w-3" /> Emprestado a {activeLoan.utilizador?.nome}
                                                </p>
                                                <p className="mt-1">
                                                    Devolução prevista: {new Date(activeLoan.dataFimPrevisto).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {isSold && (
                                             <div className="bg-green-50 border border-green-200 rounded p-2 text-[10px]">
                                                <p className="font-bold text-green-700 flex items-center gap-1 uppercase">
                                                    <ShoppingBag className="h-3 w-3" /> Vendido a {item.venda?.comprador?.nome || "alguém"}
                                                </p>
                                                <p className="mt-1">Data: {new Date(item.venda!.dataVenda).toLocaleDateString()}</p>
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-2 mt-auto">
                                            {(item.estado === 0 || item.estado === 3) && (
                                                <Button size="sm" variant="default" className="flex-1 text-[10px]" onClick={() => handleSubmitToMarketplace(item.id)}>
                                                    <Globe className="h-3 w-3 mr-1" /> Publicar
                                                </Button>
                                            )}
                                            <Button size="sm" variant="outline" className="flex-1 text-[10px]" disabled={!!activeLoan || isSold} onClick={() => handleEditItem(item)}>
                                                <Edit className="h-3 w-3 mr-1" /> Editar
                                            </Button>
                                            <Button size="sm" variant="outline" className="flex-1 text-[10px] text-destructive hover:bg-destructive/10" disabled={!!activeLoan || isSold} onClick={() => handleDeleteItem(item.id)}>
                                                <Trash2 className="h-3 w-3 mr-1" /> Remover
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {isDirection && tab === "loans" && (
                <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="bg-muted">
                            <th className="text-left p-3 font-semibold text-muted-foreground">Item</th>
                            <th className="text-left p-3 font-semibold text-muted-foreground">Dono (Sócio)</th>
                            <th className="text-left p-3 font-semibold text-muted-foreground">Requisitante</th>
                            <th className="text-left p-3 font-semibold text-muted-foreground">Início</th>
                            <th className="text-left p-3 font-semibold text-muted-foreground">Fim Previsto</th>
                            <th className="text-left p-3 font-semibold text-muted-foreground">Estado</th>
                            <th className="text-right p-3 font-semibold text-muted-foreground">Ações</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                        {loans.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Sem alugueres registados.</td></tr>}
                        {loans.map((l) => (
                            <tr key={l.id}>
                                <td className="p-3 font-medium text-foreground">{l.item?.nome}</td>
                                <td className="p-3 text-foreground">{l.item?.contribuidor?.nome || "N/A"}</td>
                                <td className="p-3 text-foreground">{l.utilizador?.nome}</td>
                                <td className="p-3 text-foreground">{l.dataInicio && l.dataInicio !== "0001-01-01T00:00:00" ? new Date(l.dataInicio).toLocaleDateString() : "–"}</td>
                                <td className="p-3 text-foreground">{l.dataFimPrevisto ? new Date(l.dataFimPrevisto).toLocaleDateString() : "–"}</td>
                                <td className="p-3"><StatusBadge status={Number(l.estado) === 2 || Number(l.estado) === 3 ? "returned" : (Number(l.estado) === 1 ? "approved" : (Number(l.estado) === 4 ? "rejected" : "pending"))} /></td>
                                <td className="p-3 text-right">
                                    {l.estado === 0 && (
                                    <div className="flex gap-2 justify-end">
                                        <Button size="sm" onClick={() => openApproveLoanModal(l.id)}>Aprovar</Button>
                                        <Button size="sm" variant="outline" onClick={() => inventoryApi.rejectLoan(l.id).then(() => fetchData())}>Rejeitar</Button>
                                    </div>
                                    )}
                                    {l.estado === 1 && (
                                    <Button size="sm" variant="outline" onClick={() => {setLoanToReturnId(l.id); setIsReturnModalOpen(true);}}>Devolver</Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isDirection && tab === "sales" && (
                <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted">
                                <th className="text-left p-3 font-semibold text-muted-foreground">Item</th>
                                <th className="text-left p-3 font-semibold text-muted-foreground">Vendedor (Dono)</th>
                                <th className="text-left p-3 font-semibold text-muted-foreground">Comprador</th>
                                <th className="text-left p-3 font-semibold text-muted-foreground">Data</th>
                                <th className="text-left p-3 font-semibold text-muted-foreground">Preço</th>
                                <th className="text-left p-3 font-semibold text-muted-foreground">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sales.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhuma venda registada.</td></tr>}
                            {sales.map((s) => (
                                <tr key={s.id}>
                                    <td className="p-3 font-medium text-foreground">{s.item?.nome}</td>
                                    <td className="p-3 text-foreground">{s.item?.contribuidor?.nome || "N/A"}</td>
                                    <td className="p-3 text-foreground">{s.comprador?.nome}</td>
                                    <td className="p-3 text-foreground">{new Date(s.dataVenda).toLocaleDateString()}</td>
                                    <td className="p-3 text-foreground">{s.precoFinal.toFixed(2)} €</td>
                                    <td className="p-3"><StatusBadge status="completed" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
          </div>
      )}

      {/* Approve Loan Modal */}
      <Dialog open={isApproveLoanModalOpen} onOpenChange={setIsApproveLoanModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Aprovar Aluguer</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <label className="text-sm font-medium">Confirmar Taxa (€/dia):</label>
                <Input 
                    type="number" 
                    value={approveTax} 
                    onChange={(e) => setApproveTax(e.target.value)} 
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsApproveLoanModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleConfirmLoanApproval}>Confirmar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Modal */}
      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Confirmar Devolução</DialogTitle>
                <DialogDescription>Confirmar a receção física do item na escola?</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsReturnModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleReturn}>Confirmar Devolução</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Buy Modal */}
      <Dialog open={isConfirmBuyModalOpen} onOpenChange={setIsConfirmBuyModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Confirmar Compra</DialogTitle>
                <DialogDescription>Deseja proceder com a compra deste item? O valor será adicionado ao seu próximo relatório mensal.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsConfirmBuyModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleBuyItem}>Confirmar Compra</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publicar Item Modal */}
      <AnimatePresence>
        {showContributeModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 z-50 flex items-center justify-center p-4"
            onClick={() => { setShowContributeModal(false); setEditingItem(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-card rounded-lg shadow-elevated border border-border w-full max-w-md p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">
                    {editingItem ? "Editar Item" : "Publicar Item"}
                </h2>
                <button onClick={() => { setShowContributeModal(false); setEditingItem(null); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => setNewItem({...newItem, tipo: 0})}
                        className={`px-3 py-2 rounded-md text-sm font-medium border ${newItem.tipo === 0 ? "border-primary bg-primary/5 text-primary" : "border-input bg-background text-foreground"}`}
                    >Para aluguer</button>
                    <button 
                        onClick={() => setNewItem({...newItem, tipo: 1})}
                        className={`px-3 py-2 rounded-md text-sm font-medium border ${newItem.tipo === 1 ? "border-primary bg-primary/5 text-primary" : "border-input bg-background text-foreground"}`}
                    >Para venda</button>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-foreground block">Item</label>
                    <button 
                        onClick={() => setIsCustomItem(!isCustomItem)}
                        className="text-xs text-primary hover:underline"
                    >
                        {isCustomItem ? "Escolher da lista" : "Adicionar outro nome"}
                    </button>
                  </div>
                  
                  {!isCustomItem ? (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            {(["all", 0, 1, 2] as const).map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setCatalogFilter(g)}
                                    className={`px-2 py-1 rounded text-[10px] border transition-colors ${
                                        catalogFilter === g ? "bg-primary text-white" : "bg-background text-muted-foreground"
                                    }`}
                                >
                                    {g === "all" ? "Todos" : genderLabels[g]}
                                </button>
                            ))}
                        </div>
                        <select 
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={newItem.nome}
                            onChange={e => {
                                const selected = catalog.find(c => c.nome === e.target.value);
                                if (selected) {
                                    setNewItem({
                                        ...newItem, 
                                        nome: selected.nome, 
                                        categoria: selected.categoria,
                                        genero: selected.genero
                                    });
                                } else {
                                    setNewItem({...newItem, nome: e.target.value});
                                }
                            }}
                        >
                            <option value="">Selecione um item...</option>
                            {catalog
                                .filter(c => catalogFilter === "all" || c.genero === catalogFilter)
                                .map(c => (
                                    <option key={c.id} value={c.nome}>
                                        {c.nome} ({c.categoria} - {genderLabels[c.genero]})
                                    </option>
                                ))
                            }
                        </select>
                    </div>
                  ) : (
                    <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newItem.nome} onChange={e => setNewItem({...newItem, nome: e.target.value})} placeholder="Ex: Tutu de Ballet Branco" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Género</label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newItem.genero} onChange={e => setNewItem({...newItem, genero: parseInt(e.target.value)})}>
                      <option value={0}>Masculino</option>
                      <option value={1}>Feminino</option>
                      <option value={2}>Unissexo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Tamanho</label>
                    <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newItem.tamanho} onChange={e => setNewItem({...newItem, tamanho: e.target.value})} placeholder="Ex: M, 38, L" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Descrição</label>
                  <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={newItem.descricao} onChange={e => setNewItem({...newItem, descricao: e.target.value})} placeholder="Descreva o item..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Categoria</label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newItem.categoria} onChange={e => setNewItem({...newItem, categoria: e.target.value})}>
                      <option>Figurino</option><option>Calçado</option><option>Acessório</option><option>Cenário</option><option>Vestuário</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Conservação</label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newItem.estadoConservacao} onChange={e => setNewItem({...newItem, estadoConservacao: e.target.value})}>
                        <option>Excelente</option><option>Bom</option><option>Usado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Imagem do Item</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                    {newItem.fotoUrl && !selectedFile && (
                        <span className="text-[10px] text-muted-foreground italic">Imagem atual mantida</span>
                    )}
                  </div>
                </div>

                {newItem.tipo === 0 ? (
                    <div>
                        <label className="text-sm font-medium text-foreground block mb-1">Taxa Diária Sugerida (€)</label>
                        <input type="number" step="0.01" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newItem.taxaSimbolica} onChange={e => setNewItem({...newItem, taxaSimbolica: parseFloat(e.target.value)})} />
                    </div>
                ) : (
                    <div>
                        <label className="text-sm font-medium text-foreground block mb-1">Preço de Venda (€)</label>
                        <input type="number" step="0.01" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newItem.precoVenda} onChange={e => setNewItem({...newItem, precoVenda: parseFloat(e.target.value)})} />
                    </div>
                )}
              </div>
              <Button className="w-full" onClick={handleSubmitItem}>
                  {editingItem ? "Guardar Alterações" : "Adicionar ao Inventário"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Modal: rent */}
      <AnimatePresence>
        {actionItem && actionItem.action === "rent" && (
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
                <h2 className="font-display text-xl font-semibold text-foreground">Alugar Item</h2>
                <button onClick={() => setActionItem(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="font-medium text-foreground">{actionItem.item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {actionItem.item.category} · {actionItem.item.rentFee?.toFixed(2)} €/dia
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" /> Data prevista de devolução
                </label>
                <MiniCalendar booked={[]} />
              </div>
              <div className="mt-4">
                <input type="date" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={loanDate} onChange={e => setLoanDate(e.target.value)} />
              </div>
              
              <Button className="w-full" onClick={handleRequestLoan}>Pedir Aluguer</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Mini calendar mock
const MiniCalendar = ({ booked }: { booked: string[] }) => {
  const labels = ["S", "T", "Q", "Q", "S", "S", "D"];
  const cells = Array.from({length: 31}, (_, i) => i + 1);

  return (
    <div className="rounded-md border border-border p-3 bg-background">
      <p className="text-xs font-semibold text-foreground mb-2 text-center">Maio 2026</p>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-1">
        {labels.map((l, i) => <div key={i}>{l}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d) => (
            <div key={d} className="text-xs rounded h-7 flex items-center justify-center bg-secondary/10 text-foreground">
              {d}
            </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryPage;
