import api from './api'

export interface AvailableSlot {
    startTime: string
    endTime: string
    estudioId: number
    estudioNome: string
    professorId: number
    professorNome: string
}

export interface BookingRequest {
    dataHoraInicio: string
    dataHoraFim: string
    formato: number
    objetivo: string
    modalidadeId: number
    professorId: number
    estudioId: number
    alunosIds: number[]
    
    // New fields
    recurrenceType: number
    recurrenceCount: number
    recurrenceDays?: number[]
    recurrenceMonth?: number
}

export const sessionsApi = {
    getAvailableSlots: (date: string, modalidadeId: number, formato: number, professorId?: number) =>
        api.get<AvailableSlot[]>('/sessions/available', { params: { date, modalidadeId, formato, professorId } }),
    createBooking: (data: BookingRequest) => api.post('/sessions/requests', data),
    confirmByEnc: (sessionId: number) => api.post(`/sessions/${sessionId}/confirm-enc`),
    confirmByProf: (sessionId: number) => api.post(`/sessions/${sessionId}/confirm-prof`),
    getPendingProfessor: () => api.get('/sessions/pending-professor'),
    getPendingDirecao: () => api.get('/sessions/pending-direcao'),
    professorAccept: (id: number) => api.post(`/sessions/${id}/professor-accept`),
    professorReject: (id: number, motivo: string) => api.post(`/sessions/${id}/professor-reject`, motivo),
    approveBooking: (id: number, studioId?: number) => api.post(`/sessions/${id}/approve`, null, { params: { studioId } }), // Direção approves initial booking
    rejectBooking: (id: number) => api.post(`/sessions/${id}/reject`),
    getSessionsReadyForValidation: () => api.get('/sessions/ready-for-validation'),
    getConfirmations: () => api.get('/sessions/get-confirmations'),
    validateSession: (id: number) => api.post(`/sessions/${id}/validate`), // Final 48h validation
    getProfessors: () => api.get<{ id: number, nome: string, modalidades: { id: number, nome: string }[] }[]>('/auth/professors'),
    getModalities: () => api.get<{ id: number, nome: string }[]>('/modalidades'),
    getEstudios: () => api.get<{ id: number, nome: string }[]>('/estudios'),
    getMyStudents: () => api.get<{ id: number, nome: string }[]>('/auth/my-students'),
    getAllStudents: () => api.get<{ id: number, nome: string }[]>('/auth/all-students'),

    // NOVO: Busca o horário pessoal (Professor ou Encarregado)
    getMySchedule: (startDate?: string, endDate?: string) =>
        api.get('/sessions/my-schedule', { params: { startDate, endDate } }),

    // NOVO: Busca o horário geral (Direção)
    getGeneralSchedule: (startDate?: string, endDate?: string) =>
        api.get('/sessions/general-schedule', { params: { startDate, endDate } }),

    deleteSession: (id: number) => api.delete(`/sessions/delete/${id}`),

    // NOVO: Gere disponibilidade do Professor
    getAvailability: () =>
        api.get('/sessions/availability'),
    
    updateAvailability: (slots: any[]) =>
        api.post('/sessions/availability', slots),

    // Admin endpoints
    getEncarregados: () => api.get<{ id: number, nome: string, email: string }[]>('/auth/encarregados'),
    createTeacher: (data: any) => api.post('/auth/create-teacher', data),
    createStudent: (data: { nome: string, encarregadoId: number }) => api.post('/auth/create-student', data)
}
