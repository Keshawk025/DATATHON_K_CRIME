import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Info,
  Shield,
  Phone as PhoneIcon,
  MapPin,
  Car,
  Users,
  User,
  Calendar,
  Layers,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { networkService } from '../services/api';

// Map node types to styles
const NODE_STYLES: Record<string, { bg: string; border: string; icon: any; shape: string }> = {
  criminal: { bg: '#ef4444', border: '#7f1d1d', icon: Shield, shape: 'ellipse' },
  victim: { bg: '#10b981', border: '#064e3b', icon: User, shape: 'ellipse' },
  vehicle: { bg: '#f59e0b', border: '#78350f', icon: Car, shape: 'rectangle' },
  phone: { bg: '#06b6d4', border: '#083344', icon: PhoneIcon, shape: 'diamond' },
  address: { bg: '#8b5cf6', border: '#4c1d95', icon: MapPin, shape: 'round-rectangle' },
  gang: { bg: '#ec4899', border: '#701a75', icon: Users, shape: 'hexagon' }
};

export default function CriminalNetwork() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCriminalId, setSelectedCriminalId] = useState<string>('9a3c001b-4943-490a-a227-8f1c489c223b'); // Somesh Gowda seed UUID
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [relationshipFilter, setRelationshipFilter] = useState<string>('all');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);

  const { data: networkData } = useQuery({
    queryKey: ['criminalNetwork', selectedCriminalId],
    queryFn: () => networkService.getNetwork(selectedCriminalId),
    enabled: !!selectedCriminalId
  });

  const { data: timelineData = [], isLoading: isTimelineLoading } = useQuery({
    queryKey: ['criminalTimeline', selectedNode?.id],
    queryFn: () => networkService.getTimeline(selectedNode.id),
    enabled: !!selectedNode && selectedNode.type === 'criminal'
  });

  const { data: relationshipsData = [], isLoading: isRelationshipsLoading } = useQuery({
    queryKey: ['criminalRelationships', selectedNode?.id],
    queryFn: () => networkService.getRelationships(selectedNode.id),
    enabled: !!selectedNode && selectedNode.type === 'criminal'
  });

  // Handle name/FIR search suggestions
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const matches = await networkService.searchNetwork(searchQuery);
        setSearchSuggestions(matches);
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Lazy load Cytoscape
  useEffect(() => {
    if (!networkData || !containerRef.current) return;

    let isMounted = true;

    // Apply relationship filters
    const filteredEdges = networkData.edges.filter((e: any) => {
      if (relationshipFilter === 'all') return true;
      return e.data.type === relationshipFilter;
    });

    const activeNodeIds = new Set<string>();
    filteredEdges.forEach((e: any) => {
      activeNodeIds.add(e.data.source);
      activeNodeIds.add(e.data.target);
    });

    // Ensure the main criminal is always visible
    activeNodeIds.add(selectedCriminalId);

    const filteredNodes = networkData.nodes.filter((n: any) => {
      if (activeNodeIds.has(n.data.id)) {
        if (riskLevelFilter === 'all' || n.data.type !== 'criminal') return true;
        const score = n.data.risk_score || 0;
        if (riskLevelFilter === 'high') return score >= 75;
        if (riskLevelFilter === 'medium') return score >= 40 && score < 75;
        if (riskLevelFilter === 'low') return score < 40;
      }
      return false;
    });

    import('cytoscape').then((cytoscapeModule) => {
      if (!isMounted) return;
      const cytoscape = cytoscapeModule.default;

      const elements = [
        ...filteredNodes,
        ...filteredEdges
      ];

      const cy = cytoscape({
        container: containerRef.current,
        elements: elements,
        style: [
          {
            selector: 'node',
            style: {
              'label': 'data(label)',
              'color': '#cbd5e1',
              'font-size': '11px',
              'font-family': 'Inter, system-ui, sans-serif',
              'text-valign': 'bottom',
              'text-margin-y': 6,
              'background-color': (ele: any) => NODE_STYLES[ele.data('type')]?.bg || '#94a3b8',
              'border-width': '2px',
              'border-color': (ele: any) => NODE_STYLES[ele.data('type')]?.border || '#475569',
              'shape': (ele: any) => NODE_STYLES[ele.data('type')]?.shape || 'ellipse',
              'width': (ele: any) => ele.data('type') === 'criminal' && ele.data('id') === selectedCriminalId ? 42 : 32,
              'height': (ele: any) => ele.data('type') === 'criminal' && ele.data('id') === selectedCriminalId ? 42 : 32,
              'overlay-opacity': 0.1,
              'overlay-color': '#000'
            } as any
          },
          {
            selector: 'edge',
            style: {
              'label': 'data(label)',
              'color': '#94a3b8',
              'font-size': '8px',
              'text-background-opacity': 0.8,
              'text-background-color': '#090d16',
              'text-background-padding': '3px',
              'text-background-shape': 'roundrectangle',
              'curve-style': 'bezier',
              'target-arrow-shape': 'triangle',
              'target-arrow-color': '#475569',
              'line-color': (ele: any) => {
                const t = ele.data('type');
                if (t === 'shared_fir') return '#cbd5e1';
                if (t === 'shared_phone') return '#06b6d4';
                if (t === 'shared_vehicle') return '#f59e0b';
                if (t === 'shared_address') return '#8b5cf6';
                if (t === 'gang_member') return '#ec4899';
                return '#475569';
              },
              'line-style': (ele: any) => ele.data('type') === 'shared_fir' ? 'dashed' : 'solid',
              'width': (ele: any) => ele.data('type') === 'gang_member' ? 3 : 1.5,
              'arrow-scale': 0.8
            } as any
          },
          {
            selector: 'node:selected',
            style: {
              'border-color': '#3b82f6',
              'border-width': '4px'
            }
          }
        ],
        layout: {
          name: 'cose',
          animate: true,
          nodeOverlap: 20,
          refresh: 20,
          fit: true,
          padding: 30,
          randomize: false,
          componentSpacing: 100,
          nodeRepulsion: () => 400000,
          edgeElasticity: () => 100,
          nestingFactor: 1.2
        } as any
      });

      // Selection Handlers
      cy.on('tap', 'node', (evt: any) => {
        const node = evt.target;
        setSelectedNode({
          id: node.data('id'),
          label: node.data('label'),
          type: node.data('type'),
          properties: node.data()
        });
      });

      cy.on('tap', (evt: any) => {
        if (evt.target === cy) {
          setSelectedNode(null);
        }
      });

      cyRef.current = cy;
    });

    return () => {
      isMounted = false;
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [networkData, relationshipFilter, riskLevelFilter, selectedCriminalId]);

  // Graph Operations
  const handleZoomIn = () => {
    if (cyRef.current) cyRef.current.zoom(cyRef.current.zoom() * 1.2);
  };

  const handleZoomOut = () => {
    if (cyRef.current) cyRef.current.zoom(cyRef.current.zoom() * 0.8);
  };

  const handleFit = () => {
    if (cyRef.current) cyRef.current.fit();
  };

  const handleResetLayout = () => {
    if (cyRef.current) {
      const layout = cyRef.current.layout({ name: 'cose', animate: true });
      layout.run();
    }
  };

  const handleHighlightConnections = () => {
    if (!cyRef.current || !selectedNode) return;
    const cy = cyRef.current;
    const centerNode = cy.getElementById(selectedNode.id);
    
    cy.elements().addClass('dimmed');
    centerNode.removeClass('dimmed');
    centerNode.neighborhood().removeClass('dimmed');
    
    // Custom dimmed style
    cy.style().selector('.dimmed').style({
      'opacity': 0.15
    }).update();
  };

  const handleClearHighlight = () => {
    if (cyRef.current) {
      cyRef.current.elements().removeClass('dimmed');
      cyRef.current.style().selector('.dimmed').style({
        'opacity': 1.0
      }).update();
    }
  };

  const handleExpandOneHop = () => {
    if (selectedNode && selectedNode.type === 'criminal') {
      setSelectedCriminalId(selectedNode.id);
    }
  };

  // Helper to render priority badge
  const renderPriority = (priority: string) => {
    if (priority === 'High') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950 text-red-400 border border-red-800">High</span>;
    }
    if (priority === 'Medium') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-800">Medium</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">Low</span>;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] text-slate-100 bg-[#090d16] overflow-hidden">
      {/* Top Header Filters bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-800 bg-[#0d1527] z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/30">
            <Users className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Criminal Network Link Analysis</h1>
            <p className="text-xs text-slate-400">Map and traverse repeat offender relationships, shared communications, and shared physical addresses.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Relationship Type Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={relationshipFilter}
              onChange={(e) => setRelationshipFilter(e.target.value)}
              className="text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-red-500"
            >
              <option value="all">All Relationships</option>
              <option value="shared_fir">Shared FIR</option>
              <option value="shared_phone">Shared Phone</option>
              <option value="shared_vehicle">Shared Vehicle</option>
              <option value="shared_address">Shared Address</option>
              <option value="associate">Associate</option>
              <option value="family">Family</option>
              <option value="gang_member">Gang Member</option>
            </select>
          </div>

          {/* Risk Level Dropdown */}
          <select
            value={riskLevelFilter}
            onChange={(e) => setRiskLevelFilter(e.target.value)}
            className="text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-red-500"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk (≥75)</option>
            <option value="medium">Medium Risk (40-74)</option>
            <option value="low">Low Risk (&lt;40)</option>
          </select>

          {/* Search Input with Autocomplete Suggestions */}
          <div className="relative">
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded px-2.5 py-1">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search Name or FIR..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="text-xs bg-transparent focus:outline-none w-48 text-white"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchSuggestions([]); }} className="p-0.5 rounded hover:bg-slate-800">
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>

            {/* Suggestions Overlay Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full right-0 mt-1.5 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden z-50">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] text-slate-400 font-semibold bg-slate-950">Matching Profiles</div>
                <div className="max-h-60 overflow-y-auto">
                  {searchSuggestions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedCriminalId(item.id);
                        setSearchQuery('');
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800/80 border-b border-slate-800/30 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">{item.full_name}</div>
                        {item.aliases && <div className="text-[10px] text-slate-400">Alias: {item.aliases}</div>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-red-950/60 text-red-400 px-1 py-0.5 rounded border border-red-900/30">{item.risk_score}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Work Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Graph Panel */}
        <div className="flex-1 flex flex-col relative bg-[#070b13]">
          {/* Action Toolbar overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-1 bg-slate-950/80 backdrop-blur border border-slate-800 p-1.5 rounded-lg z-10 shadow-lg">
            <button onClick={handleZoomIn} title="Zoom In" className="p-1.5 rounded hover:bg-slate-800 text-slate-300">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={handleZoomOut} title="Zoom Out" className="p-1.5 rounded hover:bg-slate-800 text-slate-300">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={handleFit} title="Fit Graph" className="p-1.5 rounded hover:bg-slate-800 text-slate-300">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={handleResetLayout} title="Reset Layout" className="p-1.5 rounded hover:bg-slate-800 text-slate-300 border-r border-slate-800 pr-2">
              <RefreshCw className="w-4 h-4" />
            </button>
            
            {selectedNode && (
              <>
                <button onClick={handleHighlightConnections} title="Highlight One-Hop Neighbors" className="p-1.5 rounded hover:bg-slate-800 text-blue-400 font-semibold text-xs flex items-center gap-1">
                  Highlight
                </button>
                <button onClick={handleClearHighlight} title="Reset Highlights" className="p-1.5 rounded hover:bg-slate-800 text-slate-400 text-xs">
                  Reset
                </button>
                {selectedNode.type === 'criminal' && selectedNode.id !== selectedCriminalId && (
                  <button onClick={handleExpandOneHop} title="Re-center Graph on Node" className="p-1.5 rounded hover:bg-slate-800 text-red-400 font-semibold text-xs border-l border-slate-800 pl-2">
                    Focus Node
                  </button>
                )}
              </>
            )}
          </div>

          {/* Cytoscape Container */}
          <div ref={containerRef} className="flex-1 w-full h-full" />

          {/* Legend Overlay at Bottom */}
          <div className="absolute bottom-4 left-4 bg-slate-950/95 border border-slate-800 p-3 rounded-lg z-10 max-w-sm shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Graph Legend
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-900" />
                Criminal Profile
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-950" />
                Victim Profile
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-yellow-500 border border-yellow-950 rounded-sm" />
                Linked Vehicle
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-cyan-500 border border-cyan-950 transform rotate-45" />
                Linked Phone
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-purple-500 border border-purple-950 rounded-lg" />
                Linked Address
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-pink-500 border border-pink-950 rounded-sm transform skew-x-12" />
                Gang Syndicate
              </div>
            </div>
            <div className="mt-2 border-t border-slate-800/80 pt-2 flex items-center justify-between text-[8px] text-slate-500">
              <span>Solid = Relationship Link</span>
              <span>Dashed = Shared FIR Link</span>
            </div>
          </div>
        </div>

        {/* Right Side: Details / Investigation Panel */}
        <div className="w-96 border-l border-slate-800 bg-[#0b1220] flex flex-col overflow-y-auto">
          {selectedNode ? (
            <div className="p-4 flex-1 flex flex-col">
              {/* Header Profile Title */}
              <div className="pb-3 border-b border-slate-800 flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Entity: {selectedNode.type}
                  </span>
                  <h2 className="text-base font-bold text-white mt-0.5">{selectedNode.label}</h2>
                  {selectedNode.type === 'criminal' && selectedNode.properties.aliases && (
                    <p className="text-xs text-slate-400 mt-0.5">Alias: {selectedNode.properties.aliases}</p>
                  )}
                </div>
                <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-slate-800 rounded">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* CRIMINAL DETAILS VIEW */}
              {selectedNode.type === 'criminal' && (
                <div className="mt-4 flex-1 flex flex-col gap-4">
                  {/* Risk Profile Metric */}
                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold">RISK LEVEL ASSESSMENT</div>
                      <div className="text-lg font-black text-white mt-0.5">{selectedNode.properties.risk_score} <span className="text-xs font-normal text-slate-500">/ 100</span></div>
                    </div>
                    {renderPriority(selectedNode.properties.risk_score >= 80 ? 'High' : selectedNode.properties.risk_score >= 50 ? 'Medium' : 'Low')}
                  </div>

                  {/* Profile info fields */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                    <div>
                      <span className="text-slate-500 block">Age / Gender</span>
                      <span className="font-medium text-slate-200 mt-0.5 block">{selectedNode.properties.age} yrs / {selectedNode.properties.gender}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Repeat Offender</span>
                      <span className="font-medium text-slate-200 mt-0.5 block flex items-center gap-1">
                        {selectedNode.properties.repeat_offender ? (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-amber-400 font-bold">Yes (Flagged)</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>No</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Direct relationships drilldown */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Known Associates ({relationshipsData.length})
                    </h3>
                    {isRelationshipsLoading ? (
                      <div className="text-xs text-slate-500 py-2">Loading relations...</div>
                    ) : relationshipsData.length === 0 ? (
                      <div className="text-xs text-slate-500 py-2 border border-dashed border-slate-800 rounded text-center">No documented associates</div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                        {relationshipsData.map((rel: any) => (
                          <div key={rel.id} className="p-2 rounded bg-slate-900 border border-slate-800/50 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-semibold text-slate-300">{rel.name}</span>
                              <span className="text-[10px] text-slate-500 ml-2">({rel.relation_type})</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">
                              {intConfidence(rel.confidence_score)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Activity Timeline */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Timeline of Activities ({timelineData.length})
                    </h3>
                    {isTimelineLoading ? (
                      <div className="text-xs text-slate-500 py-2">Loading timeline...</div>
                    ) : timelineData.length === 0 ? (
                      <div className="text-xs text-slate-500 py-2 border border-dashed border-slate-800 rounded text-center">No recorded activity</div>
                    ) : (
                      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
                        {timelineData.map((ev: any) => (
                          <div key={ev.id} className="border-l-2 border-slate-700 pl-3.5 ml-2 relative">
                            <span className="w-2 h-2 rounded-full bg-red-500 absolute -left-[5px] top-1" />
                            <div className="text-[9px] text-slate-500 font-semibold">{ev.date}</div>
                            <div className="text-xs font-bold text-slate-200 mt-0.5">{ev.title}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{ev.description}</div>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="text-[9px] bg-slate-900 border border-slate-850 px-1 py-0.5 rounded text-slate-400">
                                Severity: {ev.severity} / 5
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* NON-CRIMINAL DETAILS VIEW */}
              {selectedNode.type !== 'criminal' && (
                <div className="mt-4 flex-1 flex flex-col gap-4 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      System Properties
                    </h4>
                    <div className="flex flex-col gap-2">
                      {selectedNode.type === 'phone' && (
                        <>
                          <div className="flex justify-between border-b border-slate-800 pb-1">
                            <span className="text-slate-500">Phone Number</span>
                            <span className="text-slate-300 font-medium">{selectedNode.properties.label}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Registered Owner</span>
                            <span className="text-slate-300 font-medium">{selectedNode.properties.owner_name}</span>
                          </div>
                        </>
                      )}
                      {selectedNode.type === 'vehicle' && (
                        <>
                          <div className="flex justify-between border-b border-slate-800 pb-1">
                            <span className="text-slate-500">Registration Number</span>
                            <span className="text-slate-300 font-medium">{selectedNode.properties.label}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-1">
                            <span className="text-slate-500">Model</span>
                            <span className="text-slate-300 font-medium">{selectedNode.properties.model}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Color</span>
                            <span className="text-slate-300 font-medium">{selectedNode.properties.color}</span>
                          </div>
                        </>
                      )}
                      {selectedNode.type === 'address' && (
                        <>
                          <div className="flex justify-between border-b border-slate-800 pb-1">
                            <span className="text-slate-500">Street</span>
                            <span className="text-slate-300 font-medium">{selectedNode.properties.label}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">City / District</span>
                            <span className="text-slate-300 font-medium">{selectedNode.properties.city}</span>
                          </div>
                        </>
                      )}
                      {selectedNode.type === 'victim' && (
                        <>
                          <div className="flex justify-between border-b border-slate-800 pb-1">
                            <span className="text-slate-500">Full Name</span>
                            <span className="text-slate-300 font-medium">{selectedNode.properties.label}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-1">
                            <span className="text-slate-500">Age / Gender</span>
                            <span className="text-slate-300 font-medium">{selectedNode.properties.age} yrs / {selectedNode.properties.gender}</span>
                          </div>
                        </>
                      )}
                      {selectedNode.type === 'gang' && (
                        <>
                          <div className="flex justify-between border-b border-slate-800 pb-1">
                            <span className="text-slate-500">Name</span>
                            <span className="text-slate-300 font-medium">{selectedNode.properties.label}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Remarks</span>
                            <span className="text-slate-300 font-medium">{selectedNode.properties.description}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3 border border-dashed border-slate-800 rounded bg-slate-950/40 text-slate-400">
                    <p className="leading-relaxed">
                      This entity was resolved using multi-hop links registered across Karnataka State Police database indexes. Click on connected Criminal nodes to explore profiles or initiate an action.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="p-4 rounded-full bg-slate-900 border border-slate-800 mb-3 text-slate-500">
                <Info className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-300">Select a Graph Node</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                Click on any node in the network to inspect aliases, risk scores, linked cases, and timeline events.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to convert float confidence (0-1) to percent int
function intConfidence(score: any) {
  if (typeof score !== 'number') return 100;
  return Math.round(score * 100);
}
