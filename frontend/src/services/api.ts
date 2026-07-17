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
    return {
      total_crimes: 120,
      active_cases: 45,
      solved_cases: 75,
      repeat_offenders: 12,
      high_risk_districts: 3,
      crimes_today: 5,
      crimes_this_week: 25,
      crimes_this_month: 120
    };
  },
  getTrends: async (filters: any): Promise<any> => {
    return {
      monthly: [
        { time_unit: 'Jan', count: 10 },
        { time_unit: 'Feb', count: 15 },
        { time_unit: 'Mar', count: 20 },
        { time_unit: 'Apr', count: 18 }
      ]
    };
  },
  getDistribution: async (filters: any): Promise<any> => {
    return {
      severity_distribution: [
        { severity: 1, count: 10 },
        { severity: 2, count: 20 },
        { severity: 3, count: 30 },
        { severity: 4, count: 15 },
        { severity: 5, count: 5 }
      ],
      category_distribution: [
        { category: 'Theft', count: 40 },
        { category: 'Cybercrime', count: 30 },
        { category: 'Assault', count: 20 },
        { category: 'Fraud', count: 30 }
      ],
      status_distribution: [
        { status: 'Open', count: 15 },
        { status: 'Under Investigation', count: 30 },
        { status: 'Solved', count: 75 }
      ]
    };
  },
  getDistrictRanking: async (filters: any): Promise<any> => {
    return [
      { district_id: '1', district_name: 'Bengaluru Urban', crime_count: 85, average_risk_score: 8.5, top_crime_type: 'Theft' },
      { district_id: '2', district_name: 'Mysuru', crime_count: 70, average_risk_score: 7.0, top_crime_type: 'Cybercrime' },
      { district_id: '3', district_name: 'Hubballi', crime_count: 60, average_risk_score: 6.0, top_crime_type: 'Assault' }
    ];
  },
  getRecentActivity: async (filters: any, limit = 5): Promise<any> => {
    return [
      { id: '1', fir_number: 'FIR-001', district: { name: 'Bengaluru Urban' }, crime_type: { name: 'Theft' }, severity: 3, status: 'Open', occurrence_date: '2026-07-16' },
      { id: '2', fir_number: 'FIR-002', district: { name: 'Mysuru' }, crime_type: { name: 'Cybercrime' }, severity: 4, status: 'Under Investigation', occurrence_date: '2026-07-15' }
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
