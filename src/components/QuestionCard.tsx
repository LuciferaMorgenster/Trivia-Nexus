import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Scissors,
  Search,
  Radio,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Volume2,
  Loader2,
} from 'lucide-react';
import { TriviaQuestion, HostProfile, GroundingSource, LifelineState } from '../types/trivia';
import { soundFx } from '../utils/soundEffects';

interface QuestionCardProps {
  question: TriviaQuestion;
  questionNumber: number;
  totalQuestions: number;
  host: HostProfile;
  onAnswerSelected: (selectedIndex: number, timeSpentSec: number) => void;
  onNextQuestion: () => void;
  isAnswerSubmitted: boolean;
  selectedAnswerIndex: number | null;
  onOpenLiveIntercom: () => void;
  onTriggerFactCheck: () => void;
  isFactChecking: boolean;
  factCheckData: { explanation: string; sources: GroundingSource[] } | null;
  lifelines: LifelineState;
  onUseFiftyFifty: () => void;
  onUseHint: () => void;
  activeHint: string | null;
  isHintLoading: boolean;
  groundingSources?: GroundingSource[];
  onOpenSourcesModal: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  host,
  onAnswerSelected,
  onNextQuestion,
  isAnswerSubmitted,
  selectedAnswerIndex,
  onOpenLiveIntercom,
  onTriggerFactCheck,
  isFactChecking,
  factCheckData,
  lifelines,
  onUseFiftyFifty,
  onUseHint,
  activeHint,
  isHintLoading,
  groundingSources = [],
  onOpenSourcesModal,
}) => {
  const [timeLeft, setTimeLeft] = useState(25);
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);
  const maxTime = 25;

  useEffect(() => {
    setTimeLeft(maxTime);
    setDisabledOptions([]);
  }, [question.question]);

  // Timer countdown
  useEffect(() => {
    if (isAnswerSubmitted) return;

    if (timeLeft <= 0) {
      // Auto-submit timeout (wrong answer)
      onAnswerSelected(-1, maxTime);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 5 && prev > 0) {
          soundFx.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswerSubmitted]);

  // Handle 50/50 lifeline
  const handleFiftyFifty = () => {
    if (lifelines.fiftyFiftyUsed || isAnswerSubmitted) return;
    onUseFiftyFifty();
    soundFx.playLifelineWhoosh();

    // Pick 2 wrong answer indices to disable
    const wrongIndices = question.options
      .map((_, i) => i)
      .filter((i) => i !== question.correctAnswerIndex);

    // Shuffle and pick 2
    const toDisable = wrongIndices.sort(() => 0.5 - Math.random()).slice(0, 2);
    setDisabledOptions(toDisable);
  };

  const handleSelect = (idx: number) => {
    if (isAnswerSubmitted || disabledOptions.includes(idx)) return;
    const timeSpent = maxTime - timeLeft;
    onAnswerSelected(idx, timeSpent);
  };

  const timerPercent = (timeLeft / maxTime) * 100;
  const isCorrect = selectedAnswerIndex === question.correctAnswerIndex;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Top Header: Progress, Lifelines & Timer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        {/* Question Counter & Points */}
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-display font-bold text-sm">
            Question {questionNumber} / {totalQuestions}
          </span>
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
            +{question.points} pts
          </span>
        </div>

        {/* Lifeline Buttons */}
        <div className="flex items-center gap-2">
          {/* 50/50 */}
          <button
            onClick={handleFiftyFifty}
            disabled={lifelines.fiftyFiftyUsed || isAnswerSubmitted}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              lifelines.fiftyFiftyUsed
                ? 'bg-slate-950/60 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border-slate-700'
            }`}
            title="Eliminate two wrong answers"
          >
            <Scissors size={13} />
            <span>50/50</span>
          </button>

          {/* Host Hint */}
          <button
            onClick={onUseHint}
            disabled={lifelines.hintUsed || isAnswerSubmitted || isHintLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              lifelines.hintUsed
                ? 'bg-slate-950/60 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border-slate-700'
            }`}
            title="Ask host for a cryptic clue"
          >
            {isHintLoading ? <Loader2 size={13} className="animate-spin" /> : <HelpCircle size={13} />}
            <span>Host Clue</span>
          </button>

          {/* Search Grounding Fact-Check */}
          <button
            onClick={onTriggerFactCheck}
            disabled={lifelines.factCheckUsed || isAnswerSubmitted || isFactChecking}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              lifelines.factCheckUsed
                ? 'bg-slate-950/60 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                : 'bg-slate-800 hover:bg-emerald-950/40 text-emerald-300 hover:text-white border-slate-700 hover:border-emerald-500/50'
            }`}
            title="Query Google Search for real-time verification"
          >
            {isFactChecking ? <Loader2 size={13} className="animate-spin text-emerald-400" /> : <Search size={13} />}
            <span>Search Intel</span>
          </button>

          {/* Live Host Voice Intercom */}
          <button
            onClick={onOpenLiveIntercom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-pink-600/30 to-purple-600/30 text-pink-300 hover:text-white border border-pink-500/40 hover:border-pink-400 shadow-sm"
            title="Talk to the host live via Gemini Live Voice"
          >
            <Radio size={13} className="animate-pulse text-pink-400" />
            <span className="hidden sm:inline">Live Mic</span>
          </button>
        </div>

        {/* Timer Bar & Counter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Clock size={15} className={timeLeft <= 5 ? 'text-rose-400 animate-spin' : 'text-slate-400'} />
          <span
            className={`font-mono font-bold text-sm min-w-8 ${
              timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-slate-200'
            }`}
          >
            {timeLeft}s
          </span>
          <div className="flex-1 sm:w-28 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              style={{ width: `${timerPercent}%` }}
              className={`h-full transition-all duration-1000 ${
                timeLeft <= 5
                  ? 'bg-rose-500'
                  : timeLeft <= 12
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-indigo-500 to-pink-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Lifeline Callouts: Hint / Fact Check */}
      {activeHint && (
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-start gap-2.5 shadow-md">
          <HelpCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wider text-[10px] block text-amber-300 mb-0.5">
              {host.name}'s Secret Clue:
            </span>
            <p className="italic">"{activeHint}"</p>
          </div>
        </div>
      )}

      {factCheckData && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-600/40 text-emerald-200 text-xs flex items-start gap-2.5 shadow-md">
          <Search size={16} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-300">
                Google Search Live Intel:
              </span>
              {factCheckData.sources.length > 0 && (
                <button
                  onClick={onOpenSourcesModal}
                  className="text-[11px] underline text-emerald-400 hover:text-emerald-200 flex items-center gap-1"
                >
                  <span>{factCheckData.sources.length} Sources</span>
                  <ExternalLink size={10} />
                </button>
              )}
            </div>
            <p className="line-clamp-3">{factCheckData.explanation}</p>
          </div>
        </div>
      )}

      {/* Main Question Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Question Text */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug tracking-tight font-display">
            {question.question}
          </h2>
        </div>

        {/* 4 Multiple-Choice Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswerIndex === idx;
            const isThisCorrect = question.correctAnswerIndex === idx;
            const isDisabled = disabledOptions.includes(idx);

            let buttonStyles =
              'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 text-slate-200 hover:border-indigo-500/60';

            if (isDisabled) {
              buttonStyles =
                'bg-slate-950/40 border-slate-900 text-slate-600 opacity-40 line-through cursor-not-allowed';
            } else if (isAnswerSubmitted) {
              if (isThisCorrect) {
                buttonStyles =
                  'bg-emerald-600/30 border-emerald-400 text-white shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500';
              } else if (isSelected && !isThisCorrect) {
                buttonStyles =
                  'bg-rose-600/30 border-rose-400 text-white shadow-lg shadow-rose-500/20 ring-2 ring-rose-500';
              } else {
                buttonStyles = 'bg-slate-950/50 border-slate-800/60 text-slate-500 opacity-60';
              }
            } else if (isSelected) {
              buttonStyles =
                'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30';
            }

            const letter = String.fromCharCode(65 + idx);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(idx)}
                disabled={isAnswerSubmitted || isDisabled}
                className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all text-sm font-semibold group relative ${buttonStyles}`}
              >
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${
                    isAnswerSubmitted && isThisCorrect
                      ? 'bg-emerald-500 text-white'
                      : isAnswerSubmitted && isSelected && !isThisCorrect
                      ? 'bg-rose-500 text-white'
                      : isSelected
                      ? 'bg-white text-indigo-900'
                      : 'bg-slate-800/90 text-slate-400 group-hover:text-white group-hover:bg-slate-700'
                  }`}
                >
                  {letter}
                </span>

                <span className="flex-1 mt-0.5 leading-snug">{option}</span>

                {isAnswerSubmitted && isThisCorrect && (
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                )}
                {isAnswerSubmitted && isSelected && !isThisCorrect && (
                  <XCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Post-Answer Feedback Box */}
        {isAnswerSubmitted && (
          <div className="mt-6 pt-6 border-t border-slate-800 animate-in fade-in duration-300">
            <div
              className={`p-4 rounded-2xl mb-4 border ${
                isCorrect
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5 font-bold text-sm">
                {isCorrect ? (
                  <>
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span>Correct! +{question.points} Points</span>
                  </>
                ) : (
                  <>
                    <XCircle size={18} className="text-rose-400" />
                    <span>Incorrect! Correct answer was: {question.options[question.correctAnswerIndex]}</span>
                  </>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mt-2">
                {question.explanation}
              </p>

              {/* Google Search Grounding Sources badge */}
              {groundingSources && groundingSources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Search size={12} />
                    <span>Verified with Google Search Grounding</span>
                  </span>
                  <button
                    onClick={onOpenSourcesModal}
                    className="text-[11px] text-indigo-400 hover:text-indigo-200 font-bold underline flex items-center gap-1"
                  >
                    <span>View {groundingSources.length} Citations</span>
                    <ExternalLink size={10} />
                  </button>
                </div>
              )}
            </div>

            {/* Next Question / Finish Round button */}
            <div className="flex justify-end">
              <button
                onClick={onNextQuestion}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all transform hover:scale-[1.02]"
              >
                <span>{questionNumber < totalQuestions ? 'Next Question' : 'View Final Results'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
