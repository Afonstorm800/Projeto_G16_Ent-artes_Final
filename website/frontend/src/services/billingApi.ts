import api from './api';

export const billingApi = {
    // DISPARA o agrupamento no backend
    processBilling: (ano: number, mes: number) => 
        api.post('/billing/processar', { ano, mes }), 

    // NOVO: Dispara faturamento individual
    processIndividualBilling: (ano: number, mes: number, encarregadoId: number) =>
        api.post('/billing/processar-individual', { ano, mes, encarregadoId }),
  
    // BUSCA a lista de faturas agrupadas
    getInvoices: (ano: number, mes: number) => 
        api.get('/billing/faturas', { params: { ano, mes } }),
  
    // BUSCA as sessões validadas (Prontas para faturar)
    getValidatedSessions: () => 
        api.get('/billing/pendentes'),

    // DOWNLOAD do Excel
    downloadExcel: (faturaId: number) => 
        api.get(`/billing/download/${faturaId}`, { responseType: 'blob' }) 
};