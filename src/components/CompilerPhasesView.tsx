import React, { useState } from 'react';
import { 
  Cpu, 
  FileCode2, 
  GitBranch, 
  Table2, 
  Layers, 
  CheckCircle2, 
  Eye, 
  Sparkles,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Binary,
  ZoomIn,
  XCircle
} from 'lucide-react';
import { MemoryStep, Token, ASTNode, SymbolTableEntry } from '../compiler/types';

interface CompilerPhasesViewProps {
  step: MemoryStep;
}

export const CompilerPhasesView: React.FC<CompilerPhasesViewProps> = ({ step }) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'ast' | 'symbolTable' | 'diagrams'>('tokens');
  const [selectedDiagram, setSelectedDiagram] = useState<'memory' | 'compiler'>('memory');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ 'root': true });

  const fatalErrors = step.warnings.filter(w => w.isFatal || (w.severity === 'error' && [
    'COMPILATION_ERROR',
    'SYNTAX_ERROR',
    'TYPE_MISMATCH',
    'UNDEFINED_REFERENCE',
    'DANGLING_POINTER',
    'SEGMENTATION_FAULT'
  ].includes(w.type)));

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case 'Global':
        return <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">🟢 Global</span>;
      case 'Static':
        return <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">🟠 Static</span>;
      case 'Dynamic':
        return <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">🔴 Dynamic</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1">🔵 Local</span>;
    }
  };

  const getTokenTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      KEYWORD: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      TYPE: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      IDENTIFIER: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      NUMBER: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      OPERATOR: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      DELIMITER: 'bg-slate-700/50 text-slate-300 border-slate-600',
      STRING: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      COMMENT: 'bg-slate-800 text-slate-400 border-slate-700',
    };
    return colors[type] || 'bg-slate-800 text-slate-300 border-slate-700';
  };

  // Recursive AST renderer
  const renderASTNode = (node: ASTNode, depth = 0) => {
    const isExpanded = expandedNodes[node.id] ?? (depth < 2);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="ml-3 my-1 border-l-2 border-slate-800 pl-3">
        <div 
          onClick={() => hasChildren && toggleNode(node.id)}
          className={`flex items-center gap-2 p-1.5 rounded text-xs transition-colors ${
            hasChildren ? 'cursor-pointer hover:bg-slate-800/60' : ''
          }`}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <span className="w-3.5 h-3.5 inline-block text-slate-600">•</span>
          )}

          <span className="font-mono font-bold text-indigo-300">
            {node.type}
          </span>
          <span className="text-slate-300 font-mono">
            &quot;{node.label}&quot;
          </span>
          {node.details && (
            <span className="text-[10px] text-slate-500 font-sans italic">
              ({node.details})
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {node.children!.map(child => renderASTNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Compiler Pipeline & Analysis
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                Front-End & Back-End
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Lexer ➔ Parser (AST) ➔ Semantic Analysis ➔ Memory Layout
            </p>
          </div>
        </div>

        {/* Phase selector tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('tokens')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all ${
              activeTab === 'tokens' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            Tokens ({step.tokens.length})
          </button>
          <button
            onClick={() => setActiveTab('ast')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all ${
              activeTab === 'ast' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            Syntax AST
          </button>
          <button
            onClick={() => setActiveTab('symbolTable')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all ${
              activeTab === 'symbolTable' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            Symbol Table
          </button>
          <button
            onClick={() => setActiveTab('diagrams')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all ${
              activeTab === 'diagrams' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Architecture Blueprints
          </button>
        </div>
      </div>

      {/* Fatal Error Callout if compilation failed */}
      {fatalErrors.length > 0 && (
        <div className="mx-4 mt-3 p-3.5 rounded-xl border border-rose-500/70 bg-gradient-to-r from-rose-950/70 via-slate-900/90 to-slate-950/90 text-rose-100 flex items-start gap-3 shadow-xl ring-1 ring-rose-500/40">
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
            <XCircle className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300 font-mono">
                Compilation Aborted: {fatalErrors[0].type.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-rose-500/40 text-rose-300 shrink-0">
                Line {fatalErrors[0].line}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">{fatalErrors[0].message}</p>
            {fatalErrors[0].remediation && (
              <div className="text-[11px] font-mono text-emerald-400 mt-2 bg-slate-950/80 p-2 rounded-lg border border-white/5">
                <span className="font-bold">Suggestion: </span>{fatalErrors[0].remediation}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ========================================================= */}
        {/* 1. LEXICAL ANALYSIS / TOKENS STREAM */}
        {/* ========================================================= */}
        {activeTab === 'tokens' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300">
                Lexical Token Stream (Lexer Output)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Linear Tokenization via Regular Expressions
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {step.tokens.map((token, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg border font-mono text-xs flex flex-col gap-1 transition-all hover:scale-105 ${getTokenTypeBadge(token.type)}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-wider opacity-80">
                      {token.type}
                    </span>
                    <span className="text-[9px] opacity-60">
                      L{token.line}:{token.col}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-white">
                    {token.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. SYNTAX ANALYSIS / AST TREE */}
        {/* ========================================================= */}
        {activeTab === 'ast' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300">
                Abstract Syntax Tree (Parser Output)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Recursive-Descent Context-Free Grammar Parsing
              </span>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 font-mono overflow-x-auto">
              {renderASTNode(step.astRoot)}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. SEMANTIC ANALYSIS & SYMBOL TABLE */}
        {/* ========================================================= */}
        {activeTab === 'symbolTable' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-300">
                  Compiler Scoped Symbol Table
                </span>
                <p className="text-[11px] text-slate-400">
                  Tracks variable identifier names, types, storage scopes, memory addresses, and sizes
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Global</span>
                <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400">Local</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">Static</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">Dynamic</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px]">
                    <th className="p-3">Variable</th>
                    <th className="p-3">Data Type</th>
                    <th className="p-3">Scope</th>
                    <th className="p-3">Frame</th>
                    <th className="p-3">Virtual Address</th>
                    <th className="p-3">Size</th>
                    <th className="p-3">Current Value</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
                  {step.symbolTable.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-500 italic">
                        No variables active in symbol table yet
                      </td>
                    </tr>
                  ) : (
                    step.symbolTable.map((sym, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-bold text-slate-100 flex items-center gap-1.5">
                          {sym.name}
                        </td>
                        <td className="p-3 text-indigo-300">{sym.type}</td>
                        <td className="p-3">{getScopeBadge(sym.scope)}</td>
                        <td className="p-3 text-slate-400">{sym.frameName || 'global'}</td>
                        <td className="p-3 text-slate-400">{sym.address}</td>
                        <td className="p-3 text-slate-500">{sym.sizeBytes} B</td>
                        <td className="p-3 text-emerald-400 font-bold">{sym.value}</td>
                        <td className="p-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
                            sym.status === 'created' ? 'text-emerald-400 bg-emerald-500/15' :
                            sym.status === 'used' ? 'text-sky-400 bg-sky-500/15' :
                            sym.status === 'leaked' ? 'text-rose-400 bg-rose-500/15 font-bold' :
                            'text-slate-400 bg-slate-800'
                          }`}>
                            {sym.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. ARCHITECTURAL BLUEPRINTS & DIAGRAMS */}
        {/* ========================================================= */}
        {activeTab === 'diagrams' && (
          <div className="space-y-4">
            {/* Diagram selector tabs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { id: 'memory', label: '1. Virtual Memory', icon: Layers },
                { id: 'compiler', label: '2. Compiler Pipeline', icon: Cpu },
                { id: 'hardware', label: '3. Memory Hierarchy', icon: Binary },
                { id: 'stackframe', label: '4. Stack Frame Record', icon: GitBranch },
              ].map(d => {
                const Icon = d.icon;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDiagram(d.id as any)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      selectedDiagram === d.id
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-1 ring-indigo-400/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Diagram Display Container */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
              {selectedDiagram === 'memory' && (
                <div>
                  <div className="relative group">
                    <img 
                      src="/images/process_memory_diagram.jpg" 
                      alt="Virtual Memory Architecture"
                      className="w-full h-auto object-cover rounded-t-xl"
                    />
                  </div>
                  <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-2">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-sky-400" />
                      Operating System Process Virtual Memory Architecture
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      In a standard 64-bit virtual memory space, each executing process receives an isolated 48-bit/64-bit address space managed by the OS Page Tables. High addresses contain the protected <strong>Kernel Space</strong>. The <strong>Stack</strong> starts at high user addresses and decrements downward on function calls. Dynamic allocations (via <code className="text-purple-300">new</code> / <code className="text-purple-300">malloc</code>) grow upward from the <strong>Heap</strong>. Global and static variables reside in <strong>Data & BSS</strong>, and machine instructions execute from the read-only <strong>Text Segment</strong>.
                    </p>
                  </div>
                </div>
              )}

              {selectedDiagram === 'compiler' && (
                <div>
                  <div className="relative group">
                    <img 
                      src="/images/compiler_pipeline_diagram.jpg" 
                      alt="Compiler Design Pipeline Architecture"
                      className="w-full h-auto object-cover rounded-t-xl"
                    />
                  </div>
                  <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-2">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      Phases of Modern Compiler Construction (Front-End to Back-End)
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Compilers translate high-level human syntax into machine-executable instructions. 
                      <strong> Lexical Analysis</strong> breaks code into tokens; 
                      <strong> Syntax Analysis</strong> builds the hierarchical AST according to CFG grammar rules; 
                      <strong> Semantic Analysis</strong> validates types, scopes, and populates the symbol table; 
                      <strong> Intermediate Code Generation (ICG)</strong> produces machine-independent representation; and 
                      <strong> Code Generation</strong> maps variables and execution frames directly into target process memory segments.
                    </p>
                  </div>
                </div>
              )}

              {selectedDiagram === 'hardware' && (
                <div>
                  <div className="relative group">
                    <img 
                      src="/images/memory_hierarchy_diagram.jpg" 
                      alt="Computer Memory Hierarchy Architecture"
                      className="w-full h-auto object-cover rounded-t-xl"
                    />
                  </div>
                  <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-2">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Binary className="w-4 h-4 text-emerald-400" />
                      Computer Hardware Memory Hierarchy (Registers to DRAM)
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Virtual memory addresses mapped by the compiler correspond physically to this pyramid: 
                      <strong> CPU Registers</strong> (sub-nanosecond, smallest capacity), 
                      <strong> L1/L2/L3 On-Chip SRAM Caches</strong> (1-30ns access latency), 
                      <strong> Main Memory (DDR5 DRAM)</strong> (50-100ns latency hosting the active Stack and Heap segments), and 
                      <strong> Secondary Storage (NVMe M.2 SSD)</strong> backing Virtual Memory pages when memory pressure occurs.
                    </p>
                  </div>
                </div>
              )}

              {selectedDiagram === 'stackframe' && (
                <div>
                  <div className="relative group">
                    <img 
                      src="/images/stack_frame_diagram.jpg" 
                      alt="x86_64 Stack Frame Activation Record"
                      className="w-full h-auto object-cover rounded-t-xl"
                    />
                  </div>
                  <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-2">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-amber-400" />
                      x86_64 Stack Frame & Activation Record Mechanics
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Every function invocation creates a stack frame bounded by <strong>%rbp</strong> (Base Pointer) and <strong>%rsp</strong> (Stack Pointer). The hardware <code className="text-amber-300">CALL</code> instruction pushes the return address onto the stack. The callee saves the caller's <code className="text-amber-300">%rbp</code>, moves <code className="text-amber-300">%rsp</code> to <code className="text-amber-300">%rbp</code>, and subtracts bytes to allocate space for local variables. Upon return, <code className="text-amber-300">RET</code> pops the return address and restores control to the caller.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
