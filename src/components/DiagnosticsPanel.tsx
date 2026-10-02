import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Lightbulb, 
  Activity, 
  CheckCircle2, 
  Info, 
  Terminal,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  Boxes,
  XCircle,
  Flame
} from 'lucide-react';
import { MemoryStep, DiagnosticWarning } from '../compiler/types';

interface DiagnosticsPanelProps {
  step: MemoryStep;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ step }) => {
  return (
    <div className="flex flex-col gap-3.5">
      {/* 1. Critical Warning Callout (Memory Leak, Stack Overflow, or Compilation / Syntax Errors) */}
      {step.warnings.length > 0 && (
        <div className="space-y-2.5">
          {step.warnings.map((warn, i) => {
            const isCompilerError = warn.isFatal || (warn.severity === 'error' && [
              'COMPILATION_ERROR',
              'SYNTAX_ERROR',
              'TYPE_MISMATCH',
              'UNDEFINED_REFERENCE',
              'DANGLING_POINTER',
              'SEGMENTATION_FAULT'
            ].includes(warn.type));
            const isMemoryLeak = warn.type === 'MEMORY_LEAK';
            const isStackOverflow = warn.type === 'STACK_OVERFLOW';

            return (
              <div
                key={i}
                className={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-xl backdrop-blur-md transition-all ${
                  isCompilerError
                    ? 'bg-rose-950/60 border-rose-500/80 text-rose-100 shadow-rose-950/50 ring-2 ring-rose-500/40'
                    : isMemoryLeak
                    ? 'bg-rose-950/50 border-rose-500/60 text-rose-200 shadow-rose-950/40 ring-1 ring-rose-500/30'
                    : isStackOverflow
                    ? 'bg-amber-950/50 border-amber-500/60 text-amber-200 shadow-amber-950/40 ring-1 ring-amber-500/30'
                    : 'bg-indigo-950/50 border-indigo-500/60 text-indigo-200'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-950/90 mt-0.5 shrink-0 border border-white/10">
                  {isCompilerError ? (
                    <XCircle className="w-5 h-5 text-rose-400 animate-pulse" />
                  ) : isMemoryLeak ? (
                    <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />
                  ) : isStackOverflow ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-indigo-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isCompilerError && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-mono shadow-sm">
                          {warn.type.replace('_', ' ')}
                        </span>
                      )}
                      <h4 className="text-xs font-bold uppercase tracking-wider font-outfit text-white">
                        {warn.title}
                      </h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950/90 font-mono border border-white/10 text-rose-300 shrink-0">
                      Line {warn.line}{warn.column ? `:${warn.column}` : ''}
                    </span>
                  </div>
                  <p className="text-xs mt-1.5 text-slate-300 leading-relaxed font-sans">
                    {warn.message}
                  </p>

                  {/* Terminal GCC snippet for compiler errors */}
                  {isCompilerError && (
                    <div className="mt-2.5 bg-slate-950/95 p-2.5 rounded-xl border border-rose-500/30 font-mono text-[11px] text-rose-300 space-y-1">
                      <div className="text-slate-400 flex items-center justify-between text-[10px] border-b border-slate-800 pb-1">
                        <span>g++ -std=c++17 -Wall main.cpp</span>
                        <span className="text-rose-400 font-bold">compilation terminated</span>
                      </div>
                      <div className="text-rose-400 font-semibold pt-0.5">
                        main.cpp:{warn.line}:{warn.column || 1}: error: <span className="text-rose-200 font-normal">{warn.message}</span>
                      </div>
                      {step.codeLineText && (
                        <div className="pt-1 text-slate-300">
                          <div>
                            <span className="text-slate-500 select-none mr-2">{warn.line} |</span>
                            <span className="text-rose-200">{step.codeLineText}</span>
                          </div>
                          <div className="text-rose-400 font-bold select-none">
                            <span className="text-slate-600 mr-2">{' '.repeat(String(warn.line).length)} |</span>
                            <span>{' '.repeat(Math.max(0, (warn.column || 1) - 1))}^~~~</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {warn.remediation && (
                    <div className="mt-2 text-[11px] bg-slate-950/90 p-2.5 rounded-xl border border-white/10 font-mono flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold shrink-0">Fix: </span>
                      <span className="text-slate-200">{warn.remediation}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. AI Compiler & OS Memory Explainer */}
      <div className="p-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 via-slate-900/80 to-slate-950/90 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2 font-outfit">
                Compiler & OS Memory Explainer
                <span className="text-[10px] px-2 py-0.2 rounded-full font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {step.phase}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Step {step.stepIndex + 1} of {step.totalSteps}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              Source Line {step.currentLine}
            </span>
          </div>
        </div>

        {/* Current executed statement chip */}
        <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800/90 font-mono text-xs text-cyan-200 mb-3 flex items-center gap-2 shadow-inner">
          <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-slate-500 select-none">&gt;</span>
          <span className="font-semibold text-white truncate">{step.codeLineText || '// Program Terminated'}</span>
        </div>

        {/* Plain-English Explanation */}
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {step.explanation}
        </p>
      </div>

      {/* 3. Variable Lifetime Pipeline (Created -> Used -> Destroyed) */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl space-y-3 backdrop-blur-xl">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 font-outfit">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Variable Lifetime & Scope Tracking</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
            {step.symbolTable.length} Symbol{step.symbolTable.length !== 1 ? 's' : ''} Active
          </span>
        </div>

        {step.symbolTable.length === 0 ? (
          <div className="text-center py-5 px-3 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 space-y-1">
            <div className="text-xs text-slate-400 font-semibold">No Active Variables</div>
            <p className="text-[11px] text-slate-500">Variables appear here as declarations are executed.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {step.symbolTable.map((sym) => {
              const isCreated = sym.status === 'created';
              const isUsed = sym.status === 'used';
              const isDestroyed = sym.status === 'destroyed' || sym.status === 'freed';
              const isLeaked = sym.status === 'leaked';

              return (
                <div
                  key={sym.name}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{sym.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({sym.type})</span>
                      <span className="text-[10px] text-slate-500 font-mono">@{sym.address}</span>
                    </div>
                    <div className="font-mono text-xs text-cyan-300 font-semibold">
                      = {sym.value}
                    </div>
                  </div>

                  {/* Visual 3-Stage Progress Nodes */}
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    {/* Stage 1: Created */}
                    <div className={`py-1 px-1 rounded-lg text-center text-[10px] font-mono border transition-all ${
                      isCreated
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm font-bold animate-pulse'
                        : isUsed || isDestroyed || isLeaked
                        ? 'bg-emerald-950/30 text-emerald-400/80 border-emerald-900/40'
                        : 'bg-slate-900/40 text-slate-600 border-slate-800'
                    }`}>
                      1. Created
                    </div>

                    {/* Stage 2: Used */}
                    <div className={`py-1 px-1 rounded-lg text-center text-[10px] font-mono border transition-all ${
                      isUsed
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm font-bold animate-pulse'
                        : isDestroyed || isLeaked
                        ? 'bg-cyan-950/30 text-cyan-400/80 border-cyan-900/40'
                        : 'bg-slate-900/40 text-slate-600 border-slate-800'
                    }`}>
                      2. Used
                    </div>

                    {/* Stage 3: Destroyed / Freed / Leaked */}
                    <div className={`py-1 px-1 rounded-lg text-center text-[10px] font-mono border transition-all ${
                      isLeaked
                        ? 'bg-rose-500/25 text-rose-300 border-rose-500/60 shadow-sm font-bold animate-pulse'
                        : isDestroyed
                        ? 'bg-slate-800 text-slate-300 border-slate-700 font-semibold'
                        : 'bg-slate-900/40 text-slate-600 border-slate-800'
                    }`}>
                      {isLeaked ? '⚠ Leaked' : isDestroyed ? '3. Destroyed' : '3. In Scope'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Real-time Memory Resource Gauge */}
      <div className="grid grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-slate-950/60 text-center shadow-lg">
          <div className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider font-outfit">Stack Size</div>
          <div className="text-base font-bold font-mono text-cyan-200 mt-0.5">{step.metrics.stackBytes} <span className="text-[10px] text-cyan-400 font-normal">B</span></div>
        </div>
        <div className="p-3 rounded-xl border border-purple-500/30 bg-gradient-to-b from-purple-950/20 to-slate-950/60 text-center shadow-lg">
          <div className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider font-outfit">Heap Size</div>
          <div className="text-base font-bold font-mono text-purple-200 mt-0.5">{step.metrics.heapBytes} <span className="text-[10px] text-purple-400 font-normal">B</span></div>
        </div>
        <div className="p-3 rounded-xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 to-slate-950/60 text-center shadow-lg">
          <div className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider font-outfit">Call Depth</div>
          <div className="text-base font-bold font-mono text-indigo-200 mt-0.5">{step.metrics.callStackDepth} <span className="text-[10px] text-indigo-400 font-normal">frames</span></div>
        </div>
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-slate-950/60 text-center shadow-lg">
          <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider font-outfit">Variables</div>
          <div className="text-base font-bold font-mono text-emerald-200 mt-0.5">{step.metrics.variableCount} <span className="text-[10px] text-emerald-400 font-normal">total</span></div>
        </div>
      </div>
    </div>
  );
};
