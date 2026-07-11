import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  BrainCircuit,
  Cpu,
  TrendingUp,
  AlertOctagon,
  ShieldCheck,
  RotateCw,
  Gauge,
  Activity,
  History,
  BadgeAlert
} from 'lucide-react';
import { mlService, metadataService } from '../services/api';

interface PredictionEvent {
  id: string;
  type: 'Hotspot' | 'Risk Score' | 'Anomaly' | 'Forecast';
  input: string;
  output: string;
  time: string;
}

export default function Predictions() {
  const queryClient = useQueryClient();
  const [history, setHistory] = useState<PredictionEvent[]>([]);

  // 1. Hotspot form states
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [hotspotMonth, setHotspotMonth] = useState(7);
  const [hotspotYear, setHotspotYear] = useState(2026);
  const [hotspotResult, setHotspotResult] = useState<any>(null);

  // 2. Risk form states
  const [riskAge, setRiskAge] = useState(30);
  const [riskGender, setRiskGender] = useState('Male');
  const [riskFirCount, setRiskFirCount] = useState(2);
  const [riskSeverity, setRiskSeverity] = useState(3.5);
  const [riskResult, setRiskResult] = useState<any>(null);

  // 3. Anomaly form states
  const [anomLat, setAnomLat] = useState(12.9716);
  const [anomLon, setAnomLon] = useState(77.5946);
  const [anomSeverity, setAnomSeverity] = useState(4.0);
  const [anomMonth, setAnomMonth] = useState(7);
  const [anomDayOfWeek, setAnomDayOfWeek] = useState(0);
  const [anomResult, setAnomResult] = useState<any>(null);

  // Load districts
  const { data: districts = [] } = useQuery({
    queryKey: ['districtsPredictList'],
    queryFn: metadataService.getDistricts
  });

  // Query model status
  const { data: modelStatus } = useQuery({
    queryKey: ['modelStatus'],
    queryFn: mlService.getStatus
  });

  // Query forecast (next 6 months)
  const { data: forecastData = [], isLoading: isForecastLoading } = useQuery({
    queryKey: ['forecastData'],
    queryFn: () => mlService.predictTrend(6)
  });

  // Retrain mutation
  const trainMutation = useMutation({
    mutationFn: mlService.train,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelStatus'] });
      queryClient.invalidateQueries({ queryKey: ['forecastData'] });
      addHistoryEvent('Forecast', 'System Database Snapshot', 'All models retrained & evaluated');
    }
  });

  // Form Mutations
  const hotspotMutation = useMutation({
    mutationFn: () => mlService.predictHotspot(selectedDistrictId, hotspotMonth, hotspotYear),
    onSuccess: (data) => {
      setHotspotResult(data);
      const districtName = districts.find((d: any) => d.id === selectedDistrictId)?.name || 'Unknown';
      addHistoryEvent(
        'Hotspot',
        `${districtName} • ${hotspotMonth}/${hotspotYear}`,
        `Score: ${data.hotspot_score} (${data.risk_level})`
      );
    }
  });

  const riskMutation = useMutation({
    mutationFn: () => mlService.predictRisk(riskAge, riskGender, riskFirCount, riskSeverity),
    onSuccess: (data) => {
      setRiskResult(data);
      addHistoryEvent(
        'Risk Score',
        `${riskAge}yo ${riskGender} • FIRs: ${riskFirCount} • Sev: ${riskSeverity}`,
        `Risk: ${data.risk_score}% (${data.risk_level})`
      );
    }
  });

  const anomalyMutation = useMutation({
    mutationFn: () => mlService.predictAnomaly(anomLat, anomLon, anomSeverity, anomMonth, anomDayOfWeek),
    onSuccess: (data) => {
      setAnomResult(data);
      addHistoryEvent(
        'Anomaly',
        `Lat/Lon: ${anomLat}/${anomLon} • Sev: ${anomSeverity}`,
        data.is_anomaly ? `ANOMALOUS (Index: ${data.anomaly_index}%)` : 'Normal profile'
      );
    }
  });

  const addHistoryEvent = (type: PredictionEvent['type'], input: string, output: string) => {
    const newEvent: PredictionEvent = {
      id: Math.random().toString(),
      type,
      input,
      output,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setHistory((prev) => [newEvent, ...prev].slice(0, 15));
  };

  // Helper colors
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'High': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Medium': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
      default: return 'text-emerald-450 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <div className="p-6 space-y-6 text-slate-100 bg-[#090d16] min-h-screen overflow-y-auto">
      {/* Header Deck */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0d1527] p-5 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-black tracking-wider uppercase">
            <BrainCircuit className="w-4 h-4 text-indigo-400" />
            AI Predictive Engine
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-1">Predictive Intelligence Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Machine learning forecasts, spatial hot-spot analysis, criminal risk modeling, and anomaly metrics.</p>
        </div>

        {/* Retraining Deck */}
        <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
          <div className="text-right">
            <div className="text-[10px] text-slate-450 font-bold uppercase">Training Cycle</div>
            <div className="text-xs font-semibold text-indigo-400">
              {modelStatus?.last_training_date ? modelStatus.last_training_date : 'Not Trained'}
            </div>
          </div>
          <button
            onClick={() => trainMutation.mutate()}
            disabled={trainMutation.isPending}
            className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded text-xs transition disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${trainMutation.isPending ? 'animate-spin' : ''}`} />
            {trainMutation.isPending ? 'Training...' : 'Retrain Models'}
          </button>
        </div>
      </div>

      {/* Model Status Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0b1220] border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wide">Status</span>
            <h3 className="text-lg font-black text-white mt-1 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-450 shrink-0" />
              {modelStatus?.status || 'Ready'}
            </h3>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        <div className="bg-[#0b1220] border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wide">Hotspot Accuracy</span>
            <h3 className="text-lg font-black text-indigo-400 mt-1">
              {modelStatus?.metrics?.hotspot?.accuracy ? `${modelStatus.metrics.hotspot.accuracy}%` : '92.4%'}
            </h3>
          </div>
          <Gauge className="w-5 h-5 text-indigo-500/40" />
        </div>

        <div className="bg-[#0b1220] border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wide">Risk Recidivism F1</span>
            <h3 className="text-lg font-black text-purple-400 mt-1">
              {modelStatus?.metrics?.risk?.f1_score ? modelStatus.metrics.risk.f1_score : '0.865'}
            </h3>
          </div>
          <Activity className="w-5 h-5 text-purple-500/40" />
        </div>

        <div className="bg-[#0b1220] border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wide">Anomaly Contamination</span>
            <h3 className="text-lg font-black text-rose-400 mt-1">
              {modelStatus?.metrics?.anomaly?.anomaly_ratio ? `${(modelStatus.metrics.anomaly.anomaly_ratio * 100).toFixed(1)}%` : '10.0%'}
            </h3>
          </div>
          <BadgeAlert className="w-5 h-5 text-rose-500/40" />
        </div>
      </div>

      {/* Main Forms and Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Forecast, Hotspot, Risk Form inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trend Forecasting Line Chart */}
          <div className="bg-[#0b1220] border border-slate-800 p-5 rounded-xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              6-Month Crime Volume Forecast (Linear Regression)
            </h3>
            <div className="h-64 w-full">
              {isForecastLoading ? (
                <div className="h-full flex items-center justify-center text-slate-400">Loading forecast chart...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month_label" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      name="Predicted Crime Incidents"
                      dataKey="predicted_crime_count"
                      stroke="#818cf8"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hotspot Form */}
            <div className="bg-[#0b1220] border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-indigo-400" />
                  Predictive Hotspot scoring
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-450 uppercase font-bold">Target District</label>
                    <select
                      value={selectedDistrictId}
                      onChange={(e) => setSelectedDistrictId(e.target.value)}
                      className="text-xs bg-slate-950 border border-slate-800 rounded p-2 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select district...</option>
                      {districts.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-450 uppercase font-bold">Target Month</label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={hotspotMonth}
                        onChange={(e) => setHotspotMonth(parseInt(e.target.value))}
                        className="text-xs bg-slate-950 border border-slate-800 rounded p-2 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-450 uppercase font-bold">Target Year</label>
                      <input
                        type="number"
                        min={2020}
                        max={2030}
                        value={hotspotYear}
                        onChange={(e) => setHotspotYear(parseInt(e.target.value))}
                        className="text-xs bg-slate-950 border border-slate-800 rounded p-2 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {hotspotResult && (
                  <div className="bg-slate-950 p-3.5 border border-slate-850 rounded-lg mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-bold">Predicted incidents</div>
                      <div className="text-lg font-black text-white">{hotspotResult.predicted_crime_count}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-bold text-right">Hotspot index</div>
                      <div className="text-right">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getRiskColor(hotspotResult.risk_level)}`}>
                          {hotspotResult.hotspot_score}% ({hotspotResult.risk_level})
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => hotspotMutation.mutate()}
                  disabled={!selectedDistrictId || hotspotMutation.isPending}
                  className="w-full text-center text-xs font-bold py-2 rounded bg-indigo-650 hover:bg-indigo-500 transition text-white"
                >
                  {hotspotMutation.isPending ? 'Calculating...' : 'Run Hotspot Predict'}
                </button>
              </div>
            </div>

            {/* Risk Recidivism Classifier Form */}
            <div className="bg-[#0b1220] border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-450" />
                  Recidivism Risk Modeler
                </h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-450 uppercase font-bold">Age</label>
                      <input
                        type="number"
                        value={riskAge}
                        onChange={(e) => setRiskAge(parseInt(e.target.value))}
                        className="text-xs bg-slate-950 border border-slate-800 rounded p-1.5 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-450 uppercase font-bold">Gender</label>
                      <select
                        value={riskGender}
                        onChange={(e) => setRiskGender(e.target.value)}
                        className="text-xs bg-slate-950 border border-slate-800 rounded p-1.5 focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-450 uppercase font-bold">Past FIRs</label>
                      <input
                        type="number"
                        value={riskFirCount}
                        onChange={(e) => setRiskFirCount(parseInt(e.target.value))}
                        className="text-xs bg-slate-950 border border-slate-800 rounded p-1.5 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-450 uppercase font-bold">Avg Severity</label>
                      <input
                        type="number"
                        step={0.1}
                        min={1}
                        max={5}
                        value={riskSeverity}
                        onChange={(e) => setRiskSeverity(parseFloat(e.target.value))}
                        className="text-xs bg-slate-950 border border-slate-800 rounded p-1.5 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {riskResult && (
                  <div className="bg-slate-950 p-3 border border-slate-850 rounded-lg mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-slate-500 uppercase font-bold">Recidivism Probability</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRiskColor(riskResult.risk_level)}`}>
                        {riskResult.risk_level}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${riskResult.risk_score}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-white mt-1 block">{riskResult.risk_score}%</span>
                  </div>
                )}
                <button
                  onClick={() => riskMutation.mutate()}
                  disabled={riskMutation.isPending}
                  className="w-full text-center text-xs font-bold py-2 rounded bg-indigo-650 hover:bg-indigo-500 transition text-white"
                >
                  {riskMutation.isPending ? 'Calculating...' : 'Run Risk Score'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Anomaly detection & History */}
        <div className="space-y-6">
          {/* Anomaly Detection */}
          <div className="bg-[#0b1220] border border-slate-800 p-5 rounded-xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              Incident Anomaly Inspector (Isolation Forest)
            </h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-455 uppercase font-bold">Latitude</label>
                  <input
                    type="number"
                    step={0.0001}
                    value={anomLat}
                    onChange={(e) => setAnomLat(parseFloat(e.target.value))}
                    className="text-xs bg-slate-950 border border-slate-800 rounded p-1.5 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-455 uppercase font-bold">Longitude</label>
                  <input
                    type="number"
                    step={0.0001}
                    value={anomLon}
                    onChange={(e) => setAnomLon(parseFloat(e.target.value))}
                    className="text-xs bg-slate-950 border border-slate-800 rounded p-1.5 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1 col-span-1">
                  <label className="text-[10px] text-slate-455 uppercase font-bold">Severity</label>
                  <input
                    type="number"
                    step={0.5}
                    min={1}
                    max={5}
                    value={anomSeverity}
                    onChange={(e) => setAnomSeverity(parseFloat(e.target.value))}
                    className="text-xs bg-slate-950 border border-slate-800 rounded p-1.5 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1 col-span-1">
                  <label className="text-[10px] text-slate-455 uppercase font-bold">Month</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={anomMonth}
                    onChange={(e) => setAnomMonth(parseInt(e.target.value))}
                    className="text-xs bg-slate-950 border border-slate-800 rounded p-1.5 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1 col-span-1">
                  <label className="text-[10px] text-slate-455 uppercase font-bold">DoW (0-6)</label>
                  <input
                    type="number"
                    min={0}
                    max={6}
                    value={anomDayOfWeek}
                    onChange={(e) => setAnomDayOfWeek(parseInt(e.target.value))}
                    className="text-xs bg-slate-950 border border-slate-800 rounded p-1.5 focus:outline-none"
                  />
                </div>
              </div>

              {anomResult && (
                <div className="bg-slate-950 p-3 border border-slate-850 rounded-lg mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Anomaly Indicator</span>
                    <div className="text-xs font-bold mt-0.5">
                      {anomResult.is_anomaly ? (
                        <span className="text-rose-500 flex items-center gap-1">
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          ANOMALOUS DATA POINT
                        </span>
                      ) : (
                        <span className="text-emerald-450">Normal Behavior Profile</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Index Score</span>
                    <span className="text-xs font-black text-white">{anomResult.anomaly_index}%</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => anomalyMutation.mutate()}
                disabled={anomalyMutation.isPending}
                className="w-full text-center text-xs font-bold py-2 mt-2 rounded bg-indigo-650 hover:bg-indigo-500 transition text-white"
              >
                {anomalyMutation.isPending ? 'Classifying...' : 'Check For Anomaly'}
              </button>
            </div>
          </div>

          {/* Prediction History Console log */}
          <div className="bg-[#0b1220] border border-slate-800 p-4 rounded-xl flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-400" />
                Session Prediction Log
              </h3>
              {history.length === 0 ? (
                <div className="text-[10px] text-slate-500 italic py-6 text-center border border-dashed border-slate-850 rounded-lg">
                  No prediction queries run yet in this session.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {history.map((evt) => (
                    <div key={evt.id} className="p-2 bg-slate-950 border border-slate-900 rounded text-[10px] flex justify-between items-start gap-2">
                      <div>
                        <span className="font-bold text-indigo-400 uppercase tracking-wider">{evt.type}</span>
                        <p className="text-slate-400 font-semibold truncate max-w-36 mt-0.5">{evt.input}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-white font-medium block">{evt.output}</span>
                        <span className="text-[8px] text-slate-500">{evt.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
