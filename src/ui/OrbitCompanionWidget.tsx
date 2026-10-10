import React from 'react';
import { Volume2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface OrbitWidgetProps {
  message: string;
  mood: 'normal' | 'alarmed' | 'thinking' | 'celebrating';
  onPlayVoice?: () => void;
  hasVoice?: boolean;
}

export const OrbitCompanionWidget: React.FC<OrbitWidgetProps> = ({
  message,
  mood,
  onPlayVoice,
  hasVoice = true
}) => {
  const getMoodBorder = () => {
    switch (mood) {
      case 'alarmed':
        return 'border-red-500/80 shadow-[0_0_24px_rgba(239,68,68,0.35)]';
      case 'celebrating':
        return 'border-emerald-500/80 shadow-[0_0_24px_rgba(16,185,129,0.35)]';
      case 'thinking':
        return 'border-amber-500/80 shadow-[0_0_24px_rgba(245,158,11,0.35)]';
      default:
        return 'border-cyan-500/60 shadow-[0_0_24px_rgba(6,182,212,0.25)]';
    }
  };

  const getMoodBadge = () => {
    switch (mood) {
      case 'alarmed':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full border border-red-500/40 animate-pulse">
            <AlertCircle className="w-3 h-3" /> ALERT
          </span>
        );
      case 'celebrating':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3" /> VICTORY
          </span>
        );
      case 'thinking':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/40">
            <Sparkles className="w-3 h-3" /> CALCULATING
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/40">
            AI MISSION COMPANION
          </span>
        );
    }
  };

  return (
    <div className="absolute bottom-14 left-2.5 right-2.5 sm:bottom-6 sm:left-6 sm:right-auto z-20 pointer-events-auto sm:max-w-sm">
      <div className={`flex items-center gap-2.5 sm:gap-3 bg-slate-950/90 backdrop-blur-md border ${getMoodBorder()} rounded-2xl p-2.5 sm:p-3.5 transition-all duration-300`}>
        {/* Animated Bot Avatar */}
        <div className="relative shrink-0 w-9 h-9 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
          <img
            src="/images/orbit_advisor.jpg"
            alt="ORBIT AI"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none"></div>
          {mood === 'alarmed' && (
            <div className="absolute inset-0 bg-red-600/30 animate-pulse pointer-events-none"></div>
          )}
        </div>

        {/* Message bubble */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5 sm:mb-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-[11px] sm:text-xs tracking-wider text-slate-100">ORBIT</span>
              {getMoodBadge()}
            </div>
            {hasVoice && onPlayVoice && (
              <button
                onClick={onPlayVoice}
                className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                title="Play Voice Audio"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-200 leading-snug sm:leading-relaxed font-sans font-medium line-clamp-2 sm:line-clamp-none">
            "{message}"
          </p>
        </div>
      </div>
    </div>
  );
};

