import React, { useState } from 'react';
import { 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Award, 
  RotateCcw, 
  ArrowRight, 
  Sparkles,
  BookOpen,
  Code2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QUIZ_QUESTIONS, QuizQuestion } from '../compiler/quizData';

export const QuizMode: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = QUIZ_QUESTIONS[currentIndex];
  const totalQ = QUIZ_QUESTIONS.length;

  const handleSelectOption = (qId: string, optionIdx: number) => {
    if (selectedAnswers[qId] !== undefined) return; // already answered

    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));

    setShowExplanation(prev => ({
      ...prev,
      [qId]: true
    }));

    // If answered correctly, trigger brief confetti
    if (optionIdx === currentQ.correctIndex) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQ - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 }
      });
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowExplanation({});
    setCurrentIndex(0);
    setIsFinished(false);
  };

  const calculateScore = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach(q => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  const score = calculateScore();

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Memory Prediction & Concept Quiz
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                Interactive Learning
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Predict memory behavior before it runs to test your understanding
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400">
            Score: <strong className="text-emerald-400">{score}</strong> / {totalQ}
          </span>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
        {!isFinished ? (
          <div className="space-y-6">
            {/* Progress indicator */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
                <span>Question {currentIndex + 1} of {totalQ}</span>
                <span>{Math.round(((currentIndex + 1) / totalQ) * 100)}% Complete</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${((currentIndex + 1) / totalQ) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Box */}
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
              <h3 className="text-base font-semibold text-slate-100 leading-snug">
                {currentQ.question}
              </h3>

              {/* Code Snippet if present */}
              {currentQ.codeSnippet && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-200 flex items-start gap-2">
                  <Code2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <pre className="overflow-x-auto">{currentQ.codeSnippet}</pre>
                </div>
              )}

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedAnswers[currentQ.id] === idx;
                  const isAnswered = selectedAnswers[currentQ.id] !== undefined;
                  const isCorrect = idx === currentQ.correctIndex;

                  let optionStyle = 'border-slate-800 bg-slate-950/70 hover:bg-slate-800/60 text-slate-200';
                  if (isAnswered) {
                    if (isCorrect) {
                      optionStyle = 'border-emerald-500/70 bg-emerald-950/40 text-emerald-200 shadow-md shadow-emerald-950/30';
                    } else if (isSelected) {
                      optionStyle = 'border-rose-500/70 bg-rose-950/40 text-rose-200';
                    } else {
                      optionStyle = 'border-slate-800/40 bg-slate-950/30 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(currentQ.id, idx)}
                      className={`w-full text-left p-3.5 rounded-lg border text-xs font-medium flex items-center justify-between transition-all ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center font-mono text-[10px] shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </div>

                      {isAnswered && (
                        <div>
                          {isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : isSelected ? (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          ) : null}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Card */}
              {showExplanation[currentQ.id] && (
                <div className="mt-4 p-4 rounded-lg bg-indigo-950/30 border border-indigo-500/30 space-y-1.5 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <BookOpen className="w-4 h-4" />
                    Explanation:
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation Button */}
            <div className="flex justify-end">
              {selectedAnswers[currentQ.id] !== undefined && (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <span>{currentIndex < totalQ - 1 ? 'Next Question' : 'View Results'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Finished Screen */
          <div className="text-center py-10 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-2xl">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Quiz Completed!</h3>
              <p className="text-sm text-slate-400">
                You scored <span className="font-bold text-emerald-400 text-base">{score}</span> out of {totalQ} questions correct
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 max-w-md mx-auto text-xs text-slate-300 leading-relaxed">
              {score === totalQ ? (
                <p className="text-emerald-300 font-medium">
                  🎉 Perfect Score! You have mastered Virtual Memory, Stack Frames, Pointers, and Heap dynamics!
                </p>
              ) : score >= 3 ? (
                <p className="text-indigo-300">
                  👍 Great job! You understand the foundational compiler and OS memory concepts. Review the step-by-step visualizer to solidify tricky pointer references.
                </p>
              ) : (
                <p className="text-amber-300">
                  💡 Keep learning! Use the Memory Map tabs and step-by-step execution to see stack and heap frames in action.
                </p>
              )}
            </div>

            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              Take Quiz Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
