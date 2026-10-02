import React, { useState, useEffect } from 'react';
import { Terminal, Play, Edit3, Check, RotateCcw, Sparkles, Code2, Cpu } from 'lucide-react';
import { PresetProgram } from '../compiler/types';

interface CodeEditorProps {
  code: string;
  currentLine?: number;
  activeLine?: number;
  errorLine?: number;
  errorColumn?: number;
  errorMessage?: string;
  programCounter?: string;
  preset?: PresetProgram;
  onCodeChange?: (newCode: string) => void;
  onChangeCode?: (newCode: string) => void;
  onRunCode?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  currentLine,
  activeLine,
  errorLine,
  errorColumn,
  errorMessage,
  programCounter = '0x00400000',
  preset,
  onCodeChange,
  onChangeCode,
  onRunCode
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableCode, setEditableCode] = useState(code);

  const effectiveLine = activeLine ?? currentLine ?? 1;
  const updateCode = onChangeCode ?? onCodeChange ?? (() => {});

  useEffect(() => {
    setEditableCode(code);
  }, [code]);

  const handleApply = () => {
    updateCode(editableCode);
    setIsEditing(false);
    if (onRunCode) onRunCode();
  };

  const handleCancel = () => {
    setEditableCode(code);
    setIsEditing(false);
  };

  const lines = (isEditing ? editableCode : code).split('\n');

  // Syntax highlighting helper for C/C++ tokens
  const renderHighlightedCode = (text: string) => {
    if (!text) return <span>&nbsp;</span>;

    // Comments
    if (text.trim().startsWith('//')) {
      return <span className="text-slate-500 italic">{text}</span>;
    }
    // Preprocessor directives
    if (text.trim().startsWith('#')) {
      return <span className="text-pink-400 font-semibold">{text}</span>;
    }

    // Split words while preserving delimiters
    const tokens = text.split(/(\s+|[();,{}[\].+\-*\/=<>!&|])/);

    return (
      <>
        {tokens.map((token, i) => {
          if (!token) return null;

          if (['int', 'void', 'char', 'float', 'double', 'bool'].includes(token)) {
            return <span key={i} className="text-amber-400 font-bold">{token}</span>;
          }
          if (['return', 'if', 'else', 'while', 'for', 'new', 'delete', 'using', 'namespace'].includes(token)) {
            return <span key={i} className="text-purple-400 font-bold">{token}</span>;
          }
          if (/^\d+$/.test(token)) {
            return <span key={i} className="text-emerald-400 font-bold">{token}</span>;
          }
          if (['+', '-', '*', '/', '=', '==', '!=', '<', '>', '<=', '>=', '&'].includes(token)) {
            return <span key={i} className="text-cyan-300 font-bold">{token}</span>;
          }
          if (['(', ')', '{', '}', '[', ']', ';', ','].includes(token)) {
            return <span key={i} className="text-slate-400">{token}</span>;
          }
          if (['main', 'add', 'factorial', 'cout', 'cin', 'endl', 'std'].includes(token)) {
            return <span key={i} className="text-sky-300 font-semibold">{token}</span>;
          }
          return <span key={i} className="text-slate-200">{token}</span>;
        })}
      </>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl h-full backdrop-blur-xl">
      {/* Editor Title Bar */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {/* macOS window action dots */}
          <div className="flex gap-1.5 items-center">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-sm" />
          </div>

          {/* Tab indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 shadow-inner">
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">program.cpp</span>
            <span className="text-[10px] text-slate-500">C++</span>
          </div>
        </div>

        {/* Program Counter & Edit Actions */}
        <div className="flex items-center gap-2">
          {/* Program Counter (PC) Chip */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>PC:</span>
            <span className="text-cyan-400 font-bold">{programCounter}</span>
          </div>

          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCancel}
                className="px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 rounded-lg transition shadow-md shadow-emerald-950"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Compile & Run</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white rounded-lg border border-slate-800 hover:border-cyan-500/40 transition shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edit Code</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 overflow-auto bg-[#070b14] font-mono text-xs p-3">
        {isEditing ? (
          <div className="h-full flex flex-col">
            <div className="text-[11px] text-slate-400 mb-2 font-sans flex items-center justify-between">
              <span>Edit C++ code directly. Click <strong>Compile & Run</strong> to re-simulate.</span>
              <span className="text-cyan-400 font-mono text-[10px]">Editing Active</span>
            </div>
            <textarea
              value={editableCode}
              onChange={(e) => setEditableCode(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full min-h-[300px] bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-200 outline-none resize-none font-mono text-xs leading-relaxed focus:border-cyan-500/50 transition"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {lines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const isError = lineNum === errorLine;
              const isCurrent = !errorLine && lineNum === effectiveLine;

              return (
                <div
                  key={lineNum}
                  className={`flex items-center group transition-all rounded-md ${
                    isError
                      ? 'bg-rose-500/20 border-l-[3px] border-rose-500 py-1 shadow-sm'
                      : isCurrent
                      ? 'bg-gradient-to-r from-cyan-500/20 via-sky-500/10 to-transparent border-l-[3px] border-cyan-400 py-1 shadow-sm'
                      : 'hover:bg-slate-800/30 py-0.5 border-l-[3px] border-transparent'
                  }`}
                >
                  {/* Line Number & Execution Pointer / Error Icon */}
                  <div className="w-12 text-right pr-3 select-none flex items-center justify-end gap-1 flex-shrink-0">
                    {isError ? (
                      <span className="text-[10px] text-rose-400 font-bold animate-pulse" title={errorMessage}>✕</span>
                    ) : isCurrent ? (
                      <span className="text-[10px] text-cyan-400 animate-pulse font-bold">➔</span>
                    ) : (
                      <span className="w-2.5 inline-block" />
                    )}
                    <span className={`text-[11px] font-mono ${
                      isError ? 'text-rose-400 font-bold' : isCurrent ? 'text-cyan-300 font-bold' : 'text-slate-600'
                    }`}>
                      {lineNum}
                    </span>
                  </div>

                  {/* Code Line Content */}
                  <div className={`flex-1 overflow-x-auto whitespace-pre font-mono text-xs ${
                    isError ? 'text-rose-200 font-medium' : isCurrent ? 'font-medium text-white' : 'text-slate-300'
                  }`}>
                    {renderHighlightedCode(lineText)}
                    {isError && errorMessage && (
                      <span className="ml-3 text-[10px] font-sans px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1.5 shadow-sm">
                        {errorColumn && (
                          <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-rose-500/40 text-rose-100 font-bold">
                            col {errorColumn}
                          </span>
                        )}
                        <span>{errorMessage}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor Footer Status Bar */}
      <div className="px-4 py-1.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>x86_64 GCC / Clang Compatible</span>
        </span>
        <span>Line {effectiveLine} of {lines.length}</span>
      </div>
    </div>
  );
};
