import React from 'react';
import {
  GraduationCap,
  Zap,
  ShieldAlert,
  Sparkles,
  Bot,
  Volume2,
  PlusCircle,
  Check,
  Quote,
} from 'lucide-react';
import { HostProfile } from '../types/trivia';

interface HostSelectorProps {
  hosts: HostProfile[];
  selectedHost: HostProfile;
  onSelectHost: (host: HostProfile) => void;
  onOpenCustomHostModal: () => void;
  onPreviewGreeting: (host: HostProfile) => void;
  previewingHostId?: string | null;
}

const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap,
  Zap,
  ShieldAlert,
  Sparkles,
  Bot,
};

export const HostSelector: React.FC<HostSelectorProps> = ({
  hosts,
  selectedHost,
  onSelectHost,
  onOpenCustomHostModal,
  onPreviewGreeting,
  previewingHostId,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <span>Choose Your AI Host</span>
            <span className="text-xs font-normal text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded-full">
              Dynamic Personalities
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Each host brings distinct commentary, roasts, hints, and TTS voice persona
          </p>
        </div>

        <button
          onClick={onOpenCustomHostModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-md transition-all shrink-0"
        >
          <PlusCircle size={14} />
          <span>Create Custom Host</span>
        </button>
      </div>

      {/* Host Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {hosts.map((host) => {
          const isSelected = selectedHost.id === host.id;
          const isPreviewing = previewingHostId === host.id;
          const IconComp = ICON_MAP[host.avatarIcon] || Sparkles;

          return (
            <div
              key={host.id}
              onClick={() => onSelectHost(host)}
              className={`relative rounded-2xl p-4 transition-all cursor-pointer border text-left flex flex-col justify-between group overflow-hidden ${
                isSelected
                  ? 'bg-slate-900 border-indigo-500/80 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/50'
                  : 'bg-slate-900/60 border-slate-800/90 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              {/* Active Selection Glow Accent */}
              {isSelected && (
                <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              )}

              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${host.avatarBg} p-0.5 shadow-md flex items-center justify-center shrink-0`}
                    >
                      <div className="w-full h-full rounded-[10px] bg-slate-950/70 flex items-center justify-center text-white">
                        <IconComp size={22} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-white text-base tracking-tight leading-snug">
                          {host.name}
                        </h4>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-indigo-400 font-semibold block">
                        {host.alias}
                      </span>
                    </div>
                  </div>

                  {/* Audio preview button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewGreeting(host);
                    }}
                    disabled={isPreviewing}
                    className={`p-2 rounded-xl border transition-all shrink-0 ${
                      isPreviewing
                        ? 'bg-pink-600 text-white border-pink-400 animate-pulse'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/80'
                    }`}
                    title="Audition Host Voice (TTS)"
                  >
                    <Volume2 size={15} />
                  </button>
                </div>

                {/* Catchphrase & Tone */}
                <p className="text-xs text-slate-300 line-clamp-2 mb-2 leading-relaxed">
                  {host.tagline}
                </p>

                <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 text-[11px] text-slate-400 mb-3">
                  <div className="flex items-start gap-1.5 italic text-slate-300">
                    <Quote size={12} className="shrink-0 text-slate-500 mt-0.5" />
                    <span className="line-clamp-2">"{host.catchphrase}"</span>
                  </div>
                </div>
              </div>

              {/* Footer info: Voice tag */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  Voice Model: <span className="text-amber-400 font-bold">{host.voiceName}</span>
                </span>
                <span className="text-indigo-400 font-medium">
                  {isSelected ? 'Active Host' : 'Select'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
