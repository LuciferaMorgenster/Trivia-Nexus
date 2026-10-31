import React from 'react';
import { X, ExternalLink, Globe, CheckCircle2, Search } from 'lucide-react';
import { GroundingSource } from '../types/trivia';

interface GroundingSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: GroundingSource[];
  topicTitle?: string;
  explanation?: string;
}

export const GroundingSourcesModal: React.FC<GroundingSourcesModalProps> = ({
  isOpen,
  onClose,
  sources,
  topicTitle = 'Current Trivia Intel',
  explanation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl p-6 sm:p-7 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-md">
            <Search size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-lg font-display">
                Google Search Grounding
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live web verification powering questions and explanations
            </p>
          </div>
        </div>

        {explanation && (
          <div className="mb-5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-emerald-400 block mb-1 uppercase tracking-wider text-[10px]">
              Intel Breakdown:
            </span>
            {explanation}
          </div>
        )}

        <div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
            Grounded Web Sources & Citations ({sources.length}):
          </span>

          {sources.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 text-center">
              No direct external URLs returned for this item.
            </div>
          ) : (
            <div className="space-y-2.5">
              {sources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-xl bg-slate-950/90 hover:bg-indigo-950/40 border border-slate-800 hover:border-emerald-500/50 transition-all text-xs group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                      <Globe size={14} className="text-emerald-400 shrink-0" />
                      <span className="line-clamp-1">{src.title || 'Web Citation'}</span>
                    </div>
                    <ExternalLink size={13} className="text-slate-500 group-hover:text-emerald-300 shrink-0 mt-0.5" />
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-1 font-mono">
                    {src.uri}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            Close Intel
          </button>
        </div>
      </div>
    </div>
  );
};
