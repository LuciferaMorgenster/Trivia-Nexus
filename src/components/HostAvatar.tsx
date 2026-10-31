import React from 'react';
import {
  GraduationCap,
  Zap,
  ShieldAlert,
  Sparkles,
  Bot,
  Volume2,
  VolumeX,
  Mic,
  Radio,
  RotateCcw,
} from 'lucide-react';
import { HostProfile } from '../types/trivia';

interface HostAvatarProps {
  host: HostProfile;
  isSpeaking: boolean;
  isListening?: boolean;
  speechText?: string;
  volumeLevel?: number; // 0.0 to 1.0
  onReplaySpeech?: () => void;
  onToggleMute?: () => void;
  isMuted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showBubble?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap,
  Zap,
  ShieldAlert,
  Sparkles,
  Bot,
};

export const HostAvatar: React.FC<HostAvatarProps> = ({
  host,
  isSpeaking,
  isListening = false,
  speechText,
  volumeLevel = 0,
  onReplaySpeech,
  onToggleMute,
  isMuted = false,
  size = 'md',
  showBubble = true,
}) => {
  const IconComponent = ICON_MAP[host.avatarIcon] || Sparkles;

  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-20 h-20 text-2xl',
    lg: 'w-28 h-28 text-4xl',
  }[size];

  const iconSizes = {
    sm: 20,
    md: 34,
    lg: 48,
  }[size];

  // Dynamic scale calculation based on speech volume
  const scaleEffect = isSpeaking ? 1 + Math.min(0.18, (volumeLevel || 0.4) * 0.25) : 1;

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 relative">
      {/* Avatar Container with Animated Glow */}
      <div className="relative group shrink-0">
        {/* Animated aura ring */}
        <div
          className={`absolute -inset-2 rounded-full transition-all duration-300 blur-md ${
            isSpeaking
              ? 'opacity-90 bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-500 animate-pulse'
              : isListening
              ? 'opacity-80 bg-emerald-500 animate-ping'
              : 'opacity-30 bg-slate-700'
          }`}
        />

        {/* Outer Ring */}
        <div
          style={{ transform: `scale(${scaleEffect})` }}
          className={`relative ${sizeClasses} rounded-full bg-gradient-to-br ${host.avatarBg} p-1 shadow-2xl flex items-center justify-center transition-transform duration-150 border-2 border-white/20`}
        >
          <div className="w-full h-full rounded-full bg-slate-900/60 backdrop-blur-sm flex items-center justify-center text-white relative overflow-hidden">
            <IconComponent size={iconSizes} className="drop-shadow-md z-10" />

            {/* Speaking audio wave background effect */}
            {isSpeaking && (
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute -bottom-1 -right-1 flex items-center justify-center">
          {isSpeaking ? (
            <span className="flex h-5 w-5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-pink-500 border-2 border-slate-950 items-center justify-center text-[9px] text-white font-bold">
                <Radio size={10} className="animate-spin" />
              </span>
            </span>
          ) : isListening ? (
            <span className="flex h-5 w-5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-slate-950 items-center justify-center text-[9px] text-white font-bold">
                <Mic size={10} />
              </span>
            </span>
          ) : (
            <div className="w-4 h-4 rounded-full bg-emerald-500/80 border-2 border-slate-950" />
          )}
        </div>
      </div>

      {/* Host Details & Speech Bubble */}
      <div className="flex-1 min-w-0 flex flex-col items-center md:items-start text-center md:text-left">
        <div className="flex items-center gap-2 mb-1 flex-wrap justify-center md:justify-start">
          <span className="text-sm font-black tracking-wide uppercase px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/15">
            AI Host
          </span>
          <h3 className="font-bold text-white text-lg tracking-tight">
            {host.name}
          </h3>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            • {host.alias}
          </span>
        </div>

        {/* Speech Bubble / Host Commentary */}
        {showBubble && speechText && (
          <div className="relative mt-1 max-w-xl bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-3.5 shadow-xl backdrop-blur-md text-slate-200 text-sm">
            {/* Visualizer wave bars while speaking */}
            {isSpeaking && (
              <div className="flex items-center gap-1 mb-2 text-pink-400 text-xs font-semibold">
                <div className="flex items-end gap-0.5 h-3">
                  <span className="w-1 bg-pink-500 animate-wave-bar rounded-full" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 bg-pink-400 animate-wave-bar rounded-full" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 bg-pink-500 animate-wave-bar rounded-full" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 bg-pink-400 animate-wave-bar rounded-full" style={{ animationDelay: '450ms' }} />
                </div>
                <span className="uppercase tracking-wider text-[10px] ml-1">Live Commentary</span>
              </div>
            )}

            <p className="leading-relaxed text-slate-100 font-medium italic">
              "{speechText}"
            </p>

            {/* Bubble Action Controls */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                Voice: <span className="text-amber-400 font-semibold">{host.voiceName}</span>
              </span>

              <div className="flex items-center gap-2">
                {onReplaySpeech && (
                  <button
                    onClick={onReplaySpeech}
                    className="flex items-center gap-1 hover:text-white transition-colors px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-700/80"
                    title="Replay host voice"
                  >
                    <RotateCcw size={12} />
                    <span>Replay</span>
                  </button>
                )}
                {onToggleMute && (
                  <button
                    onClick={onToggleMute}
                    className="hover:text-white transition-colors p-1 rounded bg-slate-800/60 hover:bg-slate-700/80"
                    title={isMuted ? 'Unmute host' : 'Mute host'}
                  >
                    {isMuted ? <VolumeX size={13} className="text-rose-400" /> : <Volume2 size={13} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
