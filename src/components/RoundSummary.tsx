import React, { useEffect } from 'react';
import {
  Trophy,
  Flame,
  CheckCircle,
  RotateCcw,
  Users,
  Radio,
  Volume2,
  Sparkles,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { HostProfile, GameStats } from '../types/trivia';
import { HostAvatar } from './HostAvatar';

interface RoundSummaryProps {
  stats: GameStats;
  host: HostProfile;
  topicTitle: string;
  onPlayAgain: () => void;
  onChangeHost: () => void;
  onOpenLiveIntercom: () => void;
  closingHostCommentary: string;
  isHostSpeaking: boolean;
  onReplayAudio: () => void;
}

export const RoundSummary: React.FC<RoundSummaryProps> = ({
  stats,
  host,
  topicTitle,
  onPlayAgain,
  onChangeHost,
  onOpenLiveIntercom,
  closingHostCommentary,
  isHostSpeaking,
  onReplayAudio,
}) => {
  const accuracy =
    stats.totalAnswered > 0
      ? Math.round((stats.correctAnswers / stats.totalAnswered) * 100)
      : 0;

  useEffect(() => {
    if (accuracy >= 60) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [accuracy]);

  let rankTitle = 'Trivia Apprentice';
  let rankBadgeColor = 'bg-slate-700 text-slate-300';
  if (accuracy >= 90) {
    rankTitle = 'Grand Trivia Master';
    rankBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  } else if (accuracy >= 70) {
    rankTitle = 'Trivia Prodigy';
    rankBadgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
  } else if (accuracy >= 50) {
    rankTitle = 'Knowledge Contender';
    rankBadgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-400">
      {/* Trophy & Title */}
      <div className="text-center space-y-2">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 via-pink-500 to-indigo-500 p-0.5 shadow-2xl flex items-center justify-center">
          <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center text-amber-400">
            <Trophy size={36} className="animate-bounce" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-white font-display tracking-tight">
          Showdown Complete!
        </h1>
        <p className="text-sm text-slate-400">
          Category: <span className="text-indigo-300 font-semibold">{topicTitle}</span>
        </p>

        <div className="inline-block mt-2">
          <span
            className={`px-3.5 py-1 rounded-full text-xs font-bold border tracking-wider uppercase font-mono ${rankBadgeColor}`}
          >
            {rankTitle}
          </span>
        </div>
      </div>

      {/* Host Final Verdict Card */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        <HostAvatar
          host={host}
          isSpeaking={isHostSpeaking}
          speechText={closingHostCommentary}
          onReplaySpeech={onReplayAudio}
          size="md"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-xs text-slate-400 font-medium block mb-1">Final Score</span>
          <div className="text-2xl font-black text-white font-display">
            {stats.score}
          </div>
          <span className="text-[10px] text-amber-400 font-mono">pts</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-xs text-slate-400 font-medium block mb-1">Accuracy</span>
          <div className="text-2xl font-black text-emerald-400 font-display">
            {accuracy}%
          </div>
          <span className="text-[10px] text-slate-500">
            {stats.correctAnswers}/{stats.totalAnswered} correct
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-xs text-slate-400 font-medium block mb-1">Max Streak</span>
          <div className="text-2xl font-black text-pink-400 font-display flex items-center justify-center gap-1">
            <Flame size={20} />
            <span>{stats.highestStreak}</span>
          </div>
          <span className="text-[10px] text-slate-500">consecutive</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-xs text-slate-400 font-medium block mb-1">Lifelines</span>
          <div className="text-2xl font-black text-indigo-400 font-display">
            {stats.lifelinesUsed}
          </div>
          <span className="text-[10px] text-slate-500">utilized</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          onClick={onPlayAgain}
          className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01]"
        >
          <RotateCcw size={16} />
          <span>Play Again with {host.name}</span>
        </button>

        <button
          onClick={onOpenLiveIntercom}
          className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-pink-300 hover:text-white border border-pink-500/40 hover:border-pink-400 font-bold text-sm flex items-center justify-center gap-2 transition-all"
        >
          <Radio size={16} className="text-pink-400 animate-pulse" />
          <span>Voice Debrief (Gemini Live)</span>
        </button>

        <button
          onClick={onChangeHost}
          className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Users size={16} />
          <span>Change Host</span>
        </button>
      </div>
    </div>
  );
};
