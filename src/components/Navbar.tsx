import React from 'react';
import {
  Cpu,
  Layers,
  BarChart3,
  HelpCircle,
  Code2,
  BookOpen,
  Sparkles,
  RefreshCw,
  ChevronDown,
  Terminal,
  Activity
} from 'lucide-react';
import { PRESETS } from '../compiler/presets';

export type NavTab = 'memory' | 'compiler' | 'analytics' | 'quiz';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  selectedPresetId: string;
  onSelectPreset: (id: string) => void;
  onReset: () => void;
  onOpenGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  selectedPresetId,
  onSelectPreset,
  onReset,
  onOpenGuide
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 px-4 lg:px-6 py-2.5 transition-all">
      <div className="w-full max-w-[1920px] mx-auto flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        {/* Left: Brand Identity & Tagline */}
        <div className="flex items-center gap-3.5">
          <div className="relative group flex-shrink-0">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 rounded-xl blur-sm opacity-60 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative h-10 w-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center shadow-lg">
              <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-outfit whitespace-nowrap">
                Compiler Memory Visualizer
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                x86_64 Virtual Memory
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans tracking-normal truncate sm:whitespace-nowrap">
              See How Memory Changes While Your Program Runs.
            </p>
          </div>
        </div>

        {/* Center: Curriculum Presets Dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 rounded-xl px-3 py-1.5 shadow-inner">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Curriculum:
            </span>
            <div className="relative inline-block">
              <select
                value={selectedPresetId}
                onChange={(e) => onSelectPreset(e.target.value)}
                className="appearance-none bg-slate-950/90 border border-slate-700/60 text-xs font-medium text-slate-200 rounded-lg pl-2.5 pr-8 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 hover:border-slate-600 transition cursor-pointer"
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                    {p.title} ({p.difficulty})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right: Navigation Views & Utility Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Segmented View Switcher */}
          <nav className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner gap-0.5">
            <button
              onClick={() => onTabChange('memory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'memory'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Memory Map</span>
            </button>

            <button
              onClick={() => onTabChange('compiler')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'compiler'
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Compiler Pipeline</span>
            </button>

            <button
              onClick={() => onTabChange('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => onTabChange('quiz')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'quiz'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quiz Mode</span>
            </button>
          </nav>

          {/* Reset Action */}
          <button
            onClick={onReset}
            title="Reset Simulation (Step 0)"
            className="p-2 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-slate-700 transition shadow-sm active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Guide Modal Trigger */}
          <button
            onClick={onOpenGuide}
            title="Student System Guide & Blueprints"
            className="flex items-center gap-1.5 px-3 py-2 text-slate-300 hover:text-cyan-300 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-cyan-500/30 transition shadow-sm text-xs font-semibold active:scale-95"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
