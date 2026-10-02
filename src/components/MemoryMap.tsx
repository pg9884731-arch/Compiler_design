import React, { useState } from 'react';
import { 
  Layers, 
  Database, 
  Cpu, 
  Boxes, 
  ArrowDown, 
  ArrowUp, 
  CornerDownRight, 
  Hash, 
  Binary, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Info,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryStep, StackFrame, StackVariable, HeapBlock, StaticVariable, TextInstruction } from '../compiler/types';

interface MemoryMapProps {
  step: MemoryStep;
  activePointerHover?: string | null;
  onPointerHover?: (address: string | null) => void;
}

export const MemoryMap: React.FC<MemoryMapProps> = ({
  step,
  activePointerHover,
  onPointerHover,
}) => {
  const [expandedFrames, setExpandedFrames] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'stack' | 'heap' | 'data' | 'text'>('all');

  const toggleFrame = (id: string) => {
    setExpandedFrames(prev => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id]
    }));
  };

  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case 'Global':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Global</span>;
      case 'Static':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">Static</span>;
      case 'Dynamic':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-purple-500/15 text-purple-400 border border-purple-500/30">Dynamic</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">Local</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-inner">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Virtual Memory Map
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-900 text-slate-400 border border-slate-700">
                x86_64 Address Space
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Stack (High: 0x7FFE8300 ➔ grows down) • Heap (0x01000000 ➔ grows up)
            </p>
          </div>
        </div>

        {/* Segment Filter Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
          {(['all', 'stack', 'heap', 'data', 'text'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab === 'all' ? 'All Segments' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Segments Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Active Pointer References HUD */}
        {step.pointerArrows.length > 0 && (
          <div className="p-3.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-950/70 to-purple-950/30 shadow-lg shadow-amber-950/20 backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20 mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <CornerDownRight className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Active Pointer References (Stack ➔ Target Address Mapping)</span>
              </div>
              <span className="text-[10px] font-mono text-amber-400/90 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                Hover to illuminate target memory cell
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {step.pointerArrows.map((arrow) => {
                const isHovered = activePointerHover === arrow.toAddress;
                return (
                  <div
                    key={arrow.id}
                    onMouseEnter={() => onPointerHover && onPointerHover(arrow.toAddress)}
                    onMouseLeave={() => onPointerHover && onPointerHover(null)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                      isHovered
                        ? 'border-amber-400 bg-amber-500/25 text-white shadow-lg ring-1 ring-amber-400 scale-[1.02]'
                        : 'border-slate-800 bg-slate-950/90 text-slate-300 hover:border-amber-500/60'
                    }`}
                  >
                    <span className="font-bold text-amber-300">*{arrow.fromVarName}</span>
                    <span className="text-slate-500">({arrow.fromAddress.slice(-4)})</span>
                    <span className="text-amber-400 font-bold">───▶</span>
                    <span className={arrow.targetType === 'heap' ? 'text-purple-300 font-bold' : 'text-cyan-300 font-bold'}>
                      {arrow.toAddress}
                    </span>
                    <span className={`text-[9px] px-2 py-0.2 rounded-full uppercase font-bold ${
                      arrow.targetType === 'heap' 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {arrow.targetType}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 1. STACK SEGMENT (High Memory -> Grows Downward) */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'stack') && (
          <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 via-slate-950/40 to-slate-950/70 p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-inner">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-outfit">Stack Segment</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-mono">
                      0x7FFE8300
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <ArrowDown className="w-3 h-3 text-cyan-400 animate-bounce" />
                    Grows downward towards lower addresses on function calls
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-xl border border-cyan-800/40 font-bold shadow-sm">
                  {step.stackFrames.length} Active Frame{step.stackFrames.length !== 1 ? 's' : ''} ({step.metrics.stackBytes} B)
                </span>
              </div>
            </div>

            {/* Stack Frames List */}
            {step.stackFrames.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 space-y-1.5">
                <Layers className="w-6 h-6 text-slate-600 mx-auto" />
                <div className="text-xs font-semibold text-slate-400">Stack Frame Not Yet Allocated</div>
                <p className="text-[11px] text-slate-500">
                  Execution has not yet entered <code className="text-cyan-400">main()</code>. Advance the step slider to allocate the primary stack frame.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {step.stackFrames.map((frame, frameIdx) => {
                    const isExpanded = expandedFrames[frame.id] ?? true;
                    const isTopFrame = frameIdx === 0;

                    return (
                      <motion.div
                        key={frame.id}
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        className={`rounded-xl border overflow-hidden transition-all ${
                          isTopFrame 
                            ? 'border-cyan-500/50 bg-slate-950/90 shadow-xl shadow-cyan-950/30' 
                            : 'border-slate-800 bg-slate-950/60'
                        }`}
                      >
                        {/* Frame Header / Activation Record */}
                        <div 
                          onClick={() => toggleFrame(frame.id)}
                          className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition-colors ${
                            isTopFrame ? 'bg-cyan-950/30 hover:bg-cyan-950/40' : 'bg-slate-900/60 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                            <span className="font-mono text-xs font-bold text-cyan-200">
                              {frame.functionName}()
                            </span>
                            {isTopFrame && (
                              <span className="text-[9px] px-2 py-0.2 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 uppercase font-bold tracking-wider">
                                Current Frame
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                            <span>ret: <code className="text-slate-300">{frame.returnAddress}</code></span>
                            <span className="text-slate-700">|</span>
                            <span>%rbp: <code className="text-slate-300">{frame.basePointer}</code></span>
                            <span className="text-slate-700">|</span>
                            <span>%rsp: <code className="text-slate-300">{frame.stackPointer}</code></span>
                          </div>
                        </div>

                        {/* Frame Contents: Variables & Return Address slot */}
                        {isExpanded && (
                          <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/60">
                            {frame.variables.length === 0 ? (
                              <div className="text-[11px] text-slate-500 italic px-2 py-1">
                                No local variables declared in this frame
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {frame.variables.map((variable) => {
                                  const isPointerTarget = activePointerHover === variable.address;
                                  const isPointer = variable.isPointer;
                                  const isArray = variable.isArray;

                                  return (
                                    <div
                                      key={variable.name}
                                      onMouseEnter={() => {
                                        if (variable.pointsToAddress && onPointerHover) {
                                          onPointerHover(variable.pointsToAddress);
                                        }
                                      }}
                                      onMouseLeave={() => {
                                        if (onPointerHover) onPointerHover(null);
                                      }}
                                      className={`p-2.5 rounded-xl border transition-all ${
                                        isPointerTarget
                                          ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                                          : 'border-slate-800/90 bg-slate-900/60 hover:border-slate-700'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          {getScopeBadge(variable.scope)}
                                          <span className="font-mono text-xs font-bold text-slate-100">
                                            {variable.name}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-mono">
                                            ({variable.type})
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          <span className="text-[10px] font-mono text-slate-500">
                                            @{variable.address}
                                          </span>
                                          
                                          {/* Value display */}
                                          <div className="text-right">
                                            {isPointer ? (
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-mono font-bold text-amber-300">
                                                  ➔ {variable.value}
                                                </span>
                                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-mono font-semibold">
                                                  ptr
                                                </span>
                                              </div>
                                            ) : isArray ? (
                                              <span className="text-xs font-mono text-indigo-300 font-semibold">
                                                {variable.value}
                                              </span>
                                            ) : (
                                              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
                                                = {variable.value}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Array Elements Contiguous Block Visualizer */}
                                      {isArray && variable.arrayElements && (
                                        <div className="mt-2.5 pt-2 border-t border-slate-800">
                                          <div className="text-[10px] text-slate-400 font-mono mb-1.5 flex items-center justify-between">
                                            <span>Contiguous Array Elements (4 bytes each)</span>
                                            <span className="text-cyan-400">Base: {variable.address}</span>
                                          </div>
                                          <div className="grid grid-cols-5 gap-1.5">
                                            {variable.arrayElements.map((elem) => (
                                              <div 
                                                key={elem.index}
                                                className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-center shadow-inner"
                                              >
                                                <div className="text-[9px] font-mono text-slate-500">
                                                  [{elem.index}]
                                                </div>
                                                <div className="text-xs font-mono font-bold text-indigo-300">
                                                  {elem.value}
                                                </div>
                                                <div className="text-[8px] font-mono text-slate-600 truncate">
                                                  {elem.address.slice(-4)}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. HEAP SEGMENT (Dynamic Memory -> Grows Upward) */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'heap') && (
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-950/20 via-slate-950/40 to-slate-950/70 p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-inner">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-300 font-outfit">Heap Segment</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-mono">
                      0x01000000
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <ArrowUp className="w-3 h-3 text-purple-400 animate-bounce" />
                    Grows upward dynamically via <code className="text-purple-300 font-mono">new</code> / <code className="text-purple-300 font-mono">malloc</code>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-xl border border-purple-800/40 font-bold shadow-sm">
                  {step.heapBlocks.filter(b => !b.isFreed).length} Active Block(s) ({step.metrics.heapBytes} B)
                </span>
              </div>
            </div>

            {/* Heap Blocks */}
            {step.heapBlocks.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 space-y-1.5">
                <Boxes className="w-6 h-6 text-slate-600 mx-auto" />
                <div className="text-xs font-semibold text-slate-400">Heap Memory Empty</div>
                <p className="text-[11px] text-slate-500">
                  No dynamically allocated objects on the heap. Switch to the <strong>Dynamic Memory</strong> or <strong>Memory Leak</strong> preset to observe heap allocation.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {step.heapBlocks.map((block) => {
                    const isTarget = activePointerHover === block.address;

                    return (
                      <motion.div
                        key={block.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`p-3.5 rounded-xl border transition-all ${
                          block.isFreed
                            ? 'border-slate-800/60 bg-slate-950/40 opacity-60'
                            : block.isLeaked
                            ? 'border-rose-500/80 bg-rose-950/30 shadow-lg shadow-rose-950/50 ring-1 ring-rose-500/50'
                            : isTarget
                            ? 'border-amber-400 bg-purple-950/40 shadow-lg shadow-purple-950/40 ring-1 ring-amber-400'
                            : 'border-purple-800/40 bg-purple-950/20 hover:border-purple-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-purple-200">
                              Block @ {block.address}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({block.type}, {block.sizeBytes} bytes)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {block.isFreed ? (
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                                <Trash2 className="w-3 h-3 text-slate-400" />
                                Deallocated (Freed)
                              </span>
                            ) : block.isLeaked ? (
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1 animate-pulse font-bold">
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                                Memory Leaked!
                              </span>
                            ) : (
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Active Allocated
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                            <span>Allocated by ptr:</span>
                            <span className="font-bold text-amber-300">*{block.allocatedByPointer}</span>
                            <span className="text-slate-600">• Line {block.allocatedAtLine}</span>
                          </div>

                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-[11px] text-slate-400">Stored Payload:</span>
                            <span className={`text-sm font-bold ${block.isFreed ? 'line-through text-slate-500' : 'text-purple-300'}`}>
                              {block.value}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. DATA & BSS SEGMENT (Global & Static Variables) */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'data') && (
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 via-slate-950/40 to-slate-950/70 p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-inner">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 font-outfit">Data & BSS Segment</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                      0x00600000
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Initialized data & static variables (Persistent Program Lifetime)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-800/40 font-bold shadow-sm">
                  {step.dataSegment.length} Static / Global Var(s)
                </span>
              </div>
            </div>

            {step.dataSegment.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 space-y-1">
                <Database className="w-5 h-5 text-slate-600 mx-auto" />
                <div className="text-xs text-slate-400 font-semibold">No Global / Static Variables Declared</div>
                <p className="text-[11px] text-slate-500">Variables declared inside functions reside on the Stack, not in the Data Segment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {step.dataSegment.map((variable) => (
                  <div
                    key={variable.name}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 flex items-center justify-between shadow-inner"
                  >
                    <div className="flex items-center gap-2.5">
                      {getScopeBadge(variable.scope)}
                      <div>
                        <div className="font-mono text-xs font-bold text-slate-100">
                          {variable.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          @{variable.address} ({variable.type})
                        </div>
                      </div>
                    </div>

                    <div className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/50 px-3 py-1 rounded-lg border border-emerald-800/40 shadow-sm">
                      = {variable.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. TEXT / CODE SEGMENT (Machine Instructions & PC) */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'text') && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 shadow-inner">
                  <Binary className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-outfit">Text Segment (Machine Code)</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                      0x00400000 (Read-Only)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Compiled x86_64 instructions executed sequentially by the CPU
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono text-cyan-300 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-700 font-bold">
                  RIP: {step.programCounter}
                </span>
              </div>
            </div>

            <div className="space-y-1 font-mono text-xs max-h-44 overflow-y-auto pr-1">
              {step.textSegment.map((inst, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
                    inst.isCurrent
                      ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/40 shadow-sm font-semibold'
                      : 'text-slate-400 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 text-[10px] w-14">{inst.address}</span>
                    <span className={inst.isCurrent ? 'font-bold text-white' : ''}>
                      {inst.assembly}
                    </span>
                  </div>

                  {inst.isCurrent && (
                    <span className="text-[10px] font-sans px-2 py-0.2 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center gap-1 shadow-sm">
                      ➔ RIP (Executing)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
