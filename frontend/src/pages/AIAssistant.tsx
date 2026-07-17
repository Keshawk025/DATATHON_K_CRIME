import { useState, useEffect, useRef, type ReactElement } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

import {
  MessageSquare,
  Send,
  Trash2,
  Copy,
  Check,
  Brain,
  ShieldAlert,
  HelpCircle,
  FileText,
  Map,
  TrendingUp,
  UserCheck,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { aiService, metadataService, networkService } from '../services/api';

// Axios removed, using static data

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: 'chat' | 'fir' | 'district' | 'investigation' | 'trend';
}

const SUGGESTED_QUESTIONS = [
  "Show cybercrime trends in Mysuru.",
  "Which district has the highest repeat offenders?",
  "Summarize FIR 2026-0002.",
  "Explain why Bengaluru Urban is high risk.",
  "Generate investigation recommendations for Somesh Gowda.",
  "Show vehicle theft patterns.",
  "Compare Bengaluru and Mysuru.",
  "List high-risk criminals."
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "## Summary\nWelcome to CrimeMind AI Copilot. I am synced with the Karnataka State Police central database repository. You can query me using natural language to summarize cases, analyze regional hotspots, model repeat offender trends, or generate tactical surveillance recommendations.\n\n## Key Findings\n- **Database Connectivity**: Online & Sync-locked\n- **Regional Hotspots**: Bengaluru Urban & Mysuru currently present elevated risk indexes\n- **Target Profiles**: Somesh Gowda and Ketan Shah are flagged under high-priority active watchlists\n\n## Recommendations\nUse the Suggested Questions below or the one-click summarization tools on the left to initiate targeted analyses.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'chat'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Summarization Drilldown Selectors
  const [selectedFirId, setSelectedFirId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedCriminalId, setSelectedCriminalId] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Queries for selectors
  const { data: districts = [] } = useQuery({
    queryKey: ['districtsList'],
    queryFn: metadataService.getDistricts
  });

  const { data: criminalsList = [] } = useQuery({
    queryKey: ['criminalsRepeatList'],
    queryFn: async () => {
      const response = await networkService.getRepeatOffenders({});
      return response;
    }
  });

  const [firsList, setFirsList] = useState<any[]>([]);

  // Fetch FIRs list (mocked)
  useEffect(() => {
    setFirsList([
      { id: '1', fir_number: '2026-0001', location: 'Bengaluru Urban' },
      { id: '2', fir_number: '2026-0002', location: 'Mysuru' },
      { id: '3', fir_number: '2026-0003', location: 'Hubballi' },
    ]);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mutations
  const chatMutation = useMutation({
    mutationFn: async (payload: { message: string; history: any[] }) => {
      return aiService.chat(payload.message, payload.history);
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'chat'
        }
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "## Summary\nFailed to process request.\n\n## Key Findings\nAn error occurred while connecting to the Gemini intelligence engine. Please check your network connection and ensure your API key is correctly configured.\n\n## Confidence Notes\n0% confidence - connection failed.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  });

  const summaryMutation = useMutation({
    mutationFn: async (payload: { type: 'fir' | 'district' | 'investigation' | 'trend'; id?: string }) => {
      if (payload.type === 'fir') {
        return { text: await aiService.getFIRSummary(payload.id!), type: 'fir' as const };
      }
      if (payload.type === 'district') {
        return { text: await aiService.getDistrictSummary(payload.id!), type: 'district' as const };
      }
      if (payload.type === 'investigation') {
        return { text: await aiService.getInvestigationPlan(payload.id!), type: 'investigation' as const };
      }
      return { text: await aiService.getTrendAnalysis(payload.id), type: 'trend' as const };
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: data.type
        }
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "## Summary\nFailed to generate the structured profile summary.\n\n## Key Findings\nThe backend summary generator responded with an internal validation error.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  });

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'chat'
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');

    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role,
        content: m.content
      }));

    chatMutation.mutate({ message: text, history });
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: "## Summary\nConversation history has been cleared. How can I assist your investigation now?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Custom Markdown Parser
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('## ')) {
        const title = trimmed.replace('## ', '');
        return (
          <h3 key={idx} className="text-xs font-black tracking-wider uppercase text-indigo-400 mt-4 mb-2 pb-1 border-b border-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            {title}
          </h3>
        );
      }
      
      if (trimmed.startsWith('- ')) {
        const item = trimmed.replace('- ', '');
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts: (string | ReactElement)[] = [];
        let lastIndex = 0;
        let match;
        
        while ((match = boldRegex.exec(item)) !== null) {
          if (match.index > lastIndex) {
            parts.push(item.substring(lastIndex, match.index));
          }
          parts.push(<strong key={match.index} className="text-white font-semibold">{match[1]}</strong>);
          lastIndex = boldRegex.lastIndex;
        }
        
        if (lastIndex < item.length) {
          parts.push(item.substring(lastIndex));
        }

        return (
          <li key={idx} className="list-none pl-4 relative text-[11px] leading-relaxed text-slate-300 mt-1 mb-1">
            <span className="absolute left-1 top-2 w-1 h-1 rounded-full bg-indigo-500" />
            {parts.length > 0 ? parts : item}
          </li>
        );
      }

      const numberedRegex = /^(\d+)\.\s(.*)/;
      const numberedMatch = trimmed.match(numberedRegex);
      if (numberedMatch) {
        return (
          <div key={idx} className="pl-4 text-[11px] leading-relaxed text-slate-350 mt-1.5 flex gap-2">
            <span className="font-bold text-indigo-400">{numberedMatch[1]}.</span>
            <span>{numberedMatch[2]}</span>
          </div>
        );
      }

      if (trimmed.includes('**')) {
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts: (string | ReactElement)[] = [];
        let lastIndex = 0;
        let match;
        
        while ((match = boldRegex.exec(trimmed)) !== null) {
          if (match.index > lastIndex) {
            parts.push(trimmed.substring(lastIndex, match.index));
          }
          parts.push(<strong key={match.index} className="text-white font-bold">{match[1]}</strong>);
          lastIndex = boldRegex.lastIndex;
        }
        
        if (lastIndex < trimmed.length) {
          parts.push(trimmed.substring(lastIndex));
        }
        return <p key={idx} className="text-[11px] leading-relaxed text-slate-300 my-1">{parts}</p>;
      }

      if (trimmed === '') return <div key={idx} className="h-2" />;

      return <p key={idx} className="text-[11px] leading-relaxed text-slate-300 my-1">{trimmed}</p>;
    });
  };

  const isGenerating = chatMutation.isPending || summaryMutation.isPending;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] text-slate-100 bg-[#090d16] overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 bg-[#0d1527] flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-800/30">
            <Brain className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">CrimeMind AI Assistant</h1>
            <p className="text-xs text-slate-400">Generate investigation next-steps, analyze crime trends, and summarize cases using natural language processing.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Rapid Action Summarization Deck */}
        <div className="w-80 border-r border-slate-800 bg-[#0b1220] p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">AI Query Toolbox</h3>
          </div>

          {/* FIR Summarization Selector */}
          <div className="flex flex-col gap-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Summarize Case File (FIR)
            </label>
            <select
              value={selectedFirId}
              onChange={(e) => setSelectedFirId(e.target.value)}
              className="text-xs bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 focus:outline-none"
            >
              <option value="">Select Case FIR...</option>
              {firsList.map((fir) => (
                <option key={fir.id} value={fir.id}>{fir.fir_number} - {fir.location}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (selectedFirId) summaryMutation.mutate({ type: 'fir', id: selectedFirId });
              }}
              disabled={!selectedFirId || isGenerating}
              className="w-full text-center text-xs font-semibold py-1.5 mt-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 transition text-white"
            >
              Summarize FIR
            </button>
          </div>

          {/* District Summary Selector */}
          <div className="flex flex-col gap-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Map className="w-3.5 h-3.5 text-slate-400" />
              Regional Security Assessment
            </label>
            <select
              value={selectedDistrictId}
              onChange={(e) => setSelectedDistrictId(e.target.value)}
              className="text-xs bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 focus:outline-none"
            >
              <option value="">Select District...</option>
              {districts.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (selectedDistrictId) summaryMutation.mutate({ type: 'district', id: selectedDistrictId });
              }}
              disabled={!selectedDistrictId || isGenerating}
              className="w-full text-center text-xs font-semibold py-1.5 mt-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 transition text-white"
            >
              Analyze District
            </button>
          </div>

          {/* Investigation Planner Selector */}
          <div className="flex flex-col gap-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              Offender Profile Strategy
            </label>
            <select
              value={selectedCriminalId}
              onChange={(e) => setSelectedCriminalId(e.target.value)}
              className="text-xs bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 focus:outline-none"
            >
              <option value="">Select Criminal Profile...</option>
              {criminalsList.map((crim: any) => (
                <option key={crim.id} value={crim.id}>{crim.full_name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (selectedCriminalId) summaryMutation.mutate({ type: 'investigation', id: selectedCriminalId });
              }}
              disabled={!selectedCriminalId || isGenerating}
              className="w-full text-center text-xs font-semibold py-1.5 mt-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 transition text-white"
            >
              Plan Investigation
            </button>
          </div>

          {/* Trend Analysis Trigger */}
          <div className="flex flex-col gap-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              General Trend Explainer
            </label>
            <button
              onClick={() => {
                summaryMutation.mutate({ type: 'trend' });
              }}
              disabled={isGenerating}
              className="w-full text-center text-xs font-semibold py-1.5 mt-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 transition text-white"
            >
              Generate Trend Analysis
            </button>
          </div>

          {/* Info Card */}
          <div className="mt-auto p-3 bg-slate-950 border border-slate-850 rounded-lg text-[10px] text-slate-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              CrimeMind AI operates under KSP security guidelines. All queries are audited and matched against active criminal profiles and geo-fenced boundaries.
            </p>
          </div>
        </div>

        {/* Right Side: Chat Window */}
        <div className="flex-1 flex flex-col bg-[#070b13] overflow-hidden">
          {/* Top chat menu */}
          <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-450 font-bold">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              Active AI Terminal
            </div>
            <button onClick={handleClear} className="p-1 hover:bg-slate-900 text-slate-450 hover:text-red-400 rounded transition flex items-center gap-1 text-[10px] font-semibold border border-slate-800 bg-slate-950/40">
              <Trash2 className="w-3 h-3" />
              Clear Console
            </button>
          </div>

          {/* Chat Messages Frame */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl border p-4 ${isUser ? 'bg-indigo-600/10 border-indigo-500/20 text-slate-100 rounded-tr-none' : 'bg-slate-900/90 border-slate-800 text-slate-100 rounded-tl-none'}`}>
                    
                    {/* Role header */}
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/50">
                      <div className="flex items-center gap-1.5">
                        {isUser ? (
                          <>
                            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Investigator Inquiry</span>
                          </>
                        ) : (
                          <>
                            <Brain className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">CrimeMind Copilot</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {msg.timestamp}
                        </span>
                        {!isUser && (
                          <button
                            onClick={() => handleCopy(msg.content, index)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition"
                            title="Copy response markdown"
                          >
                            {copiedIndex === index ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content body */}
                    <div className="space-y-1">
                      {isUser ? (
                        <p className="text-[11px] leading-relaxed text-slate-200">{msg.content}</p>
                      ) : (
                        renderMarkdown(msg.content)
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl rounded-tl-none flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Questions Grid Overlay */}
          {messages.length <= 2 && (
            <div className="p-4 border-t border-slate-800 bg-[#0d1527]/50 shrink-0">
              <h4 className="text-[10px] uppercase font-bold text-slate-450 tracking-wider mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                Suggested Intelligence Inquiries
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    disabled={isGenerating}
                    className="text-left p-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px] leading-relaxed text-slate-300 hover:bg-slate-850 hover:border-slate-700 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputMessage);
            }}
            className="p-4 border-t border-slate-800 bg-[#0b1220] flex items-center gap-3 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask CrimeMind AI a query (e.g. 'Summarize FIR 2026-0002' or 'Patrol routes for high risk areas')..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isGenerating}
              className="flex-1 text-xs bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isGenerating}
              className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
