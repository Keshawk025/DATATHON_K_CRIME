// @ts-nocheck
// Mock API with static values

export const authService = {
  login: async (credentials: any): Promise<any> => {
    return { access_token: 'mock-token', user: { id: '1', name: 'Admin', role: 'admin' } };
  },
  getMe: async (): Promise<any> => {
    return { id: '1', name: 'Admin', role: 'admin', email: 'admin@example.com' };
  },
};

export const analyticsService = {
  getSummary: async (filters: any): Promise<any> => {
    return { total_firs: 120, total_arrests: 45, total_cases_pending: 75 };
  },
  getKPIs: async (filters: any): Promise<any> => {
    return [
      { title: 'Total Cases', value: '120', trend: 5 },
      { title: 'Resolved Cases', value: '45', trend: 2 },
      { title: 'Pending Cases', value: '75', trend: -1 }
    ];
  },
  getTrends: async (filters: any): Promise<any> => {
    return [
      { date: '2026-01-01', count: 10 },
      { date: '2026-02-01', count: 15 },
      { date: '2026-03-01', count: 20 },
      { date: '2026-04-01', count: 18 }
    ];
  },
  getDistribution: async (filters: any): Promise<any> => {
    return [
      { name: 'Theft', value: 40 },
      { name: 'Cybercrime', value: 30 },
      { name: 'Assault', value: 20 },
      { name: 'Fraud', value: 30 }
    ];
  },
  getDistrictRanking: async (filters: any): Promise<any> => {
    return [
      { district: 'Bengaluru Urban', score: 85, rank: 1 },
      { district: 'Mysuru', score: 70, rank: 2 },
      { district: 'Hubballi', score: 60, rank: 3 }
    ];
  },
  getRecentActivity: async (filters: any, limit = 5): Promise<any> => {
    return [
      { id: '1', type: 'fir', description: 'New FIR filed in Mysuru', timestamp: new Date().toISOString() },
      { id: '2', type: 'arrest', description: 'Arrest made in Bengaluru', timestamp: new Date().toISOString() }
    ];
  },
};

export const metadataService = {
  getDistricts: async (): Promise<any> => {
    return [
      { id: '1', name: 'Bengaluru Urban' },
      { id: '2', name: 'Mysuru' },
      { id: '3', name: 'Hubballi' }
    ];
  },
  getCrimeTypes: async (): Promise<any> => {
    return [
      { id: '1', name: 'Theft' },
      { id: '2', name: 'Cybercrime' },
      { id: '3', name: 'Assault' }
    ];
  },
};

export const geospatialService = {
  getHeatmapPoints: async (filters: any): Promise<any> => {
    return [
      { lat: 12.9716, lng: 77.5946, weight: 10 },
      { lat: 12.2958, lng: 76.6394, weight: 5 }
    ];
  },
  getHotspots: async (filters: any): Promise<any> => {
    return [
      { id: '1', name: 'Indiranagar', risk_score: 80, lat: 12.9783, lng: 77.6408 }
    ];
  },
  getDistrictStatistics: async (districtId: string): Promise<any> => {
    return { 
      crime_rate: 45.5, 
      crime_count: 50,
      recent_fir_count: 10,
      repeat_offenders: 5,
      average_risk_score: 75,
      trend: [{ month: 'Jan', count: 10 }, { month: 'Feb', count: 15 }],
      top_crime_types: [{ type: 'Theft', count: 20 }, { type: 'Fraud', count: 15 }],
      recent_incidents: [{ id: '1', title: 'Theft reported', time: '10:00 AM', severity: 'High' }]
    };
  },
};

export const networkService = {
  getNetwork: async (criminalId: string): Promise<any> => {
    return {
      nodes: [{ id: '1', name: 'John Doe', group: 1 }],
      links: []
    };
  },
  searchNetwork: async (query: string): Promise<any> => {
    return [
      { id: '1', name: 'John Doe' }
    ];
  },
  getRepeatOffenders: async (filters: any): Promise<any> => {
    return [
      { id: '1', full_name: 'Somesh Gowda', crime_count: 5, risk_score: 85, risk_level: 'High' },
      { id: '2', full_name: 'Ketan Shah', crime_count: 3, risk_score: 60, risk_level: 'Medium' }
    ];
  },
  getTimeline: async (criminalId: string): Promise<any> => {
    return [
      { id: '1', date: '2025-10-10', event: 'First Arrest' }
    ];
  },
  getRelationships: async (criminalId: string): Promise<any> => {
    return [
      { related_id: '2', name: 'Ketan Shah', relation_type: 'accomplice' }
    ];
  },
};

export const aiService = {
  chat: async (message: string, history: any[]): Promise<any> => {
    return "This is a mock AI response to: " + message;
  },
  getFIRSummary: async (firId: string): Promise<any> => {
    return "Mock FIR summary for " + firId;
  },
  getDistrictSummary: async (districtId: string): Promise<any> => {
    return "Mock District summary for " + districtId;
  },
  getInvestigationPlan: async (criminalId: string): Promise<any> => {
    return "Mock Investigation Plan for " + criminalId;
  },
  getTrendAnalysis: async (districtId?: string, crimeTypeId?: string): Promise<any> => {
    return "Mock Trend Analysis";
  },
};

export const mlService = {
  train: async (): Promise<any> => {
    return { status: 'success', message: 'Model trained successfully' };
  },
  getStatus: async (): Promise<any> => {
    return { 
      status: 'Ready', 
      last_training_date: '2026-07-16',
      metrics: {
        hotspot: { accuracy: 92.4 },
        risk: { f1_score: 0.865 },
        anomaly: { anomaly_ratio: 0.10 }
      }
    };
  },
  predictHotspot: async (districtId: string, month: number, year: number): Promise<any> => {
    return { 
      predicted_crime_count: 15,
      risk_level: 'High',
      hotspot_score: 85
    };
  },
  predictRisk: async (age: number, gender: string, pastFirCount: number, avgSeverity: number): Promise<any> => {
    return { 
      risk_score: 65, 
      risk_level: 'Medium' 
    };
  },
  predictTrend: async (monthsAhead: number = 6): Promise<any> => {
    return [
      { month_label: 'Jan', predicted_crime_count: 45 },
      { month_label: 'Feb', predicted_crime_count: 55 },
      { month_label: 'Mar', predicted_crime_count: 40 },
      { month_label: 'Apr', predicted_crime_count: 60 }
    ];
  },
  predictAnomaly: async (latitude: number, longitude: number, severity: number, month: number, dayOfWeek: number): Promise<any> => {
    return { 
      is_anomaly: true, 
      anomaly_index: 85 
    };
  },
};
