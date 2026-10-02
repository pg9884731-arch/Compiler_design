import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Layers, 
  Cpu, 
  Boxes, 
  AlertTriangle, 
  ShieldAlert, 
  HelpCircle,
  ExternalLink,
  Code2
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'memory' | 'compiler' | 'hardware' | 'stackframe' | 'tips'>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Compiler Memory Visualizer — Student & Architecture Guide
              </h2>
              <p className="text-xs text-slate-400">
                Interactive reference guide for Compiler Design, Operating Systems, and Data Structures
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 px-6 gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: '1. Overview' },
            { id: 'memory', label: '2. Virtual Memory' },
            { id: 'compiler', label: '3. Compiler Stages' },
            { id: 'hardware', label: '4. Memory Hierarchy' },
            { id: 'stackframe', label: '5. Stack Frame' },
            { id: 'tips', label: '6. Leaks & Overflows' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300 leading-relaxed">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20">
                <h3 className="font-bold text-indigo-200 text-base mb-1">
                  &ldquo;See How Memory Changes While Your Program Runs.&rdquo;
                </h3>
                <p className="text-xs text-slate-300">
                  Most computer science students learn about Stack, Heap, Pointers, and Activation Records only through static diagrams in textbook pages. This visualizer compiles code step-by-step and animates the live memory segments in real time.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
                    <Layers className="w-4 h-4" />
                    Stack Memory
                  </div>
                  <p className="text-xs text-slate-400">
                    Stores local variables, function arguments, and return addresses. Allocates automatically when a function is invoked (push) and deallocates upon return (pop). Very fast, but limited in size.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                    <Boxes className="w-4 h-4" />
                    Heap Memory
                  </div>
                  <p className="text-xs text-slate-400">
                    Dynamically allocated memory via <code className="text-purple-300 font-mono">new</code> or <code className="text-purple-300 font-mono">malloc</code>. Must be explicitly released with <code className="text-purple-300 font-mono">delete</code> or <code className="text-purple-300 font-mono">free</code> to prevent memory leaks.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Code2 className="w-4 h-4" />
                    Data / BSS Segment
                  </div>
                  <p className="text-xs text-slate-400">
                    Stores global and static variables. Retains values for the entire lifetime of the program execution.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <Cpu className="w-4 h-4" />
                    Text (Code) Segment
                  </div>
                  <p className="text-xs text-slate-400">
                    Contains compiled machine instructions. Kept read-only to prevent accidental modification of executable code.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <img 
                  src="/images/process_memory_diagram.jpg" 
                  alt="Process Memory Architecture" 
                  className="w-full h-auto"
                />
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-300">
                <h4 className="font-bold text-white text-sm">Virtual Address Space Rules:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong>Stack (High Memory):</strong> Starts near 0x7FFFFFFF and decrements downward toward the heap as stack frames are pushed.</li>
                  <li><strong>Heap (Low Memory):</strong> Starts above the BSS segment and increments upward as dynamic memory is requested.</li>
                  <li><strong>Unallocated Gap:</strong> The space between stack and heap allows both to grow dynamically without collision.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'compiler' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <img 
                  src="/images/compiler_pipeline_diagram.jpg" 
                  alt="Compiler Pipeline Architecture" 
                  className="w-full h-auto"
                />
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-300">
                <h4 className="font-bold text-white text-sm">Compiler Pipeline Stages:</h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li><strong>Lexical Analyzer:</strong> Converts raw characters into typed token units (Keywords, Identifiers, Numbers).</li>
                  <li><strong>Syntax Analyzer:</strong> Builds the hierarchical Abstract Syntax Tree (AST) matching C/C++ grammar rules.</li>
                  <li><strong>Semantic Analyzer:</strong> Performs type checking, scope validation, and populates the Scoped Symbol Table.</li>
                  <li><strong>Code Generator:</strong> Emits target instructions and maps memory addresses for Stack frames, Data segments, and Heap blocks.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <img 
                  src="/images/memory_hierarchy_diagram.jpg" 
                  alt="Memory Hierarchy Pyramid" 
                  className="w-full h-auto"
                />
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-300">
                <h4 className="font-bold text-white text-sm">Physical Memory Pyramid (Speed vs Capacity):</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong>Registers (CPU Flip-flops):</strong> &lt;1ns latency, smallest capacity. Directly referenced by CPU ALU operations.</li>
                  <li><strong>L1/L2/L3 SRAM Caches:</strong> 1-30ns latency, transparent hardware caching of active stack frames and heap nodes.</li>
                  <li><strong>Main Memory (DDR5 DRAM):</strong> 50-100ns latency, physical silicon RAM hosting the virtual memory pages of your program.</li>
                  <li><strong>Secondary Storage (NVMe SSD):</strong> Non-volatile persistent storage that stores compiled executables and OS swap space.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'stackframe' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <img 
                  src="/images/stack_frame_diagram.jpg" 
                  alt="x86_64 Stack Frame Mechanics" 
                  className="w-full h-auto"
                />
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-300">
                <h4 className="font-bold text-white text-sm">Stack Frame Calling Convention (x86_64):</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong>Return Address:</strong> Automatically pushed onto the stack by the <code className="text-white font-mono">CALL</code> instruction before jumping to the callee.</li>
                  <li><strong>Frame Pointer (%rbp):</strong> Establishes a fixed anchor within the activation record to reference local variables via negative offsets (<code className="text-white font-mono">-4(%rbp)</code>, <code className="text-white font-mono">-8(%rbp)</code>).</li>
                  <li><strong>Stack Pointer (%rsp):</strong> Decrements as variables are pushed or space is reserved via <code className="text-white font-mono">subq $N, %rsp</code>.</li>
                  <li><strong>Function Epilogue:</strong> Restores caller's %rbp and executes <code className="text-white font-mono">retq</code> to pop the return address back into %rip.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5" />
                  What is a Memory Leak?
                </div>
                <p className="text-xs text-slate-300">
                  A memory leak occurs when memory is allocated on the Heap (e.g. <code className="text-white font-mono">int* p = new int(50);</code>), but the program terminates or loses all pointer references to that address without invoking <code className="text-white font-mono">delete p;</code>. That memory block remains allocated and unavailable to the OS.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  What is a Stack Overflow?
                </div>
                <p className="text-xs text-slate-300">
                  When recursive functions lack a valid base case or recurse too deeply, stack frames continually pile up on the Stack. Eventually, the stack pointer collides with the heap boundary or exceeds the OS stack limit (typically 1MB-8MB), triggering a crash known as a Stack Overflow.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-900/60">
          <span className="text-xs text-slate-500 font-mono">
            Designed for Computer Science & Engineering Students
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
