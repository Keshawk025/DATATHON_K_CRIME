import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService, metadataService } from '../services/api';
import {
  TrendingUp,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users2,
  MapPin,
  Calendar,
  Filter,
  RefreshCw,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export const Dashboard: React.FC = () => {
  // Filter States
  const [district, setDistrict] = useState('');
  const [crimeType, setCrimeType] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Assemble filter payload
  const filters = {
    district: district || undefined,
    crime_type: crimeType || undefined,
    status: status || undefined,
    severity: severity ? parseInt(severity) : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  };

  // Metadata queries (cachable, run once)
  const { data: districts = [] } = useQuery({
    queryKey: ['districts'],
    queryFn: metadataService.getDistricts
  });

  const { data: crimeTypes = [] } = useQuery({
    queryKey: ['crimeTypes'],
    queryFn: metadataService.getCrimeTypes
  });

  // Analytics queries (dependent on filters)
  const {
    data: kpis,
    isLoading: kpisLoading,
    refetch: refetchKPIs
  } = useQuery({
    queryKey: ['dashboardKPIs', filters],
    queryFn: () => analyticsService.getKPIs(filters)
  });

  const {
    data: trends,
    isLoading: trendsLoading,
  } = useQuery({
    queryKey: ['dashboardTrends', filters],
    queryFn: () => analyticsService.getTrends(filters)
  });

  const {
    data: distributions,
    isLoading: distributionsLoading,
  } = useQuery({
    queryKey: ['dashboardDistribution', filters],
    queryFn: () => analyticsService.getDistribution(filters)
  });

  const {
    data: rankings = [],
    isLoading: rankingsLoading,
  } = useQuery({
    queryKey: ['districtRankings', filters],
    queryFn: () => analyticsService.getDistrictRanking(filters)
  });

  const {
    data: recentActivities = [],
    isLoading: recentLoading,
  } = useQuery({
    queryKey: ['recentActivity', filters],
    queryFn: () => analyticsService.getRecentActivity(filters, 5)
  });

  const handleResetFilters = () => {
    setDistrict('');
    setCrimeType('');
    setStatus('');
    setSeverity('');
    setDateFrom('');
    setDateTo('');
  };

  const handleManualRefetch = () => {
    refetchKPIs();
  };

  // Colors for charts
  const CHART_COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
  const SEVERITY_COLORS: { [key: number]: string } = {
    1: '#10b981', // Green
    2: '#3b82f6', // Blue
    3: '#f59e0b', // Orange
    4: '#f97316', // Dark Orange
    5: '#ef4444'  // Red
  };

  const getStatusBadge = (s: string) => {
    const norm = s.toLowerCase();
    if (norm === 'solved' || norm === 'closed') {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (norm === 'under investigation') {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20'; // Open / Active
  };

  const getSeverityBadge = (sev: number) => {
    if (sev >= 4) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (sev === 3) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title & Manual Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Karnataka Crime Intelligence Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time geospatial analytics, KPI monitoring, and offender tracking statistics.</p>
        </div>
        <button
          onClick={handleManualRefetch}
          className="w-fit inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 active:scale-95 transition-all self-end sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Sync Analytics Data</span>
        </button>
      </div>

      {/* Analytics Filter Board */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
          <Filter className="h-4 w-4 text-indigo-400" />
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Multi-Dimensional Query Filter</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* District Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">District</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 outline-none transition-all"
            >
              <option value="">All Districts</option>
              {districts.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Crime Category Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Crime Type</label>
            <select
              value={crimeType}
              onChange={(e) => setCrimeType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 outline-none transition-all"
            >
              <option value="">All Categories</option>
              {crimeTypes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Case Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 outline-none transition-all"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Solved">Solved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Severity Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Severity Level</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 outline-none transition-all"
            >
              <option value="">All Severities</option>
              <option value="1">1 (Lowest)</option>
              <option value="2">2</option>
              <option value="3">3 (Medium)</option>
              <option value="4">4</option>
              <option value="5">5 (Highest)</option>
            </select>
          </div>

          {/* Date From */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 outline-none transition-all"
            />
          </div>

          {/* Date To */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 outline-none transition-all"
            />
          </div>
        </div>

        {/* Reset Filters */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleResetFilters}
            className="px-3.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
          >
            Clear Filter Inputs
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Crimes */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Incident Records</span>
            {kpisLoading ? (
              <div className="h-8 w-20 bg-slate-800 animate-pulse rounded"></div>
            ) : (
              <span className="text-2xl font-bold text-white block">{kpis?.total_crimes ?? 0}</span>
            )}
            <span className="text-[9px] text-slate-600 block mt-0.5">Indexed IPC complaints</span>
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
            <Shield className="h-6 w-6" />
          </div>
        </div>

        {/* Active Cases */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Enquiries</span>
            {kpisLoading ? (
              <div className="h-8 w-20 bg-slate-800 animate-pulse rounded"></div>
            ) : (
              <span className="text-2xl font-bold text-white block">{kpis?.active_cases ?? 0}</span>
            )}
            <span className="text-[9px] text-indigo-400 block mt-0.5">Open & Under Investigation</span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>

        {/* Solved Cases */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Disposed Cases</span>
            {kpisLoading ? (
              <div className="h-8 w-20 bg-slate-800 animate-pulse rounded"></div>
            ) : (
              <span className="text-2xl font-bold text-white block">{kpis?.solved_cases ?? 0}</span>
            )}
            <span className="text-[9px] text-emerald-400 block mt-0.5">
              Solved rate: {kpis?.total_crimes ? Math.round(((kpis.solved_cases / kpis.total_crimes) * 100)) : 0}%
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Repeat Offenders */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recidivists Flagged</span>
            {kpisLoading ? (
              <div className="h-8 w-20 bg-slate-800 animate-pulse rounded"></div>
            ) : (
              <span className="text-2xl font-bold text-white block">{kpis?.repeat_offenders ?? 0}</span>
            )}
            <span className="text-[9px] text-slate-600 block mt-0.5">Risk profiles cataloged</span>
          </div>
          <div className="p-3.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/25">
            <Users2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Temporal KPI Blocks & High Risk Districts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Hotspots */}
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">High-Risk Districts</span>
            <span className="text-base font-bold text-white block mt-0.5">{kpis?.high_risk_districts ?? 0}</span>
          </div>
        </div>

        {/* Crimes Today */}
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Crimes Logged Today</span>
            <span className="text-base font-bold text-white block mt-0.5">{kpis?.crimes_today ?? 0}</span>
          </div>
        </div>

        {/* Crimes This Week */}
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Crimes This Week</span>
            <span className="text-base font-bold text-white block mt-0.5">{kpis?.crimes_this_week ?? 0}</span>
          </div>
        </div>

        {/* Crimes This Month */}
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Crimes This Month</span>
            <span className="text-base font-bold text-white block mt-0.5">{kpis?.crimes_this_month ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line/Area Chart: Monthly Crime Trend */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 col-span-2 flex flex-col h-[320px]">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Temporal Crime Volume Trend</h3>
          </div>
          
          <div className="flex-1 min-h-0">
            {trendsLoading ? (
              <div className="h-full w-full bg-slate-800/20 animate-pulse rounded-xl"></div>
            ) : !trends?.monthly?.length ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No trend data matches the active query filters.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends.monthly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time_unit" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#ffffff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col h-[320px]">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 shrink-0">Severity Distribution</h3>
          <div className="flex-1 min-h-0">
            {distributionsLoading ? (
              <div className="h-full w-full bg-slate-800/20 animate-pulse rounded-xl"></div>
            ) : !distributions?.severity_distribution?.length ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributions.severity_distribution} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="severity" stroke="#64748b" fontSize={10} tickFormatter={(tick) => `Lvl ${tick}`} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    labelFormatter={(label) => `Severity Level ${label}`}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {distributions.severity_distribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.severity] || '#8884d8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Row 2 Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Crime Category Distribution */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col h-[320px] md:col-span-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 shrink-0">IPC Category Breakdown</h3>
          <div className="flex-1 min-h-0">
            {distributionsLoading ? (
              <div className="h-full w-full bg-slate-800/20 animate-pulse rounded-xl"></div>
            ) : !distributions?.category_distribution?.length ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distributions.category_distribution.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 5, right: 15, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} />
                  <YAxis
                    dataKey="category"
                    type="category"
                    stroke="#64748b"
                    fontSize={9}
                    width={100}
                    tickFormatter={(val) => val.split(' (')[0]}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Case Status Breakdown */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col h-[320px]">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 shrink-0">Enquiry Status Distribution</h3>
          <div className="flex-1 min-h-0 relative flex items-center justify-center">
            {distributionsLoading ? (
              <div className="h-full w-full bg-slate-800/20 animate-pulse rounded-xl"></div>
            ) : !distributions?.status_distribution?.length ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No data available.</div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="w-full h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributions.status_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="status"
                      >
                        {distributions.status_distribution.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Custom Legends */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-[10px] font-semibold text-slate-400">
                  {distributions.status_distribution.map((entry: any, index: number) => (
                    <div key={entry.status} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                      <span className="truncate max-w-[100px]">{entry.status}: <strong className="text-white">{entry.count}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* District Rankings Table / Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* District rankings horizontal bar chart */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 col-span-2 flex flex-col h-[350px]">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 shrink-0">District Volume Rankings (Top 10)</h3>
          <div className="flex-1 min-h-0">
            {rankingsLoading ? (
              <div className="h-full w-full bg-slate-800/20 animate-pulse rounded-xl"></div>
            ) : !rankings?.length ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No rankings available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={rankings.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} />
                  <YAxis dataKey="district_name" type="category" stroke="#64748b" fontSize={10} width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                  <Bar dataKey="crime_count" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* District details summary card panel */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col h-[350px]">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 shrink-0">High Crime Districts Breakdown</h3>
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
            {rankingsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 bg-slate-850 animate-pulse rounded-xl border border-slate-800/60"></div>
              ))
            ) : rankings.filter((r: any) => r.crime_count > 0).length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center px-4">
                No district records match the filters or contain logged crime cases.
              </div>
            ) : (
              rankings.filter((r: any) => r.crime_count > 0).map((r: any) => (
                <div key={r.district_id} className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{r.district_name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold">
                      {r.crime_count} Crimes
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-semibold text-slate-500">
                    <div>
                      <span>Top Crime: </span>
                      <strong className="text-slate-300 truncate block max-w-full">{r.top_crime_type?.split(' (')[0] || 'None'}</strong>
                    </div>
                    <div>
                      <span>Avg Risk Score: </span>
                      <strong className="text-slate-300 block">{r.average_risk_score ? r.average_risk_score.toFixed(1) : '0.0'}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Recent Activity Table */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recently Registered FIR Case Files</h3>
        </div>

        <div className="overflow-x-auto">
          {recentLoading ? (
            <div className="space-y-2.5">
              <div className="h-8 bg-slate-850 animate-pulse rounded"></div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-900/50 animate-pulse rounded"></div>
              ))}
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No recent FIR case filings match the active criteria.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="pb-3 pr-4">FIR Number</th>
                  <th className="pb-3 px-4">District Office</th>
                  <th className="pb-3 px-4">Crime Classification</th>
                  <th className="pb-3 px-4 text-center">Severity</th>
                  <th className="pb-3 px-4">Case Status</th>
                  <th className="pb-3 pl-4">Occurrence Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {recentActivities.map((fir: any) => (
                  <tr key={fir.id} className="hover:bg-slate-900/30 text-slate-300 transition-colors">
                    <td className="py-3.5 pr-4 text-white font-bold">{fir.fir_number}</td>
                    <td className="py-3.5 px-4">{fir.district?.name || 'KSP HQ'}</td>
                    <td className="py-3.5 px-4 max-w-[200px] truncate">{fir.crime_type?.name || 'IPC Violation'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getSeverityBadge(fir.severity)}`}>
                        Level {fir.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${getStatusBadge(fir.status)}`}>
                        {fir.status}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 text-slate-400">{fir.occurrence_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};
