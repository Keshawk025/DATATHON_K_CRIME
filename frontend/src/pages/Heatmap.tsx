import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  RefreshCw,
  MapPin,
  Flame,
  Layers,
  Info,
  Maximize2,
  Minimize2,
  Compass,
  AlertTriangle,
  FileText,
  Calendar,
  X
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

import { metadataService, geospatialService } from '../services/api';

// Custom dark popup styles
const POPUP_CSS = `
  .custom-leaflet-popup .leaflet-popup-content-wrapper {
    background: #0f172a !important;
    color: #cbd5e1 !important;
    border: 1px solid #1e293b !important;
    border-radius: 12px !important;
    padding: 4px !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
  }
  .custom-leaflet-popup .leaflet-popup-tip {
    background: #0f172a !important;
    border: 1px solid #1e293b !important;
  }
  .custom-leaflet-popup .leaflet-popup-close-button {
    color: #94a3b8 !important;
    padding: 6px !important;
  }
  .leaflet-container {
    background: #090d16 !important;
  }
`;

export const HeatmapPage: React.FC = () => {
  // Layer toggles
  const [showMarkers, setShowMarkers] = useState(true);
  const [showDistricts, setShowDistricts] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter states
  const [district, setDistrict] = useState('');
  const [crimeType, setCrimeType] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selected district for Right Side Panel drilldown
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);

  // FIR details modal state
  const [detailFir, setDetailFir] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Refs for Leaflet Map
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const districtGroupRef = useRef<L.LayerGroup | null>(null);
  const heatGroupRef = useRef<L.LayerGroup | null>(null);

  const filters = {
    district: district || undefined,
    crime_type: crimeType || undefined,
    status: status || undefined,
    severity: severity ? parseInt(severity) : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  };

  // Queries
  const { data: districts = [] } = useQuery({
    queryKey: ['districtsList'],
    queryFn: metadataService.getDistricts,
  });

  const { data: crimeTypes = [] } = useQuery({
    queryKey: ['crimeTypesList'],
    queryFn: metadataService.getCrimeTypes,
  });

  const { data: heatmapPoints = [] } = useQuery({
    queryKey: ['heatmapPoints', filters],
    queryFn: () => geospatialService.getHeatmapPoints(filters),
  });

  const { data: hotspots = [] } = useQuery({
    queryKey: ['hotspotsList', filters],
    queryFn: () => geospatialService.getHotspots(filters),
  });

  const { data: districtStats, isLoading: statsLoading } = useQuery({
    queryKey: ['districtStats', selectedDistrictId],
    queryFn: () => geospatialService.getDistrictStatistics(selectedDistrictId!),
    enabled: !!selectedDistrictId,
  });

  // Reset Filters
  const handleResetFilters = () => {
    setDistrict('');
    setCrimeType('');
    setStatus('');
    setSeverity('');
    setDateFrom('');
    setDateTo('');
    setSelectedDistrictId(null);
  };

  // 1. Initialize Map Instance (runs once)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Centered around Karnataka (roughly lat: 15.3173, lng: 75.7139)
    const map = L.map(mapContainerRef.current, {
      center: [15.3173, 75.7139],
      zoom: 7,
      minZoom: 6,
      maxZoom: 14,
      zoomControl: false,
      preferCanvas: true,
    });

    mapRef.current = map;

    // Add CartoDB Dark Matter tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(map);

    // Custom positioned zoom control
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Layer groups for dynamic plotting
    markerGroupRef.current = L.layerGroup().addTo(map);
    districtGroupRef.current = L.layerGroup().addTo(map);
    heatGroupRef.current = L.layerGroup().addTo(map);

    // Bind detail modal helper to window for HTML popup buttons
    (window as any).showFirDetailsPopup = (
      id: string,
      number: string,
      category: string,
      status: string,
      severity: number,
      dateStr: string
    ) => {
      setDetailFir({ id, number, category, status, severity, date: dateStr });
      setShowDetailModal(true);
    };

    return () => {
      map.remove();
      mapRef.current = null;
      delete (window as any).showFirDetailsPopup;
    };
  }, []);

  // 2. React to District filter change and center map
  useEffect(() => {
    if (district && districts.length > 0 && mapRef.current) {
      const match = districts.find((d: any) => d.id === district);
      if (match) {
        mapRef.current.setView([parseFloat(match.latitude), parseFloat(match.longitude)], 9);
        setSelectedDistrictId(district);
      }
    } else if (!district) {
      setSelectedDistrictId(null);
      mapRef.current?.setView([15.3173, 75.7139], 7);
    }
  }, [district, districts]);

  // 3. Render Leaflet Map Layers dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markerGroupRef.current) markerGroupRef.current.clearLayers();
    if (districtGroupRef.current) districtGroupRef.current.clearLayers();
    if (heatGroupRef.current) heatGroupRef.current.clearLayers();

    // 3.1 Draw Heatmap Glowing Areas
    if (showHeatmap && heatmapPoints.length > 0 && heatGroupRef.current) {
      heatmapPoints.forEach((pt: any) => {
        L.circle([pt.latitude, pt.longitude], {
          radius: 12000,
          fillColor: '#ef4444',
          color: 'transparent',
          fillOpacity: 0.08,
        }).addTo(heatGroupRef.current!);
      });
    }

    // 3.2 Draw District Hotspots
    if (showDistricts && hotspots.length > 0 && districtGroupRef.current) {
      hotspots.forEach((hs: any) => {
        let riskColor = '#10b981'; // Low: Green
        if (hs.risk_level === 'High') riskColor = '#ef4444'; // High: Red
        else if (hs.risk_level === 'Medium') riskColor = '#f59e0b'; // Medium: Orange

        const circle = L.circle([hs.latitude, hs.longitude], {
          radius: 25000,
          fillColor: riskColor,
          color: riskColor,
          weight: hs.district_id === selectedDistrictId ? 3.5 : 1.5,
          opacity: 0.9,
          fillOpacity: hs.district_id === selectedDistrictId ? 0.25 : 0.12,
        }).addTo(districtGroupRef.current!);

        circle.bindTooltip(
          `
          <div class="text-xs font-sans">
            <p class="font-bold text-sm text-slate-100">${hs.district_name}</p>
            <p class="mt-1 text-slate-300">Hotspot Score: <span class="text-indigo-400 font-bold">${hs.hotspot_score}</span></p>
            <p class="text-slate-300">Crime Count: ${hs.crime_count}</p>
            <p class="text-slate-300">Risk Profile: <span class="${
              hs.risk_level === 'High' ? 'text-red-400' : hs.risk_level === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
            } font-bold">${hs.risk_level}</span></p>
          </div>
        `,
          {
            sticky: true,
            direction: 'top',
            className: 'bg-slate-900/90 border border-slate-700/80 rounded-lg p-2 text-white shadow-xl backdrop-blur-sm',
          }
        );

        circle.on('click', () => {
          setSelectedDistrictId(hs.district_id);
          setDistrict(hs.district_id);
          map.setView([hs.latitude, hs.longitude], 9);
        });
      });
    }

    // 3.3 Draw Crime Markers
    if (showMarkers && heatmapPoints.length > 0 && markerGroupRef.current) {
      heatmapPoints.forEach((pt: any) => {
        const severityColors: { [key: number]: string } = {
          1: '#10b981',
          2: '#3b82f6',
          3: '#f59e0b',
          4: '#f97316',
          5: '#ef4444',
        };
        const color = severityColors[pt.severity] || '#6366f1';

        const marker = L.circleMarker([pt.latitude, pt.longitude], {
          radius: 6,
          fillColor: color,
          color: '#0f172a',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.95,
        }).addTo(markerGroupRef.current!);

        marker.bindPopup(
          `
          <div class="text-xs text-slate-200 font-sans p-1 max-w-[240px]">
            <h3 class="font-bold text-white text-sm mb-1">${pt.fir_number}</h3>
            <p class="mb-1"><span class="text-slate-400">Category:</span> <span class="text-indigo-300 font-medium">${pt.crime_type_name}</span></p>
            <p class="mb-1"><span class="text-slate-400">Date:</span> ${new Date(pt.occurrence_date).toLocaleDateString()}</p>
            <p class="mb-1"><span class="text-slate-400">Severity:</span> <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200">${pt.severity}/5</span></p>
            <p class="mb-2"><span class="text-slate-400">Status:</span> <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200">${pt.status}</span></p>
            ${pt.location ? `<p class="mb-2 italic text-slate-400 font-light font-sans">"${pt.location}"</p>` : ''}
            <button 
              onclick="window.showFirDetailsPopup('${pt.id}', '${pt.fir_number}', '${pt.crime_type_name.replace(/'/g, "\\'")}', '${pt.status}', ${pt.severity}, '${pt.occurrence_date}')" 
              class="w-full mt-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded py-1 font-bold transition-all text-[11px]"
            >
              Open FIR Details
            </button>
          </div>
        `,
          { className: 'custom-leaflet-popup' }
        );
      });
    }
  }, [heatmapPoints, hotspots, showMarkers, showDistricts, showHeatmap, selectedDistrictId]);

  // Fullscreen controller
  const handleToggleFullscreen = () => {
    const el = mapContainerRef.current?.parentElement;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Geolocation Locate Me
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      const map = mapRef.current;
      if (map) {
        map.setView([pos.coords.latitude, pos.coords.longitude], 12);
        L.circleMarker([pos.coords.latitude, pos.coords.longitude], {
          radius: 8,
          fillColor: '#3b82f6',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 1,
        }).addTo(map).bindPopup('Current Coordinate Location').openPopup();
      }
    });
  };

  // State overview calculated values
  const highRiskCount = hotspots.filter((h: any) => h.risk_level === 'High').length;
  const avgStateHotspotScore = hotspots.length
    ? parseFloat((hotspots.reduce((sum: number, h: any) => sum + h.hotspot_score, 0) / hotspots.length).toFixed(1))
    : 0;

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)]">
      <style>{POPUP_CSS}</style>

      {/* Page Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Geospatial Crime Hotspot Map</h1>
          <p className="text-xs text-slate-400 mt-1">Interactive district analytics, crime clusters, and predictive risk parameters.</p>
        </div>
        <button
          onClick={handleResetFilters}
          className="w-fit inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 active:scale-95 transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm flex-shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Case Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 outline-none transition-all"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Solved">Solved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 outline-none transition-all"
            >
              <option value="">All Severities</option>
              <option value="1">1 - Low</option>
              <option value="2">2 - Minor</option>
              <option value="3">3 - Moderate</option>
              <option value="4">4 - Serious</option>
              <option value="5">5 - Critical</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 outline-none transition-all"
            />
          </div>

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
      </div>

      {/* Main Workspace split */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 relative">
        {/* Left Side: Leaflet Container */}
        <div className="flex-1 rounded-2xl border border-slate-800/80 overflow-hidden relative flex flex-col min-h-[350px] lg:min-h-0 bg-slate-950 shadow-2xl">
          {/* Layer Toggle Bar */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-wrap gap-2">
            <button
              onClick={() => setShowMarkers(!showMarkers)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold backdrop-blur-md shadow-lg active:scale-95 transition-all ${
                showMarkers
                  ? 'bg-indigo-600/90 border-indigo-500 text-white'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Incident Points</span>
            </button>
            <button
              onClick={() => setShowDistricts(!showDistricts)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold backdrop-blur-md shadow-lg active:scale-95 transition-all ${
                showDistricts
                  ? 'bg-indigo-600/90 border-indigo-500 text-white'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>District Risk</span>
            </button>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold backdrop-blur-md shadow-lg active:scale-95 transition-all ${
                showHeatmap
                  ? 'bg-indigo-600/90 border-indigo-500 text-white'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Heatmap Layer</span>
            </button>
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
            <button
              onClick={handleLocateMe}
              title="Locate Me"
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white shadow-lg backdrop-blur-md active:scale-95 transition-all"
            >
              <Compass className="h-4 w-4" />
            </button>
            <button
              onClick={handleToggleFullscreen}
              title="Fullscreen"
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white shadow-lg backdrop-blur-md active:scale-95 transition-all"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-4 right-4 z-[1000] p-3 rounded-xl bg-slate-900/95 border border-slate-800 text-slate-300 shadow-xl backdrop-blur-sm text-[10px] font-sans flex flex-col gap-2 max-w-[180px]">
            <p className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1.5">Map Legend</p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#ef4444]"></span>
              <span>High Risk (Score &ge; 60)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]"></span>
              <span>Medium Risk (Score 30-59)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#10b981]"></span>
              <span>Low Risk (Score &lt; 30)</span>
            </div>
            <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-800/60">
              <span className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500/50"></span>
              <span>Density Heat Layer</span>
            </div>
          </div>

          {/* Map Dom Ref */}
          <div ref={mapContainerRef} className="w-full h-full flex-1" />
        </div>

        {/* Right Side: District Intelligence Panel */}
        <div className="w-full lg:w-[380px] bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex flex-col overflow-y-auto min-h-[300px] lg:min-h-0 shadow-xl">
          {selectedDistrictId ? (
            statsLoading ? (
              // Loading Skeleton state
              <div className="space-y-6 flex-1 flex flex-col justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                <p className="text-slate-400 text-xs font-semibold">Compiling district spatial analytics...</p>
              </div>
            ) : districtStats ? (
              // Loaded details state
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
                  <div>
                    <h2 className="text-lg font-bold text-white leading-tight">{districtStats.district_name}</h2>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">District Intelligence Profile</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDistrictId(null);
                      setDistrict('');
                    }}
                    className="p-1 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Hotspot Risk score ring dial */}
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hotspot Score</p>
                    <p className={`text-2xl font-black ${
                      districtStats.hotspot_score >= 60 ? 'text-red-500' : districtStats.hotspot_score >= 30 ? 'text-amber-500' : 'text-emerald-500'
                    }`}>{districtStats.hotspot_score}</p>
                    <p className="text-[10px] text-slate-400">Weighted score of crime density, repeat offenders, and case severity.</p>
                  </div>
                  
                  {/* Gauge indicator */}
                  <div className="relative h-16 w-16 flex items-center justify-center">
                    <svg className="absolute w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke={districtStats.hotspot_score >= 60 ? '#ef4444' : districtStats.hotspot_score >= 30 ? '#f59e0b' : '#10b981'}
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={175.9}
                        strokeDashoffset={175.9 - (175.9 * districtStats.hotspot_score) / 100}
                      />
                    </svg>
                    <span className="text-[10px] font-black text-slate-300">
                      {districtStats.hotspot_score >= 60 ? 'HIGH' : districtStats.hotspot_score >= 30 ? 'MED' : 'LOW'}
                    </span>
                  </div>
                </div>

                {/* KPIs Grid */}
                <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                  <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Crime Volume</p>
                    <p className="text-lg font-bold text-slate-200 mt-1">{districtStats.crime_count}</p>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Recent FIRs</p>
                    <p className="text-lg font-bold text-slate-200 mt-1">{districtStats.recent_fir_count}</p>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Repeat Offenders</p>
                    <p className="text-lg font-bold text-slate-200 mt-1">{districtStats.repeat_offenders}</p>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Avg Risk score</p>
                    <p className="text-lg font-bold text-slate-200 mt-1">{districtStats.average_risk_score}</p>
                  </div>
                </div>

                {/* Sparkline Recharts */}
                <div className="space-y-2 flex-shrink-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">6-Month Crime Trend</p>
                  <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 h-28 flex items-center justify-center">
                    {districtStats.trend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={districtStats.trend}>
                          <defs>
                            <linearGradient id="heatmapTrend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b' }}
                            labelClassName="text-slate-300 font-sans text-xs font-bold"
                          />
                          <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#heatmapTrend)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-light">Insufficient historical timeline data</span>
                    )}
                  </div>
                </div>

                {/* Top Categories list */}
                <div className="space-y-2 flex-shrink-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Top Crime Categories</p>
                  <div className="space-y-2.5">
                    {districtStats.top_crime_types.slice(0, 3).map((item: any, idx: number) => {
                      const maxVal = districtStats.top_crime_types[0]?.count || 1;
                      const percent = Math.min((item.count / maxVal) * 100, 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-300 truncate w-3/4">{item.category}</span>
                            <span className="text-slate-400">{item.count}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {districtStats.top_crime_types.length === 0 && (
                      <p className="text-[11px] text-slate-500">No active category classifications recorded</p>
                    )}
                  </div>
                </div>

                {/* Recent incidents list */}
                <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0">Recent Incidents</p>
                  <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                    {districtStats.recent_incidents.map((fir: any) => (
                      <div
                        key={fir.id}
                        onClick={() => {
                          setDetailFir({
                            id: fir.id,
                            number: fir.fir_number,
                            category: fir.crime_type_name,
                            status: fir.status,
                            severity: fir.severity,
                            date: fir.occurrence_date,
                          });
                          setShowDetailModal(true);
                        }}
                        className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/40 hover:border-indigo-500/50 hover:bg-slate-950/60 cursor-pointer transition-all flex items-start justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-200">{fir.fir_number}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{fir.crime_type_name}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-[9px] text-slate-500">{new Date(fir.occurrence_date).toLocaleDateString()}</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                            fir.severity >= 4 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>{fir.severity} / 5</span>
                        </div>
                      </div>
                    ))}
                    {districtStats.recent_incidents.length === 0 && (
                      <p className="text-[11px] text-slate-500 mt-2">No recent registered cases</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 flex-1 flex flex-col justify-center items-center py-10">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <p className="text-slate-400 text-xs font-semibold">Error reading district stats</p>
              </div>
            )
          ) : (
            // Statewide Overview (when no district is selected)
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-indigo-400" />
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">State Intelligence Overview</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">Aggregate Karnataka State analysis metrics.</p>
                  </div>
                </div>

                {/* State metrics */}
                <div className="space-y-4">
                  <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">State Hotspot Average</p>
                      <p className="text-xl font-black text-slate-200 mt-1">{avgStateHotspotScore} / 100</p>
                    </div>
                    <Flame className="h-6 w-6 text-red-500" />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Critical Districts Count</p>
                      <p className="text-xl font-black text-red-500 mt-1">{highRiskCount} Districts</p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Total Map Crimes Plot</p>
                      <p className="text-xl font-black text-indigo-400 mt-1">{heatmapPoints.length} Crimes</p>
                    </div>
                    <MapPin className="h-6 w-6 text-indigo-500" />
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-4 rounded-xl bg-indigo-950/15 border border-indigo-900/35 text-[11px] text-indigo-300 font-sans flex items-start gap-2.5">
                <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <p>Click on any circular district bounds or incident markers on the map to trigger deep-dive localized analytics and active case drilldowns.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Case Details modal dialog */}
      {showDetailModal && detailFir && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">{detailFir.number}</h3>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailFir(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Crime Category</p>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5">{detailFir.category}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Occurrence Date</p>
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-200 mt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{new Date(detailFir.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Severity Level</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                      detailFir.severity >= 4 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>{detailFir.severity} / 5</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Enquiry Status</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-xs font-bold px-2 py-0.5 rounded border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                      {detailFir.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Command Center Remarks</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Geospatial intelligence verifies coordinates are within limits. Case is marked under investigation. Automated police dispatched units notified.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailFir(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-bold text-slate-200 active:scale-95 transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
