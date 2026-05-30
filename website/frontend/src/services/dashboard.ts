import api from './api';

export interface RecentActivity {
  type: string;
  description: string;
  userName: string;
  date: string;
  status: string;
}

export interface DashboardStats {
  stat1: number;
  stat2: number;
  stat3: number;
  stat4: number;
  totalValor?: number;
  recentActivities: RecentActivity[];
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },
};
