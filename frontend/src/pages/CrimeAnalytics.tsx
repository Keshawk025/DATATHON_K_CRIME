import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Shield, AlertTriangle, CheckCircle2, TrendingUp,
  Filter, RefreshCw, MapPin, Users, BarChart2, Clock,
  Calendar, X, ChevronRight
} from 'lucide-react';
import { analyticsService, metadataService } from '../services/api';

const SEVERITY_COLORS = ['#22c55e', '#84cc16', '#f59e0b', '#ef4444', '#7c3aed'];
const STATUS_COLORS = ['#ef4444', '#22c55e', '#f59e0b', '#6366f1', '#94a3b8'];
const CATEGORY_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#10b981', '#f43f5e', '#3b82f6'];

function KPICard({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className={`bg-[#0b1220] border border-slate-800 rounded-xl p-4 flex items-center justify-between`}>
      <div>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</span>
        <div className={`text-2xl font-black mt-1 ${color}`}>{value}</div>
        {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
      </div>
      <div className={`p-3 rounded-xl bg-slate-900 border border-slate-800 ${color}`}>{icon}</div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-indigo-400">{icon}</span>
      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{title}</h3>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-6 flex items-center justify-center h-48">
      <div className="flex items-center gap-2 text-slate-500">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-xs">Loading...</span>
      </div>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="bg-[#0b1220] border border-red-900/30 rounded-xl p-6 flex items-center justify-center h-48">
      <div className="text-center">
        <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
        <p className="text-xs text-red-400">{message}</p>
      </div>
    </div>
  );
}

export default function CrimeAnalytics() {
  const [district, setDistrict] = useState('');
  const [crimeType, setCrimeType] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filters = {
    district: district || undefined,
    crime_type: crimeType || undefined,
    status: status || undefined,
    severity: severity ? parseInt(severity) : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  };

  const hasFilters = district || crimeType || status || severity || dateFrom || dateTo;

  const { data: districts = [] } = useQuery({ queryKey: ['districts'], queryFn: metadataService.getDistricts });
  const { data: crimeTypes = [] } = useQuery({ queryKey: ['crimeTypes'], queryFn: metadataService.getCrimeTypes });

  const {
    data: kpis, isLoading: kpiLoading, isError: kpiError, refetch: refetchKpis
  } = useQuery({ queryKey: ['analyticsKpis', filters], queryFn: () => analyticsService.getKPIs(filters) });

  const {
    data: trends, isLoading: trendsLoading, isError: trendsError
  } = useQuery({ queryKey: ['analyticsTrends', filters], queryFn: () => analyticsService.getTrends(filters) });

  const {
    data: dist, isLoading: distLoading, isError: distError
  } = useQuery({ queryKey: ['analyticsDistribution', filters], queryFn: () => analyticsService.getDistribution(filters) });

  const {
    data: ranking = [], isLoading: rankLoading, isError: rankError
  } = useQuery({ queryKey: ['analyticsRanking', filters], queryFn: () => analyticsService.getDistrictRanking(filters) });

  const {
    data: recent = [], isLoading: recentLoading
  } = useQuery({ queryKey: ['analyticsRecent', filters], queryFn: () => analyticsService.getRecentActivity(filters, 8) });

  const resetFilters = () => {
    setDistrict(''); setCrimeType(''); setStatus('');
    setSeverity(''); setDateFrom(''); setDateTo('');
  };

  const solveRate = kpis && kpis.total_crimes > 0
    ? Math.round((kpis.solved_cases / kpis.total_crimes) * 100) : 0;

  return (
    <div className="p-6 space-y-6 bg-[#090d16] min-h-screen text-slate-100 overflow-y-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0d1527] p-5 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-black tracking-wider uppercase">
            <BarChart2 className="w-4 h-4" />
            Crime Intelligence Analytics
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-1">Crime Analytics Engine</h1>
          <p className="text-xs text-slate-400 mt-0.5">Statistical trends, crime category analysis, severity distribution, and district rankings from live database.</p>
        </div>
        <button
          onClick={() => refetchKpis()}
          className="flex items-center gap-1.5 border border-slate-700 bg-slate-900 hover:bg-slate-800 rounded-lg py-2 px-3 text-xs text-slate-300 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-300">Analysis Filters</h3>
          </div>
          {hasFilters && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white border border-slate-700 rounded px-2 py-1 transition">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <select value={district} onChange={e => setDistrict(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-indigo-500">
            <option value="">All Districts</option>
            {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={crimeType} onChange={e => setCrimeType(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-indigo-500">
            <option value="">All Categories</option>
            {crimeTypes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-indigo-500">
            <option value="">All Statuses</option>
            {['Under Investigation', 'Chargesheeted', 'Closed', 'Referred'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={severity} onChange={e => setSeverity(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-indigo-500">
            <option value="">All Severities</option>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>Severity {n}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-indigo-500" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-indigo-500" />
        </div>
      </div>

      {/* KPI Cards */}
      {kpiLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#0b1220] border border-slate-800 rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : kpiError ? (
        <ErrorCard message="Failed to load KPIs" />
      ) : kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard label="Total Crimes" value={kpis.total_crimes} sub={`${kpis.crimes_this_month} this month`}
            icon={<Shield className="w-5 h-5" />} color="text-white" />
          <KPICard label="Active Cases" value={kpis.active_cases}
            sub={`${kpis.crimes_today} today • ${kpis.crimes_this_week} this week`}
            icon={<AlertTriangle className="w-5 h-5" />} color="text-amber-400" />
          <KPICard label="Solved Cases" value={kpis.solved_cases} sub={`${solveRate}% solve rate`}
            icon={<CheckCircle2 className="w-5 h-5" />} color="text-emerald-400" />
          <KPICard label="Avg Severity" value={(kpis.total_crimes > 0 ? '—' : '—')}
            sub={`${kpis.high_risk_districts} high-risk districts`}
            icon={<TrendingUp className="w-5 h-5" />} color="text-indigo-400" />
        </div>
      )}

      {/* Extra KPI row */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard label="Repeat Offenders" value={kpis.repeat_offenders}
            icon={<Users className="w-5 h-5" />} color="text-rose-400" />
          <KPICard label="High-Risk Districts" value={kpis.high_risk_districts}
            icon={<MapPin className="w-5 h-5" />} color="text-orange-400" />
          <KPICard label="Total Districts" value={kpis.total_districts}
            icon={<MapPin className="w-5 h-5" />} color="text-cyan-400" />
          <KPICard label="Crime Categories" value={kpis.total_crime_categories}
            icon={<BarChart2 className="w-5 h-5" />} color="text-purple-400" />
        </div>
      )}

      {/* Charts Row 1: Monthly Trend + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5">
          <SectionTitle icon={<TrendingUp className="w-4 h-4" />} title="Monthly Crime Trend" />
          {trendsLoading ? <LoadingCard /> : trendsError ? <ErrorCard message="Failed to load trends" /> : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends?.monthly ?? []}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time_unit" stroke="#475569" fontSize={10} tickFormatter={v => v.slice(5)} />
                  <YAxis stroke="#475569" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: 11 }} />
                  <Area type="monotone" dataKey="count" name="Crimes" stroke="#6366f1" strokeWidth={2} fill="url(#trendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5">
          <SectionTitle icon={<BarChart2 className="w-4 h-4" />} title="Crime Category Distribution" />
          {distLoading ? <LoadingCard /> : distError ? <ErrorCard message="Failed to load distribution" /> : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dist?.category_distribution?.slice(0, 8) ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#475569" fontSize={10} />
                  <YAxis type="category" dataKey="category" stroke="#475569" fontSize={9} width={110}
                    tickFormatter={v => v.length > 18 ? v.slice(0, 18) + '…' : v} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: 11 }} />
                  <Bar dataKey="count" name="Cases" radius={[0, 4, 4, 0]}>
                    {(dist?.category_distribution?.slice(0, 8) ?? []).map((_: any, i: number) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Severity + Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5">
          <SectionTitle icon={<AlertTriangle className="w-4 h-4" />} title="Severity Distribution" />
          {distLoading ? <LoadingCard /> : distError ? <ErrorCard message="Failed to load severity data" /> : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dist?.severity_distribution ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="severity" stroke="#475569" fontSize={10} tickFormatter={v => `Sev ${v}`} />
                  <YAxis stroke="#475569" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: 11 }}
                    formatter={(v: any) => [v, 'Cases']} labelFormatter={l => `Severity ${l}`} />
                  <Bar dataKey="count" name="Cases" radius={[4, 4, 0, 0]}>
                    {(dist?.severity_distribution ?? []).map((_: any, i: number) => (
                      <Cell key={i} fill={SEVERITY_COLORS[i % SEVERITY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5">
          <SectionTitle icon={<CheckCircle2 className="w-4 h-4" />} title="Case Status Distribution" />
          {distLoading ? <LoadingCard /> : distError ? <ErrorCard message="Failed to load status data" /> : (
            <div className="h-56 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dist?.status_distribution ?? []} dataKey="count" nameKey="status"
                    cx="45%" cy="50%" outerRadius={80} innerRadius={44} paddingAngle={3}
                    label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false} fontSize={10}>
                    {(dist?.status_distribution ?? []).map((_: any, i: number) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: 11 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingLeft: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* District Rankings */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5">
        <SectionTitle icon={<MapPin className="w-4 h-4" />} title="District Crime Rankings" />
        {rankLoading ? <LoadingCard /> : rankError ? <ErrorCard message="Failed to load district rankings" /> :
          ranking.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">No district data available for current filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase text-[9px] tracking-wider">
                    <th className="text-left py-2 px-3">Rank</th>
                    <th className="text-left py-2 px-3">District</th>
                    <th className="text-left py-2 px-3">Crime Count</th>
                    <th className="text-left py-2 px-3">Top Category</th>
                    <th className="text-left py-2 px-3">Avg Risk Score</th>
                    <th className="text-left py-2 px-3">Repeat Offenders</th>
                    <th className="text-left py-2 px-3">Density</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((r: any, i: number) => {
                    const maxCount = ranking[0]?.crime_count || 1;
                    const pct = Math.round((r.crime_count / maxCount) * 100);
                    return (
                      <tr key={r.district_id} className="border-b border-slate-800/50 hover:bg-slate-900/40 transition">
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-black ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-600' : 'text-slate-500'}`}>
                            #{i + 1}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">{r.district_name}</td>
                        <td className="py-3 px-3 font-bold text-indigo-400">{r.crime_count}</td>
                        <td className="py-3 px-3 text-slate-400 max-w-[180px] truncate">{r.top_crime_type ?? '—'}</td>
                        <td className="py-3 px-3">
                          <span className={`font-bold ${r.average_risk_score >= 70 ? 'text-rose-400' : r.average_risk_score >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {r.average_risk_score.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{r.repeat_offender_count}</td>
                        <td className="py-3 px-3">
                          <div className="w-24 bg-slate-900 rounded-full h-1.5">
                            <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Recent Activity */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5">
        <SectionTitle icon={<Clock className="w-4 h-4" />} title="Recent FIR Activity" />
        {recentLoading ? <LoadingCard /> : recent.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">No recent activity found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recent.map((fir: any) => (
              <div key={fir.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{fir.fir_number}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      fir.status === 'Closed' ? 'text-emerald-400 border-emerald-900 bg-emerald-950/40' :
                      fir.status === 'Under Investigation' ? 'text-amber-400 border-amber-900 bg-amber-950/40' :
                      'text-slate-400 border-slate-800 bg-slate-900'
                    }`}>{fir.status}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 truncate">{fir.location}</div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fir.reported_date}</span>
                    <span>Sev: <span className="text-amber-400 font-bold">{fir.severity}/5</span></span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-1" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
