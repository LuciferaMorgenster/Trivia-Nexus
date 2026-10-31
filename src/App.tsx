/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Radio,
  Play,
  RotateCcw,
  Search,
  Sliders,
  HelpCircle,
  Flame,
  CheckCircle2,
  BrainCircuit,
  Wand2,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import {
  HostProfile,
  PRESET_HOSTS,
  TriviaRoundData,
  TriviaQuestion,
  GameStatus,
  LifelineState,
  GameStats,
  VoiceName,
  GroundingSource,
} from './types/trivia';
import { HostAvatar } from './components/HostAvatar';
import { HostSelector } from './components/HostSelector';
import { CustomHostModal } from './components/CustomHostModal';
import { QuestionCard } from './components/QuestionCard';
import { LiveVoiceIntercom } from './components/LiveVoiceIntercom';
import { GroundingSourcesModal } from './components/GroundingSourcesModal';
import { RoundSummary } from './components/RoundSummary';
import { soundFx } from './utils/soundEffects';

const PRESET_TOPICS = [
  { id: 'pop', title: 'Pop Culture & Viral Moments', icon: '🔥', desc: 'Trends, streaming, memes, and current pop phenomena' },
  { id: 'science', title: 'Science, Space & Tech Frontiers', icon: '🚀', desc: 'Cosmic discoveries, quantum physics, and modern tech' },
  { id: 'movies', title: 'Cinema & Television Lore', icon: '🎬', desc: 'Blockbusters, iconic quotes, and awards history' },
  { id: 'history', title: 'World History & Oddities', icon: '🏛️', desc: 'Empire triumphs, ancient blunders, and mysterious figures' },
  { id: 'gaming', title: 'Video Games & Cyber Lore', icon: '🎮', desc: 'Retro classics, esports lore, and gaming icons' },
  { id: 'geography', title: 'World Geography & Food Culture', icon: '🌍', desc: 'Curious borders, landmarks, and culinary wonders' },
];

export default function App() {
  // Hosts state
  const [hosts, setHosts] = useState<HostProfile[]>(PRESET_HOSTS);
  const [selectedHost, setSelectedHost] = useState<HostProfile>(PRESET_HOSTS[0]);
  const [isCustomHostModalOpen, setIsCustomHostModalOpen] = useState(false);
  const [previewingHostId, setPreviewingHostId] = useState<string | null>(null);

  // Audio & speech state
  const [isHostSpeaking, setIsHostSpeaking] = useState(false);
  const [currentHostSpeech, setCurrentHostSpeech] = useState<string>(
    PRESET_HOSTS[0].sampleGreeting
  );
  const [lastAudioBase64, setLastAudioBase64] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [autoVoiceTTS, setAutoVoiceTTS] = useState(true);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Game setup parameters
  const [selectedTopic, setSelectedTopic] = useState('Pop Culture & Viral Moments');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Master'>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [useSearchGrounding, setUseSearchGrounding] = useState(true);

  // Game runtime state
  const [gameStatus, setGameStatus] = useState<GameStatus>('lobby');
  const [currentRoundData, setCurrentRoundData] = useState<TriviaRoundData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);

  // Lifelines
  const [lifelines, setLifelines] = useState<LifelineState>({
    fiftyFiftyUsed: false,
    hintUsed: false,
    factCheckUsed: false,
  });
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [isFactChecking, setIsFactChecking] = useState(false);
  const [factCheckData, setFactCheckData] = useState<{
    explanation: string;
    sources: GroundingSource[];
  } | null>(null);

  // Modals
  const [isLiveIntercomOpen, setIsLiveIntercomOpen] = useState(false);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);

  // Game Statistics
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    currentStreak: 0,
    highestStreak: 0,
    correctAnswers: 0,
    totalAnswered: 0,
    lifelinesUsed: 0,
    totalTimeSpentSec: 0,
  });

  const [closingCommentary, setClosingCommentary] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stop current audio helper
  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsHostSpeaking(false);
  };

  // Play WAV base64
  const playWavAudio = (base64Wav: string) => {
    if (isMuted) return;
    stopAudio();

    try {
      const audio = new Audio(`data:audio/wav;base64,${base64Wav}`);
      currentAudioRef.current = audio;
      setIsHostSpeaking(true);

      audio.onended = () => {
        setIsHostSpeaking(false);
      };
      audio.onerror = () => {
        setIsHostSpeaking(false);
      };

      audio.play().catch((err) => {
        console.warn('Audio play prevented:', err);
        setIsHostSpeaking(false);
      });
    } catch (e) {
      console.warn('Audio creation error:', e);
      setIsHostSpeaking(false);
    }
  };

  // Generate TTS Audio via server-side gemini-3.8-flash-tts
  const triggerHostTTS = async (text: string, host: HostProfile = selectedHost) => {
    if (isMuted) return;
    try {
      setIsHostSpeaking(true);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          speaker: host.name,
          style: host.speechStyle,
          voiceName: host.voiceName,
        }),
      });
      const data = await res.json();
      if (data.success && data.audio) {
        setLastAudioBase64(data.audio);
        playWavAudio(data.audio);
      } else {
        setIsHostSpeaking(false);
      }
    } catch (err) {
      console.error('TTS error:', err);
      setIsHostSpeaking(false);
    }
  };

  // Preview host greeting
  const handlePreviewHostGreeting = async (host: HostProfile) => {
    setPreviewingHostId(host.id);
    setCurrentHostSpeech(host.sampleGreeting);
    await triggerHostTTS(host.sampleGreeting, host);
    setPreviewingHostId(null);
  };

  // Change active host
  const handleSelectHost = (host: HostProfile) => {
    stopAudio();
    setSelectedHost(host);
    setCurrentHostSpeech(host.sampleGreeting);
    if (autoVoiceTTS) {
      triggerHostTTS(host.sampleGreeting, host);
    }
  };

  // Start Trivia Showdown
  const handleStartGame = async () => {
    stopAudio();
    setErrorMessage(null);
    setGameStatus('generating');

    const topicToUse = customTopic.trim() || selectedTopic;

    try {
      const res = await fetch('/api/trivia/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicToUse,
          difficulty,
          questionCount,
          hostName: selectedHost.name,
          hostTone: selectedHost.tone,
          useSearchGrounding,
        }),
      });

      const json = await res.json();
      if (!json.success || !json.data || !json.data.questions?.length) {
        throw new Error(json.error || 'Failed to generate questions. Please retry.');
      }

      const round: TriviaRoundData = {
        categoryTitle: json.data.categoryTitle || topicToUse,
        hostIntro: json.data.hostIntro || `Welcome to ${topicToUse} trivia! Let's begin!`,
        questions: json.data.questions,
        groundingSources: json.groundingSources || [],
        searchGrounded: json.searchGrounded,
      };

      setCurrentRoundData(round);
      setCurrentQuestionIndex(0);
      setIsAnswerSubmitted(false);
      setSelectedAnswerIndex(null);
      setActiveHint(null);
      setFactCheckData(null);
      setLifelines({ fiftyFiftyUsed: false, hintUsed: false, factCheckUsed: false });

      // Reset game stats
      setStats({
        score: 0,
        currentStreak: 0,
        highestStreak: 0,
        correctAnswers: 0,
        totalAnswered: 0,
        lifelinesUsed: 0,
        totalTimeSpentSec: 0,
      });

      setGameStatus('in_game');

      // Present first question with host intro
      const firstQ = round.questions[0];
      const introComment = firstQ.hostIntroComment || round.hostIntro;
      setCurrentHostSpeech(introComment);

      if (autoVoiceTTS) {
        triggerHostTTS(introComment, selectedHost);
      }
    } catch (err: any) {
      console.error('Failed to start trivia round:', err);
      setErrorMessage(err.message || 'Error communicating with Gemini game engine.');
      setGameStatus('lobby');
    }
  };

  // Contestant answers a question
  const handleAnswerSelected = async (selectedIndex: number, timeSpentSec: number) => {
    if (isAnswerSubmitted || !currentRoundData) return;

    const currentQ = currentRoundData.questions[currentQuestionIndex];
    const isCorrect = selectedIndex === currentQ.correctAnswerIndex;

    setSelectedAnswerIndex(selectedIndex);
    setIsAnswerSubmitted(true);

    if (isCorrect) {
      soundFx.playCorrect();
      const newStreak = stats.currentStreak + 1;
      const streakBonus = Math.floor(newStreak / 2) * 50;
      const pointsEarned = currentQ.points + streakBonus;

      if (newStreak >= 3) {
        soundFx.playStreakFanfare();
      }

      setStats((prev) => ({
        ...prev,
        score: prev.score + pointsEarned,
        currentStreak: newStreak,
        highestStreak: Math.max(prev.highestStreak, newStreak),
        correctAnswers: prev.correctAnswers + 1,
        totalAnswered: prev.totalAnswered + 1,
        totalTimeSpentSec: prev.totalTimeSpentSec + timeSpentSec,
      }));

      const reaction = currentQ.hostCorrectReaction || 'Spot on! Marvelous answer!';
      setCurrentHostSpeech(reaction);
      if (autoVoiceTTS) {
        triggerHostTTS(reaction, selectedHost);
      }
    } else {
      soundFx.playWrong();
      setStats((prev) => ({
        ...prev,
        currentStreak: 0,
        totalAnswered: prev.totalAnswered + 1,
        totalTimeSpentSec: prev.totalTimeSpentSec + timeSpentSec,
      }));

      const reaction = currentQ.hostIncorrectReaction || 'Alas, entirely mistaken!';
      setCurrentHostSpeech(reaction);
      if (autoVoiceTTS) {
        triggerHostTTS(reaction, selectedHost);
      }
    }
  };

  // Next Question
  const handleNextQuestion = () => {
    if (!currentRoundData) return;

    stopAudio();
    setActiveHint(null);
    setFactCheckData(null);
    setIsAnswerSubmitted(false);
    setSelectedAnswerIndex(null);

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < currentRoundData.questions.length) {
      setCurrentQuestionIndex(nextIndex);
      const nextQ = currentRoundData.questions[nextIndex];
      const comment = nextQ.hostIntroComment || `Question ${nextIndex + 1}...`;
      setCurrentHostSpeech(comment);
      if (autoVoiceTTS) {
        triggerHostTTS(comment, selectedHost);
      }
    } else {
      // Round Complete! Generate closing verdict
      handleFinishRound();
    }
  };

  // Finish Round
  const handleFinishRound = async () => {
    stopAudio();
    setGameStatus('round_ended');

    const accuracy =
      stats.totalAnswered > 0
        ? Math.round((stats.correctAnswers / stats.totalAnswered) * 100)
        : 0;

    // Generate dynamic closing commentary
    try {
      const res = await fetch('/api/trivia/host-react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: selectedHost.name,
          hostTone: selectedHost.tone,
          situation: accuracy >= 70 ? 'high_score_celebration' : 'mediocre_score_roast',
          score: stats.score,
          streak: stats.highestStreak,
        }),
      });
      const data = await res.json();
      const verdict =
        data.commentary ||
        `That concludes the showdown! You finished with ${stats.score} points!`;
      setClosingCommentary(verdict);
      setCurrentHostSpeech(verdict);
      if (autoVoiceTTS) {
        triggerHostTTS(verdict, selectedHost);
      }
    } catch {
      const fallback = `Well played! You achieved a score of ${stats.score} with a streak of ${stats.highestStreak}!`;
      setClosingCommentary(fallback);
      setCurrentHostSpeech(fallback);
    }
  };

  // Host Hint Lifeline
  const handleUseHint = async () => {
    if (lifelines.hintUsed || isAnswerSubmitted || !currentRoundData) return;

    setIsHintLoading(true);
    setLifelines((prev) => ({ ...prev, hintUsed: true }));
    setStats((prev) => ({ ...prev, lifelinesUsed: prev.lifelinesUsed + 1 }));
    soundFx.playLifelineWhoosh();

    const currentQ = currentRoundData.questions[currentQuestionIndex];

    try {
      const hint = currentQ.hint || 'Focus on the most prominent historical connection!';
      setActiveHint(hint);
      setCurrentHostSpeech(`Hint: "${hint}"`);
      if (autoVoiceTTS) {
        triggerHostTTS(`Here is a little nudge: ${hint}`, selectedHost);
      }
    } finally {
      setIsHintLoading(false);
    }
  };

  // Live Grounded Search Fact-Check Lifeline
  const handleTriggerFactCheck = async () => {
    if (lifelines.factCheckUsed || isAnswerSubmitted || !currentRoundData) return;

    setIsFactChecking(true);
    setLifelines((prev) => ({ ...prev, factCheckUsed: true }));
    setStats((prev) => ({ ...prev, lifelinesUsed: prev.lifelinesUsed + 1 }));
    soundFx.playLifelineWhoosh();

    const currentQ = currentRoundData.questions[currentQuestionIndex];

    try {
      const res = await fetch('/api/trivia/grounded-factcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          options: currentQ.options,
          hostName: selectedHost.name,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFactCheckData({
          explanation: data.explanation,
          sources: data.sources || [],
        });
      }
    } catch (err) {
      console.error('Fact-check error:', err);
    } finally {
      setIsFactChecking(false);
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (!isMuted) {
      stopAudio();
      setIsMuted(true);
    } else {
      setIsMuted(false);
      if (lastAudioBase64) {
        playWavAudio(lastAudioBase64);
      }
    }
  };

  const currentQ =
    currentRoundData && currentRoundData.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-indigo-400">
                <BrainCircuit size={20} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg tracking-tight text-white">
                  TRIVIA NEXUS
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/30">
                  AI Host Showdown
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Dynamic Personalities • Gemini 3.8 Flash TTS • Gemini Live Voice
              </p>
            </div>
          </div>

          {/* Top Right Controls & Score */}
          <div className="flex items-center gap-2 sm:gap-4">
            {gameStatus === 'in_game' && (
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-2xl text-xs font-mono">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Trophy size={14} />
                  <span>{stats.score}</span>
                </div>
                {stats.currentStreak > 1 && (
                  <div className="flex items-center gap-1 text-pink-400 font-bold animate-pulse">
                    <Flame size={14} />
                    <span>x{stats.currentStreak}</span>
                  </div>
                )}
              </div>
            )}

            {/* Live Intercom Contestant Mic Trigger */}
            <button
              onClick={() => setIsLiveIntercomOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 hover:text-white border border-pink-500/40 text-xs font-bold transition-all shadow-sm"
              title="Open Gemini 3.8 Live Voice Intercom"
            >
              <Radio size={14} className="animate-pulse text-pink-400" />
              <span className="hidden sm:inline">Host Live Mic</span>
            </button>

            {/* Sound FX & TTS Mute toggle */}
            <button
              onClick={toggleMute}
              className={`p-2 rounded-xl border transition-all ${
                isMuted
                  ? 'bg-rose-950/50 border-rose-800 text-rose-400'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col justify-center">
        {errorMessage && (
          <div className="max-w-2xl mx-auto mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-white underline font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 1: LOBBY & SETUP                                */}
        {/* ---------------------------------------------------- */}
        {gameStatus === 'lobby' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Active Host Stage Banner */}
            <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-pink-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

              <HostAvatar
                host={selectedHost}
                isSpeaking={isHostSpeaking}
                speechText={currentHostSpeech}
                onReplaySpeech={() => triggerHostTTS(currentHostSpeech, selectedHost)}
                onToggleMute={toggleMute}
                isMuted={isMuted}
                size="lg"
              />

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Host Engine: <strong className="text-white">Gemini 3.8 Flash</strong></span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span>TTS Model: <strong className="text-amber-400">gemini-3.8-flash-tts</strong></span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
                    <input
                      type="checkbox"
                      checked={autoVoiceTTS}
                      onChange={(e) => setAutoVoiceTTS(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Auto-Speak Commentary (TTS)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Host Carousel & Selector */}
            <HostSelector
              hosts={hosts}
              selectedHost={selectedHost}
              onSelectHost={handleSelectHost}
              onOpenCustomHostModal={() => setIsCustomHostModalOpen(true)}
              onPreviewGreeting={handlePreviewHostGreeting}
              previewingHostId={previewingHostId}
            />

            {/* Game Setup Panel: Topics & Rules */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              <h3 className="text-lg font-bold text-white font-display mb-1 flex items-center gap-2">
                <span>Select Trivia Category</span>
                <span className="text-xs font-normal text-slate-400">
                  (or type your custom niche topic)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Questions are uniquely generated and verified in real time
              </p>

              {/* Topic Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {PRESET_TOPICS.map((topic) => {
                  const isSelected = selectedTopic === topic.title && !customTopic;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => {
                        setSelectedTopic(topic.title);
                        setCustomTopic('');
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                          : 'bg-slate-950/70 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <span className="text-2xl shrink-0 mt-0.5">{topic.icon}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-sm leading-tight text-white">
                          {topic.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          {topic.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Topic Input */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Or enter any custom topic:
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Formula 1 Champions, 90s Grunge Rock, Marvel Multiverse, French Impressionism..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none placeholder:text-slate-600"
                />
              </div>

              {/* Settings Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 mb-6">
                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['Easy', 'Medium', 'Hard', 'Master'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          difficulty === lvl
                            ? 'bg-indigo-600 border-indigo-400 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Count */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Question Count
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[3, 5, 8, 10].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQuestionCount(count)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          questionCount === count
                            ? 'bg-indigo-600 border-indigo-400 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {count} Qs
                      </button>
                    ))}
                  </div>
                </div>

                {/* Google Search Grounding Switch */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Search size={13} className="text-emerald-400" />
                    <span>Search Grounding</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseSearchGrounding((prev) => !prev)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                      useSearchGrounding
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    <span>Google Search Verification</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        useSearchGrounding ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-700'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Start Game Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400 text-center sm:text-left">
                  Host: <strong className="text-white">{selectedHost.name}</strong> • Topic:{' '}
                  <strong className="text-indigo-300">{customTopic || selectedTopic}</strong>
                </div>

                <button
                  onClick={handleStartGame}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-display font-black text-base shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
                >
                  <Play size={18} fill="currentColor" />
                  <span>Start Trivia Showdown</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 2: GENERATING ROUND                              */}
        {/* ---------------------------------------------------- */}
        {gameStatus === 'generating' && (
          <div className="max-w-md mx-auto text-center space-y-6 py-12 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500 animate-spin blur-md opacity-75" />
              <div className="relative w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-indigo-400 border border-indigo-500/50">
                <Loader2 size={40} className="animate-spin text-pink-400" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white font-display">
                {selectedHost.name} is Preparing the Show...
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Crafting tailored questions with{' '}
                {useSearchGrounding ? 'Google Search Grounding' : 'trivia intelligence'}...
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs italic text-slate-300">
              "{selectedHost.catchphrase}"
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 3: IN GAME (ACTIVE QUESTION)                    */}
        {/* ---------------------------------------------------- */}
        {gameStatus === 'in_game' && currentRoundData && currentQ && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Host Banner on Stage */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md">
              <HostAvatar
                host={selectedHost}
                isSpeaking={isHostSpeaking}
                speechText={currentHostSpeech}
                onReplaySpeech={() => triggerHostTTS(currentHostSpeech, selectedHost)}
                onToggleMute={toggleMute}
                isMuted={isMuted}
                size="md"
              />
            </div>

            {/* Question Card */}
            <QuestionCard
              question={currentQ}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={currentRoundData.questions.length}
              host={selectedHost}
              onAnswerSelected={handleAnswerSelected}
              onNextQuestion={handleNextQuestion}
              isAnswerSubmitted={isAnswerSubmitted}
              selectedAnswerIndex={selectedAnswerIndex}
              onOpenLiveIntercom={() => setIsLiveIntercomOpen(true)}
              onTriggerFactCheck={handleTriggerFactCheck}
              isFactChecking={isFactChecking}
              factCheckData={factCheckData}
              lifelines={lifelines}
              onUseFiftyFifty={() =>
                setLifelines((prev) => ({ ...prev, fiftyFiftyUsed: true }))
              }
              onUseHint={handleUseHint}
              activeHint={activeHint}
              isHintLoading={isHintLoading}
              groundingSources={currentRoundData.groundingSources}
              onOpenSourcesModal={() => setIsSourcesModalOpen(true)}
            />
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 4: ROUND ENDED (SUMMARY & PODIUM)               */}
        {/* ---------------------------------------------------- */}
        {gameStatus === 'round_ended' && currentRoundData && (
          <RoundSummary
            stats={stats}
            host={selectedHost}
            topicTitle={currentRoundData.categoryTitle}
            onPlayAgain={() => {
              setGameStatus('lobby');
              handleStartGame();
            }}
            onChangeHost={() => {
              setGameStatus('lobby');
            }}
            onOpenLiveIntercom={() => setIsLiveIntercomOpen(true)}
            closingHostCommentary={closingCommentary}
            isHostSpeaking={isHostSpeaking}
            onReplayAudio={() => triggerHostTTS(closingCommentary, selectedHost)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500 bg-slate-950/60">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Powered by Google Gemini Models: <span className="text-slate-400">gemini-3.8-flash</span> •{' '}
            <span className="text-slate-400">gemini-3.8-flash-tts</span> •{' '}
            <span className="text-slate-400">gemini-3.8-live</span>
          </span>
          <span className="text-slate-600">Trivia Nexus Broadcast System</span>
        </div>
      </footer>

      {/* Custom Host Creation Modal */}
      <CustomHostModal
        isOpen={isCustomHostModalOpen}
        onClose={() => setIsCustomHostModalOpen(false)}
        onSaveHost={(newHost) => {
          setHosts((prev) => [newHost, ...prev]);
          handleSelectHost(newHost);
        }}
        onPlayTestAudio={async (text, voiceName, style) => {
          await triggerHostTTS(text, {
            ...selectedHost,
            voiceName,
            speechStyle: style,
          });
        }}
      />

      {/* Live Voice Intercom Modal (Gemini 3.8 Live API) */}
      <LiveVoiceIntercom
        isOpen={isLiveIntercomOpen}
        onClose={() => setIsLiveIntercomOpen(false)}
        host={selectedHost}
        currentQuestion={currentQ ? currentQ.question : undefined}
        score={stats.score}
      />

      {/* Grounding Sources Modal (Google Search Citations) */}
      <GroundingSourcesModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
        sources={
          factCheckData?.sources || currentRoundData?.groundingSources || []
        }
        topicTitle={currentRoundData?.categoryTitle}
        explanation={factCheckData?.explanation || currentQ?.explanation}
      />
    </div>
  );
}
