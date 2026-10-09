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
    <div className="absolute top-20 right-6 z-20 pointer-events-auto w-80 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
              {subsystem.emoji}
            </span>
            <div>
              <h3 className="font-bold text-sm text-slate-100">{subsystem.title}</h3>
              <div className="text-[11px] font-mono text-cyan-400">SUBSYSTEM METRICS</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Status */}
        <div className="space-y-3 mb-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> System Integrity
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
          <div className="flex items-center justify-between bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Electrical Power
            </span>
            <span className={`font-bold ${isGenerating ? 'text-cyan-400' : 'text-amber-300'}`}>
              {isGenerating ? `+${Math.abs(subsystem.powerConsumption)} kW (Gen)` : `-${subsystem.powerConsumption} kW (Use)`}
            </span>
          </div>

          {/* Telemetry Status Line */}
          <div className="text-xs font-mono text-slate-300 bg-slate-900/40 border border-slate-800/80 rounded-lg p-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>{subsystem.statusText}</span>
          </div>
        </div>

        {/* Kid-Friendly Explanation */}
        <div className="bg-cyan-950/20 border border-cyan-800/40 rounded-xl p-3 mb-4">
          <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5 mb-1">
            <Info className="w-3.5 h-3.5" /> HOW THIS HELPS THE OUTPOST
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {subsystem.kidExplanation}
          </p>
        </div>

        {/* Focus Action */}
        <button
          onClick={onFocus}
          className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-[1.02]"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>INSPECT IN 3D</span>
        </button>
      </div>
    </div>
  );
};
