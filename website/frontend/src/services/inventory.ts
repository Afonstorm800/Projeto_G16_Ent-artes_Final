import api from './api'

export interface CatalogoItem {
    id: number
    nome: string
    categoria: string
    genero: number // 0=Masculino, 1=Feminino, 2=Unissexo
}

export interface Item {
    id: number
    nome: string
    descricao: string
    categoria: string
    genero: number
    tamanho: string
    estadoConservacao: string
    fotoUrl: string
    disponivel: boolean
    taxaSimbolica: number
    precoVenda?: number
    tipo: number // 0=Aluguer, 1=Venda
    estado: number // 0=Pendente, 1=Aprovado, 2=Rejeitado
    quantidade: number
    contribuidorId: number
    dataSubmissao: string
    contribuidor?: { nome: string }
    venda?: any
    emprestimos?: Loan[]
}

export interface Loan {
    id: number
    dataInicio: string
    dataFimPrevisto: string
    dataDevolucao: string | null
    dataPedido: string
    estado: number // 0=Pendente, 1=Aprovado, 2=Devolvido, 3=Rejeitado
    taxaAplicada: number
    itemId: number
    utilizadorId: number
    item?: Item
    utilizador?: { nome: string }
}

export const inventoryApi = {
    // Items
    submitItem: (data: any) => api.post('/inventory/items', data),
    getAvailableItems: () => api.get<Item[]>('/inventory/items/available'),
    getPendingItems: () => api.get<Item[]>('/inventory/items/pending'),
    getCatalog: () => api.get<CatalogoItem[]>('/inventory/catalog'),
    approveItem: (id: number, taxa?: number, precoVenda?: number) => {
        let url = `/inventory/items/${id}/approve?`;
        if (taxa !== undefined) url += `taxa=${taxa}`;
        if (precoVenda !== undefined) url += `${taxa !== undefined ? '&' : ''}precoVenda=${precoVenda}`;
        return api.post(url);
    },
    rejectItem: (id: number) => api.post(`/inventory/items/${id}/reject`),

    // Sales
    buyItem: (id: number) => api.post(`/inventory/items/${id}/buy`),
    getAllSales: () => api.get<any[]>('/inventory/sales'),
    getMySales: () => api.get<any[]>('/inventory/sales/my'),

    // Personal Inventory
    getMyInventory: () => api.get<Item[]>('/inventory/items/my'),
    updateItem: (id: number, data: any) => api.put(`/inventory/items/${id}`, data),
    deleteItem: (id: number) => api.delete(`/inventory/items/${id}`),
    submitToMarketplace: (id: number) => api.post(`/inventory/items/${id}/submit-marketplace`),

    // Files
    uploadImage: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<{ url: string }>('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Loans
    requestLoan: (data: { itemId: number, dataFimPrevisto: string }) => api.post('/loans/requests', data),
    getPendingLoans: () => api.get<Loan[]>('/loans/requests/pending'),
    approveLoan: (id: number, taxa: number) => api.post(`/loans/requests/${id}/approve`, { taxaAplicada: taxa }),
    rejectLoan: (id: number) => api.post(`/loans/requests/${id}/reject`),
    returnLoan: (id: number) => api.post(`/loans/${id}/return`),
    getMyLoans: () => api.get<Loan[]>('/loans/my'),
    getAllLoans: () => api.get<Loan[]>('/loans'),
}
