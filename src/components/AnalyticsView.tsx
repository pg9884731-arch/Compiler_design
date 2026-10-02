import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Layers, 
  Boxes, 
  ShieldAlert,
  ArrowUpRight,
  Maximize2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { MemoryStep } from '../compiler/types';

interface AnalyticsViewProps {
  steps: MemoryStep[];
  currentStepIndex: number;
  onSelectStep?: (index: number) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  steps,
  currentStepIndex,
  onSelectStep,
}) => {
  // Build chart dataset from all simulated steps
  const chartData = steps.map((step, idx) => ({
    step: `S${idx + 1}`,
    stepIndex: idx,
    line: step.currentLine,
    stackBytes: step.metrics.stackBytes,
    heapBytes: step.metrics.heapBytes,
    totalBytes: step.metrics.stackBytes + step.metrics.heapBytes,
    callDepth: step.metrics.callStackDepth,
    variables: step.metrics.variableCount,
    hasLeak: step.warnings.some(w => w.type === 'MEMORY_LEAK') ? 1 : 0,
  }));

  const maxStack = Math.max(...steps.map(s => s.metrics.stackBytes), 0);
  const maxHeap = Math.max(...steps.map(s => s.metrics.heapBytes), 0);
  const maxDepth = Math.max(...steps.map(s => s.metrics.callStackDepth), 0);
  const totalLeaks = steps.filter(s => s.warnings.some(w => w.type === 'MEMORY_LEAK')).length;

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Memory Consumption & Call Stack Analytics
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                Live Timeline Profiling
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Continuous metrics of Stack bytes, Heap allocations, and execution depth
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Viewing Step <span className="text-indigo-400 font-bold">{currentStepIndex + 1}</span> of {steps.length}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-sky-900/40 bg-sky-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-sky-400 font-semibold uppercase tracking-wider">Peak Stack</span>
              <Layers className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-sky-200 mt-1">
              {maxStack} <span className="text-xs text-sky-400 font-normal">Bytes</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Maximum stack frame memory allocation</p>
          </div>

          <div className="p-3.5 rounded-xl border border-purple-900/40 bg-purple-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Peak Heap</span>
              <Boxes className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-200 mt-1">
              {maxHeap} <span className="text-xs text-purple-400 font-normal">Bytes</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Dynamic heap buffer allocation ceiling</p>
          </div>

          <div className="p-3.5 rounded-xl border border-indigo-900/40 bg-indigo-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Max Call Depth</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-200 mt-1">
              {maxDepth} <span className="text-xs text-indigo-400 font-normal">Frames</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Deepest activation record nesting</p>
          </div>

          <div className={`p-3.5 rounded-xl border ${totalLeaks > 0 ? 'border-rose-500/50 bg-rose-950/20' : 'border-emerald-900/40 bg-emerald-950/20'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${totalLeaks > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                Leak Incidents
              </span>
              <ShieldAlert className={`w-4 h-4 ${totalLeaks > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
            </div>
            <div className={`text-2xl font-bold font-mono mt-1 ${totalLeaks > 0 ? 'text-rose-200' : 'text-emerald-200'}`}>
              {totalLeaks > 0 ? `${totalLeaks} Detected` : '0 Clean'}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {totalLeaks > 0 ? 'Unreleased heap blocks detected' : 'All allocated heap freed properly'}
            </p>
          </div>
        </div>

        {/* Primary Chart: Stack vs Heap Memory Consumption */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-200">
                Memory Footprint (Stack vs Heap) Across Steps
              </h3>
              <p className="text-[11px] text-slate-400">
                Click any step on the timeline to scrub to that memory snapshot
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                onClick={(e) => {
                  if (e && e.activePayload && e.activePayload[0] && onSelectStep) {
                    onSelectStep(e.activePayload[0].payload.stepIndex);
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorStack" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorHeap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="step" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="B" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area 
                  type="monotone" 
                  dataKey="stackBytes" 
                  name="Stack Memory (Bytes)" 
                  stroke="#38bdf8" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorStack)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="heapBytes" 
                  name="Heap Memory (Bytes)" 
                  stroke="#c084fc" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorHeap)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart: Call Stack Depth & Variable Count */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="mb-3">
            <h3 className="text-xs font-bold text-slate-200">
              Call Stack Nesting Depth & Active Variable Registry
            </h3>
            <p className="text-[11px] text-slate-400">
              Visualizes function recursion expansions and variable allocations
            </p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="step" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line 
                  type="stepAfter" 
                  dataKey="callDepth" 
                  name="Call Stack Depth" 
                  stroke="#818cf8" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="variables" 
                  name="Active Variables" 
                  stroke="#34d399" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
