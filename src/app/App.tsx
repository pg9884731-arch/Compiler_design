import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/Navbar';
import { PlaybackControls } from '../components/PlaybackControls';
import { CodeEditor } from '../components/CodeEditor';
import { MemoryMap } from '../components/MemoryMap';
import { DiagnosticsPanel } from '../components/DiagnosticsPanel';
import { CompilerPhasesView } from '../components/CompilerPhasesView';
import { AnalyticsView } from '../components/AnalyticsView';
import { QuizMode } from '../components/QuizMode';
import { GuideModal } from '../components/GuideModal';
import { PRESETS } from '../compiler/presets';
import { simulateProgram } from '../compiler/simulator';
import { MemoryStep, PresetProgram } from '../compiler/types';

export function App() {
  const [activeTab, setActiveTab] = useState<'memory' | 'compiler' | 'analytics' | 'quiz'>('memory');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-global-local');
  const [currentPreset, setCurrentPreset] = useState<PresetProgram>(PRESETS[0]);
  const [code, setCode] = useState<string>(PRESETS[0].code);
  const [steps, setSteps] = useState<MemoryStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [hoveredPointerAddress, setHoveredPointerAddress] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Playback timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Run simulation whenever code changes
  useEffect(() => {
    const simulatedSteps = simulateProgram(code);
    setSteps(simulatedSteps);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [code]);

  // Handle preset selection
  const handleSelectPreset = (presetId: string) => {
    const found = PRESETS.find(p => p.id === presetId);
    if (found) {
      setSelectedPresetId(presetId);
      setCurrentPreset(found);
      setCode(found.code);
    }
  };

  // Playback interval management
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(250, 1400 / speed);
      timerRef.current = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, steps.length]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleTogglePlay = () => {
    if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(prev => !prev);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const currentStep = steps[currentStepIndex] || steps[0];
  const fatalError = currentStep?.warnings?.find(
    w => w.isFatal || (w.severity === 'error' && ['COMPILATION_ERROR', 'SYNTAX_ERROR', 'TYPE_MISMATCH', 'UNDEFINED_REFERENCE', 'DANGLING_POINTER', 'SEGMENTATION_FAULT'].includes(w.type))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Global Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onReset={handleReset}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 flex flex-col p-3 md:p-4 gap-3 md:gap-4 max-w-[1920px] w-full mx-auto">
        {/* Playback Controls (Sticky under header) */}
        {steps.length > 0 && activeTab !== 'quiz' && (
          <PlaybackControls
            currentStepIndex={currentStepIndex}
            totalSteps={steps.length}
            isPlaying={isPlaying}
            speed={speed}
            currentPhase={currentStep?.phase || 'Execution'}
            onNext={handleNext}
            onPrev={handlePrev}
            onTogglePlay={handleTogglePlay}
            onReset={handleReset}
            onSpeedChange={setSpeed}
            onSeek={setCurrentStepIndex}
          />
        )}

        {/* Dynamic Views */}
        {activeTab === 'memory' && currentStep && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: Code Editor & Execution Context (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="h-[440px]">
                <CodeEditor
                  code={code}
                  activeLine={fatalError ? undefined : currentStep.currentLine}
                  errorLine={fatalError?.line}
                  errorColumn={fatalError?.column}
                  errorMessage={fatalError?.title}
                  preset={currentPreset}
                  programCounter={currentStep.programCounter}
                  onChangeCode={setCode}
                />
              </div>

              {/* Diagnostics & AI Memory Explainer */}
              <div className="flex-1">
                <DiagnosticsPanel step={currentStep} />
              </div>
            </div>

            {/* Right Column: Interactive 4-Segment Memory Map (7 cols) */}
            <div className="lg:col-span-7 h-full min-h-[640px]">
              <MemoryMap
                step={currentStep}
                activePointerHover={hoveredPointerAddress}
                onPointerHover={setHoveredPointerAddress}
              />
            </div>
          </div>
        )}

        {activeTab === 'compiler' && currentStep && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 h-[640px]">
              <CodeEditor
                code={code}
                activeLine={fatalError ? undefined : currentStep.currentLine}
                errorLine={fatalError?.line}
                errorColumn={fatalError?.column}
                errorMessage={fatalError?.title}
                preset={currentPreset}
                programCounter={currentStep.programCounter}
                onChangeCode={setCode}
              />
            </div>
            <div className="lg:col-span-8 h-[640px]">
              <CompilerPhasesView step={currentStep} />
            </div>
          </div>
        )}

        {activeTab === 'analytics' && steps.length > 0 && (
          <div className="flex-1 min-h-[640px]">
            <AnalyticsView
              steps={steps}
              currentStepIndex={currentStepIndex}
              onSelectStep={setCurrentStepIndex}
            />
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="flex-1 min-h-[640px]">
            <QuizMode />
          </div>
        )}
      </main>

      {/* 3. Guide & Architecture Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}

export default App;
