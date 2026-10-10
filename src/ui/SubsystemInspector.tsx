import React from 'react';
import { SubsystemState } from '../simulation/SimulationModels';
import { X, Activity, Zap, Info, Compass } from 'lucide-react';

interface InspectorProps {
  subsystem: SubsystemState | null;
  onClose: () => void;
  onFocus: () => void;
}

export const SubsystemInspector: React.FC<InspectorProps> = ({
  subsystem,
  onClose,
  onFocus
}) => {
  if (!subsystem) return null;

  const isGenerating = subsystem.powerConsumption < 0;

  return (
    <div className="absolute bottom-2.5 left-2.5 right-2.5 md:bottom-auto md:left-auto md:top-20 md:right-6 z-20 pointer-events-auto md:w-80 animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-300">
      <div className="bg-slate-950/95 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-3.5 sm:p-4 shadow-[0_0_30px_rgba(0,0,0,0.85)] max-h-[48dvh] md:max-h-none overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-2.5 sm:mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xl sm:text-2xl p-1 sm:p-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
              {subsystem.emoji}
            </span>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-100">{subsystem.title}</h3>
              <div className="text-[10px] sm:text-[11px] font-mono text-cyan-400">SUBSYSTEM TELEMETRY</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 active:bg-slate-700 transition-colors"
            aria-label="Close inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Status */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-2 sm:space-y-0 mb-2.5 sm:mb-3">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2 sm:p-2.5">
            <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Integrity</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">{subsystem.health}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all"
                style={{ width: `${subsystem.health}%` }}
              ></div>
            </div>
          </div>

          {/* Power Rate */}
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900/70 border border-slate-800 rounded-xl p-2 sm:p-2.5 text-[11px] sm:text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Power</span>
            </span>
            <span className={`font-bold mt-0.5 md:mt-0 ${isGenerating ? 'text-cyan-400' : 'text-amber-300'}`}>
              {isGenerating ? `+${Math.abs(subsystem.powerConsumption)} kW (Gen)` : `-${subsystem.powerConsumption} kW (Use)`}
            </span>
          </div>
        </div>

        {/* Telemetry Status Line */}
        <div className="text-[11px] sm:text-xs font-mono text-slate-300 bg-slate-900/40 border border-slate-800/80 rounded-lg p-2 flex items-center gap-2 mb-2.5 sm:mb-3">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0"></span>
          <span className="truncate">{subsystem.statusText}</span>
        </div>

        {/* Kid-Friendly Explanation */}
        <div className="bg-cyan-950/20 border border-cyan-800/40 rounded-xl p-2.5 sm:p-3 mb-3">
          <div className="text-[10px] sm:text-[11px] font-bold text-cyan-400 flex items-center gap-1.5 mb-0.5 sm:mb-1">
            <Info className="w-3.5 h-3.5 shrink-0" /> HOW THIS HELPS THE OUTPOST
          </div>
          <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-sans">
            {subsystem.kidExplanation}
          </p>
        </div>

        {/* Focus Action */}
        <button
          onClick={onFocus}
          className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>RE-CENTER IN 3D</span>
        </button>
      </div>
    </div>
  );
};

