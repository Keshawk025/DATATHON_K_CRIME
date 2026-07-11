import { type ReactNode, type FC } from 'react';
import CrimeAnalyticsImpl from './CrimeAnalytics';
import { Hammer, MapPin, Share2, Users, MessageSquareCode, FileSpreadsheet, Settings } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  icon: ReactNode;
  description: string;
}

const BasePlaceholder: FC<PlaceholderProps> = ({ title, icon, description }) => {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-sm space-y-4">
      <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-md">
        {icon}
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider">
          <Hammer className="h-3 w-3" />
          Datathon 2026 Prototype Scope
        </span>
        <p className="text-xs text-slate-400 leading-relaxed mt-2">
          {description}
        </p>
      </div>
    </div>
  );
};

export const CrimeAnalyticsPage: FC = () => <CrimeAnalyticsImpl />;

export const HeatmapPage: FC = () => (
  <BasePlaceholder
    title="Geospatial Hotspot Heatmap"
    icon={<MapPin className="h-8 w-8" />}
    description="Interactive maps with heat overlays showing high-crime density regions across districts will load in this module."
  />
);

export const NetworkPage: FC = () => (
  <BasePlaceholder
    title="Criminal Network Analysis"
    icon={<Share2 className="h-8 w-8" />}
    description="Relational graphs connecting suspect phone logs, vehicle ownership, address records, and associated cases."
  />
);

export const OffendersPage: FC = () => (
  <BasePlaceholder
    title="Repeat Offender Recidivism Engine"
    icon={<Users className="h-8 w-8" />}
    description="Detailed profiles, individual timelines, risk score charts, and repeat arrest tracking databases."
  />
);

export const AIAssistantPage: FC = () => (
  <BasePlaceholder
    title="AI Investigation Assistant"
    icon={<MessageSquareCode className="h-8 w-8" />}
    description="Gemini-powered chatbot to query case files, generate case summaries, and write draft investigation briefs in plain language."
  />
);

export const ReportsPage: FC = () => (
  <BasePlaceholder
    title="Case Reports Generator"
    icon={<FileSpreadsheet className="h-8 w-8" />}
    description="Compile dashboard statistics and network graphs into official PDF reports for download."
  />
);

export const SettingsPage: FC = () => (
  <BasePlaceholder
    title="System Configuration Settings"
    icon={<Settings className="h-8 w-8" />}
    description="Configure credentials, set up Gemini API client keys, and manage district properties parameters."
  />
);
