import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Shield,
  AlertTriangle,
  User,
  Users,
  TrendingUp,
  Clock,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';
import { networkService, metadataService } from '../services/api';

export default function RepeatOffenders() {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [riskLevel, setRiskLevel] = useState('all');
  const [districtId, setDistrictId] = useState('all');
  const [crimeTypeId, setCrimeTypeId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selected offender details sidepanel
  const [selectedOffender, setSelectedOffender] = useState<any>(null);

  // Queries for dropdowns
  const { data: districts = [] } = useQuery({
    queryKey: ['districtsList'],
    queryFn: metadataService.getDistricts
  });

  const { data: crimeTypes = [] } = useQuery({
    queryKey: ['crimeTypesList'],
    queryFn: metadataService.getCrimeTypes
  });

  // Main Repeat Offenders Query
  const filtersObj = {
    search: searchTerm || undefined,
    risk_level: riskLevel !== 'all' ? riskLevel : undefined,
    district_id: districtId !== 'all' ? districtId : undefined,
    crime_type_id: crimeTypeId !== 'all' ? crimeTypeId : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined
  };

  const { data: repeatOffenders = [], isLoading: isListLoading, refetch } = useQuery({
    queryKey: ['repeatOffendersAdvanced', filtersObj],
    queryFn: () => networkService.getRepeatOffenders(filtersObj)
  });

  // Timeline for selected side panel
  const { data: timelineData = [], isLoading: isTimelineLoading } = useQuery({
    queryKey: ['offenderTimeline', selectedOffender?.id],
    queryFn: () => networkService.getTimeline(selectedOffender.id),
    enabled: !!selectedOffender
  });

  // Relationships for selected side panel
  const { data: relationshipsData = [], isLoading: isRelationshipsLoading } = useQuery({
    queryKey: ['offenderRelationships', selectedOffender?.id],
    queryFn: () => networkService.getRelationships(selectedOffender.id),
    enabled: !!selectedOffender
  });

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setRiskLevel('all');
    setDistrictId('all');
    setCrimeTypeId('all');
    setDateFrom('');
    setDateTo('');
  };

  // Badges & styling helpers
  const getRiskBadge = (score: number) => {
    if (score >= 75) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-900">
          Critical Risk
        </span>
      );
    }
    if (score >= 40) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-900">
          Medium Risk
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-900">
        Low Risk
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'High') {
      return <span className="text-red-500 font-black">HIGH</span>;
    }
    if (priority === 'Medium') {
      return <span className="text-amber-500 font-bold">MEDIUM</span>;
    }
    return <span className="text-emerald-500 font-medium">LOW</span>;
  };

  // Metrics calculation
  const totalCount = repeatOffenders.length;
  const criticalCount = repeatOffenders.filter((c: any) => c.risk_score >= 75).length;
  const avgRisk = totalCount > 0 
    ? Math.round(repeatOffenders.reduce((sum: number, c: any) => sum + c.risk_score, 0) / totalCount) 
    : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] text-slate-100 bg-[#090d16] overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 bg-[#0d1527] flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/30">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Repeat Offender Intelligence</h1>
            <p className="text-xs text-slate-400">Track recidivism rates, identify active offenders, and prioritize investigative resources across jurisdictions.</p>
          </div>
        </div>

        <button onClick={() => refetch()} className="p-2 rounded hover:bg-slate-800/80 border border-slate-700 bg-slate-900 flex items-center gap-1.5 text-xs text-slate-300">
          <RefreshCw className="w-3.5 h-3.5" />
          Sync Core Database
        </button>
      </div>

      {/* KPI Cards section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b border-slate-850 bg-[#070b13]">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Offenders</span>
            <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <User className="w-5 h-5 text-slate-400" />
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Critical Priority</span>
            <div className="text-2xl font-black text-red-400 mt-1">{criticalCount}</div>
          </div>
          <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Avg Offender Risk</span>
            <div className="text-2xl font-black text-amber-400 mt-1">{avgRisk} <span className="text-xs font-normal text-slate-500">/ 100</span></div>
          </div>
          <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-lg">
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Recidivism Flag</span>
            <div className="text-2xl font-black text-white mt-1">100%</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Table & Search */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Advanced Filter Deck */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-4 mb-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-300">Filter Investigation Matrix</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search offender name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:border-red-500 placeholder-slate-500"
                />
              </div>

              {/* Risk Level */}
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
                className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-red-500"
              >
                <option value="all">All Risk Scores</option>
                <option value="High">High Risk (≥75)</option>
                <option value="Medium">Medium Risk (40-74)</option>
                <option value="Low">Low Risk (&lt;40)</option>
              </select>

              {/* District */}
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-red-500"
              >
                <option value="all">All Districts</option>
                {districts.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              {/* Crime Type */}
              <select
                value={crimeTypeId}
                onChange={(e) => setCrimeTypeId(e.target.value)}
                className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-red-500"
              >
                <option value="all">All Categories</option>
                {crimeTypes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Reset Button */}
              <button
                onClick={handleResetFilters}
                className="text-xs border border-slate-800 hover:bg-slate-900 rounded-lg py-2 text-slate-400 font-semibold"
              >
                Clear Matrix
              </button>
            </div>

            {/* Date range row */}
            <div className="flex items-center gap-3 border-t border-slate-800/50 pt-2.5 text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Filter by Incident Period:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 text-[11px] focus:outline-none"
              />
              <span className="text-slate-600">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 text-[11px] focus:outline-none"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 bg-[#0b1220] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {isListLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="text-xs">Loading database records...</span>
                </div>
              ) : repeatOffenders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500">
                  <Shield className="w-8 h-8 mb-2" />
                  <h4 className="text-xs font-bold text-slate-400">No Offenders Match Applied Filters</h4>
                  <p className="text-[11px] mt-1 max-w-[280px] leading-relaxed">
                    Try removing some query filters or clear the investigation matrix.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[9px] font-bold sticky top-0 z-10">
                      <th className="py-3 px-4">Criminal Profile</th>
                      <th className="py-3 px-4">Risk score</th>
                      <th className="py-3 px-4 text-center">FIR Count</th>
                      <th className="py-3 px-4">Most Common Crime</th>
                      <th className="py-3 px-4">Recent Activity</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repeatOffenders.map((offender: any) => (
                      <tr
                        key={offender.id}
                        onClick={() => setSelectedOffender(offender)}
                        className={`border-b border-slate-850 hover:bg-slate-900/60 transition cursor-pointer ${selectedOffender?.id === offender.id ? 'bg-slate-900/90' : ''}`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-xs">{offender.full_name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Alias: {offender.aliases || 'N/A'} • {offender.age} yrs • {offender.gender}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span>{offender.risk_score}</span>
                            {getRiskBadge(offender.risk_score)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-300">
                          {offender.fir_count}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">
                          {offender.most_common_crime}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {offender.recent_activity}
                        </td>
                        <td className="py-3.5 px-4 text-[10px]">
                          {getPriorityBadge(offender.investigation_priority)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white inline-flex items-center gap-1 text-[10px]">
                            Details <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Displaying {repeatOffenders.length} active high-risk offender profiles</span>
              <span>Karnataka State Police Command Intelligence Portal</span>
            </div>
          </div>
        </div>

        {/* Right Side: Offender Details Slider */}
        {selectedOffender && (
          <div className="w-96 border-l border-slate-800 bg-[#0b1220] flex flex-col overflow-y-auto relative">
            <div className="p-4 flex flex-col h-full">
              {/* Slider Header */}
              <div className="pb-3 border-b border-slate-850 flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">INVESTIGATION TARGET</span>
                  <h2 className="text-base font-black text-white mt-0.5">{selectedOffender.full_name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Aliases: {selectedOffender.aliases || 'N/A'}</p>
                </div>
                <button onClick={() => setSelectedOffender(null)} className="p-1 hover:bg-slate-800 rounded">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Assessment Panel */}
              <div className="mt-4 flex flex-col gap-4 flex-1">
                {/* Risk dial progress */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-4">
                  <div className="w-16 h-16 flex-shrink-0 relative">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-red-500"
                        strokeWidth="3.5"
                        strokeDasharray={`${selectedOffender.risk_score}, 100`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">
                      {selectedOffender.risk_score}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Priority Assessment</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      This offender has an active score of {selectedOffender.risk_score}. Relates to crime categories with severity index &ge; 4.
                    </p>
                  </div>
                </div>

                {/* Grid metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-slate-950/40 rounded border border-slate-900">
                    <span className="text-slate-500 block">Crime Frequency</span>
                    <span className="text-slate-200 font-bold block mt-0.5">{selectedOffender.fir_count} Cases Registered</span>
                  </div>
                  <div className="p-3 bg-slate-950/40 rounded border border-slate-900">
                    <span className="text-slate-500 block">Last Active Date</span>
                    <span className="text-slate-200 font-bold block mt-0.5">{selectedOffender.recent_activity}</span>
                  </div>
                </div>

                {/* Known Associates */}
                <div>
                  <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Known Syndicate Linkages
                  </h3>
                  {isRelationshipsLoading ? (
                    <div className="text-[11px] text-slate-500 py-1">Analyzing links...</div>
                  ) : relationshipsData.length === 0 ? (
                    <div className="text-[11px] text-slate-500 border border-dashed border-slate-850 p-2 rounded text-center">No links mapped</div>
                  ) : (
                    <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                      {relationshipsData.map((rel: any) => (
                        <div key={rel.id} className="p-2 rounded bg-slate-900/60 border border-slate-850 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-semibold text-slate-300">{rel.name}</span>
                            <span className="text-[9px] text-slate-500 ml-1.5">({rel.relation_type})</span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-950 px-1 py-0.5 rounded">
                            {Math.round(rel.confidence_score * 100)}% Match
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="flex-1 flex flex-col min-h-0">
                  <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Offender Timeline
                  </h3>
                  {isTimelineLoading ? (
                    <div className="text-[11px] text-slate-500 py-1">Loading timeline...</div>
                  ) : timelineData.length === 0 ? (
                    <div className="text-[11px] text-slate-500 border border-dashed border-slate-850 p-2 rounded text-center">No cases mapped</div>
                  ) : (
                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5">
                      {timelineData.map((ev: any) => (
                        <div key={ev.id} className="border-l-2 border-slate-850 pl-3 ml-1.5 relative">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute -left-[4px] top-1" />
                          <div className="text-[9px] text-slate-500 font-semibold">{ev.date}</div>
                          <div className="text-xs font-bold text-slate-200 mt-0.5">{ev.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{ev.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
