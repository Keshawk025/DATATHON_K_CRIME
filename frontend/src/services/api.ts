import axios from 'axios';

// Get API base URL and strip trailing '/api' if present since backend routes are mounted on /
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl.slice(0, -4) : rawApiUrl;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth services
export const authService = {
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Analytics services
export const analyticsService = {
  getSummary: async (filters: any) => {
    const response = await api.get('/dashboard/summary', { params: filters });
    return response.data.data;
  },
  getKPIs: async (filters: any) => {
    const response = await api.get('/dashboard/kpis', { params: filters });
    return response.data.data;
  },
  getTrends: async (filters: any) => {
    const response = await api.get('/dashboard/trends', { params: filters });
    return response.data.data;
  },
  getDistribution: async (filters: any) => {
    const response = await api.get('/dashboard/distribution', { params: filters });
    return response.data.data;
  },
  getDistrictRanking: async (filters: any) => {
    const response = await api.get('/dashboard/district-ranking', { params: filters });
    return response.data.data;
  },
  getRecentActivity: async (filters: any, limit = 5) => {
    const response = await api.get('/dashboard/recent-activity', { params: { ...filters, limit } });
    return response.data.data;
  },
};

// Metadata services
export const metadataService = {
  getDistricts: async () => {
    const response = await api.get('/districts');
    return response.data.data;
  },
  getCrimeTypes: async () => {
    const response = await api.get('/crime-types');
    return response.data.data;
  },
};

// Geospatial / Heatmap services
export const geospatialService = {
  getHeatmapPoints: async (filters: any) => {
    const response = await api.get('/heatmap', { params: filters });
    return response.data.data;
  },
  getHotspots: async (filters: any) => {
    const response = await api.get('/heatmap/hotspots', { params: filters });
    return response.data.data;
  },
  getDistrictStatistics: async (districtId: string) => {
    const response = await api.get(`/heatmap/districts/${districtId}/statistics`);
    return response.data.data;
  },
};

// Network & Repeat Offender services
export const networkService = {
  getNetwork: async (criminalId: string) => {
    const response = await api.get(`/network/${criminalId}`);
    return response.data.data;
  },
  searchNetwork: async (query: string) => {
    const response = await api.get('/network/search', { params: { query } });
    return response.data.data;
  },
  getRepeatOffenders: async (filters: any) => {
    const response = await api.get('/criminals/repeat-offenders/advanced', { params: filters });
    return response.data.data;
  },
  getTimeline: async (criminalId: string) => {
    const response = await api.get(`/criminals/${criminalId}/timeline`);
    return response.data.data;
  },
  getRelationships: async (criminalId: string) => {
    const response = await api.get(`/criminals/${criminalId}/relationships`);
    return response.data.data;
  },
};

// AI Services
export const aiService = {
  chat: async (message: string, history: any[]) => {
    const response = await api.post('/ai/chat', { message, history });
    return response.data.data.response;
  },
  getFIRSummary: async (firId: string) => {
    const response = await api.post('/ai/fir-summary', { fir_id: firId });
    return response.data.data.summary;
  },
  getDistrictSummary: async (districtId: string) => {
    const response = await api.post('/ai/district-summary', { district_id: districtId });
    return response.data.data.summary;
  },
  getInvestigationPlan: async (criminalId: string) => {
    const response = await api.post('/ai/investigation', { criminal_id: criminalId });
    return response.data.data.summary;
  },
  getTrendAnalysis: async (districtId?: string, crimeTypeId?: string) => {
    const response = await api.post('/ai/trend-analysis', {
      district_id: districtId || null,
      crime_type_id: crimeTypeId || null
    });
    return response.data.data.summary;
  },
};

// ML / Prediction Services
export const mlService = {
  train: async () => {
    const response = await api.post('/ml/train');
    return response.data.data;
  },
  getStatus: async () => {
    const response = await api.get('/predict/model-status');
    return response.data.data;
  },
  predictHotspot: async (districtId: string, month: number, year: number) => {
    const response = await api.post('/predict/hotspot', {
      district_id: districtId,
      month,
      year
    });
    return response.data.data;
  },
  predictRisk: async (age: number, gender: string, pastFirCount: number, avgSeverity: number) => {
    const response = await api.post('/predict/risk', {
      age,
      gender,
      past_fir_count: pastFirCount,
      avg_severity: avgSeverity
    });
    return response.data.data;
  },
  predictTrend: async (monthsAhead: number = 6) => {
    const response = await api.post('/predict/trend', {
      months_ahead: monthsAhead
    });
    return response.data.data;
  },
  predictAnomaly: async (latitude: number, longitude: number, severity: number, month: number, dayOfWeek: number) => {
    const response = await api.post('/predict/anomaly', {
      latitude,
      longitude,
      severity,
      month,
      day_of_week: dayOfWeek
    });
    return response.data.data;
  },
};
