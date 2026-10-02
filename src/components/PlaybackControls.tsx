import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Gauge,
  Clock,
  Sparkles,
  Terminal,
  Layers,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { MemoryStep } from '../compiler/types';

export interface PlaybackControlsProps {
  currentStepIndex?: number;
  currentStep?: any; // For backwards-compatibility if passed as number or MemoryStep
  totalSteps: number;
  isPlaying: boolean;
  speed?: number;
  playbackSpeed?: number;
  currentPhase?: string;
  onNext: () => void;
  onPrev: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onSeek: (step: number) => void;
  onSpeedChange?: (speed: number) => void;
  onChangeSpeed?: (speed: number) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  currentStepIndex,
  currentStep,
  totalSteps = 1,
  isPlaying,
  speed,
  playbackSpeed,
  currentPhase,
  onNext,
  onPrev,
  onTogglePlay,
  onReset,
  onSeek,
  onSpeedChange,
  onChangeSpeed,
}) => {
  // Safe resolution of active step index
  const safeIndex = 
    typeof currentStepIndex === 'number' && !isNaN(currentStepIndex)
      ? currentStepIndex
      : typeof currentStep === 'number' && !isNaN(currentStep)
      ? currentStep
      : 0;

  const safeTotal = Math.max(1, totalSteps);
  const activeSpeed = speed ?? playbackSpeed ?? 1;
  const setSpeed = onSpeedChange ?? onChangeSpeed ?? (() => {});
  const progressPercent = safeTotal > 1 ? (safeIndex / (safeTotal - 1)) * 100 : 0;

  // Keyboard shortcut listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        onReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay, onNext, onPrev, onReset]);

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl transition-all">
      {/* Top Toolbar: Primary controls, speed, and step metrics */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        {/* Left: Step Control Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <button
            onClick={onReset}
            title="Reset to Beginning (R)"
            className="p-2 text-slate-400 hover:text-white bg-slate-950/80 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-slate-700 transition shadow-sm active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onPrev}
            disabled={safeIndex <= 0}
            title="Previous Step (←)"
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition active:scale-95 ${
              safeIndex <= 0
                ? 'opacity-40 cursor-not-allowed bg-slate-950/40 text-slate-600 border-slate-900'
                : 'bg-slate-950/80 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-800 hover:border-slate-700 shadow-sm'
            }`}
          >
            <SkipBack className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Auto Play / Pause Toggle */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all shadow-md active:scale-95 ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-950/40'
                : 'bg-slate-950/90 text-slate-200 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                <span>Auto Play</span>
              </>
            )}
          </button>

          {/* High-Impact Next Step Primary Button */}
          <button
            onClick={onNext}
            disabled={safeIndex >= safeTotal - 1}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95 ${
              safeIndex >= safeTotal - 1
                ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border border-slate-700'
                : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/20 hover:shadow-cyan-500/30'
            }`}
          >
            <span>Next Step</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Playback Speed Segmented Pills */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Speed:
          </span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            {[0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeed(spd)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  activeSpeed === spd
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Right: Step Counter & Phase Pill */}
        <div className="flex items-center gap-3">
          {/* Keyboard shortcuts reminder */}
          <div className="hidden xl:flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800/80">
            <span className="text-slate-500">Shortcuts:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">Space</kbd>
            <span className="text-slate-600">•</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">←/→</kbd>
            <span className="text-slate-600">•</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">R</kbd>
          </div>

          {/* Current Step Counter Badge */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
            <span className="text-slate-500 uppercase text-[10px] font-semibold">STEP</span>
            <span className="text-cyan-400 font-bold">{String(safeIndex + 1).padStart(2, '0')}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 font-medium">{String(safeTotal).padStart(2, '0')}</span>
          </div>

          {/* Phase Badge */}
          {currentPhase && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              <span>{currentPhase}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Interactive Timeline Scrubber with Step Markers */}
      <div className="pt-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span className="flex items-center gap-1.5 font-mono font-medium text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Execution Timeline</span>
          </span>
          <span className="text-xs font-mono font-semibold text-cyan-400">
            {Math.round(progressPercent)}% Completed
          </span>
        </div>

        {/* Custom Range Track */}
        <div className="relative flex items-center group py-1">
          <input
            type="range"
            min={0}
            max={safeTotal - 1}
            value={safeIndex}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer focus:outline-none accent-cyan-400 relative z-10"
          />
          {/* Glowing gradient track fill */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 h-2 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 rounded-lg pointer-events-none transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Milestone Micro-Pills */}
        <div className="flex items-center justify-between gap-1 mt-2 overflow-x-auto pb-1">
          {Array.from({ length: safeTotal }).map((_, idx) => {
            const isCurrent = idx === safeIndex;
            const isPast = idx < safeIndex;

            return (
              <button
                key={idx}
                onClick={() => onSeek(idx)}
                className={`flex-1 min-w-[36px] py-1 px-1 rounded-lg text-center font-mono text-[10px] font-bold border transition-all ${
                  isCurrent
                    ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-md shadow-cyan-950 ring-1 ring-cyan-400'
                    : isPast
                    ? 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 text-slate-600 border-slate-900 hover:border-slate-800'
                }`}
              >
                S{idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
