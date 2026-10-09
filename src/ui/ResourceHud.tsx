import React from 'react';
import { ResourceState } from '../simulation/SimulationModels';
import { Zap, Battery, Droplets, Apple, Wind, Heart, Award, Volume2, VolumeX, RotateCcw, AlertTriangle } from 'lucide-react';

interface ResourceHudProps {
  resources: ResourceState;
  sol: number;
  cycle: number;
  maxCycles: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onResetCamera: () => void;
  onTriggerCrisis: () => void;
  inCrisis: boolean;
}

export const ResourceHud: React.FC<ResourceHudProps> = ({
  resources,
  sol,
  cycle,
  maxCycles,
  isMuted,
  onToggleMute,
  onResetCamera,
  onTriggerCrisis,
  inCrisis
}) => {
  const getBatteryColor = (val: number) => {
    if (val <= 25) return 'text-red-400 border-red-500/50 bg-red-950/40 animate-pulse';
    if (val <= 50) return 'text-amber-400 border-amber-500/50 bg-amber-950/40';
    return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
  };

  const getGaugeWidth = (val: number) => `${Math.max(4, Math.min(100, val))}%`;

  return (
    <header className="absolute top-0 left-0 right-0 z-20 p-3 pointer-events-none flex flex-col md:flex-row items-center justify-between gap-3">
      {/* Outpost Mission Sol & Badge */}
      <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-4 py-2 shadow-2xl">
        <div className="flex items-center gap-2">
          <img src="/images/logo.png" alt="Logo" className="w-8 h-8 rounded-full border border-cyan-500/50 object-cover" />
          <div>
            <div className="text-xs font-bold tracking-widest text-cyan-400 flex items-center gap-1.5">
              <span>OUTPOST LUNAR BASE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              SOL {sol} • CYCLE {cycle}/{maxCycles}
            </div>
          </div>
        </div>

        {/* Crisis Alert Trigger Button */}
        {!inCrisis && (
          <button
            onClick={onTriggerCrisis}
            className="ml-2 px-2.5 py-1 text-[11px] font-bold text-amber-300 bg-amber-950/70 hover:bg-amber-800/80 border border-amber-500/50 rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:scale-105"
            title="Simulate Solar Mountain Shadow"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>CRISIS TEST</span>
          </button>
        )}
      </div>

      {/* Vital Resource Gauges */}
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-4 py-2 shadow-2xl">
        {/* Power */}
        <div className="flex items-center gap-2 px-2 py-1 bg-slate-800/60 border border-slate-700 rounded-lg">
          <Zap className="w-4 h-4 text-amber-400" />
          <div className="text-xs font-mono">
            <span className="text-slate-400 mr-1">PWR</span>
            <span className="font-bold text-slate-100">{Math.round(resources.power)}%</span>
          </div>
        </div>

        {/* Battery */}
        <div className={`flex items-center gap-2 px-2 py-1 border rounded-lg transition-all ${getBatteryColor(resources.battery)}`}>
          <Battery className="w-4 h-4" />
          <div className="text-xs font-mono">
            <span className="opacity-75 mr-1">BAT</span>
            <span className="font-bold">{Math.round(resources.battery)}%</span>
          </div>
        </div>

        {/* Water */}
        <div className="flex items-center gap-2 px-2 py-1 bg-slate-800/60 border border-slate-700 rounded-lg">
          <Droplets className="w-4 h-4 text-blue-400" />
          <div className="text-xs font-mono">
            <span className="text-slate-400 mr-1">H₂O</span>
            <span className="font-bold text-slate-100">{Math.round(resources.water)}%</span>
          </div>
        </div>

        {/* Food */}
        <div className="flex items-center gap-2 px-2 py-1 bg-slate-800/60 border border-slate-700 rounded-lg">
          <Apple className="w-4 h-4 text-emerald-400" />
          <div className="text-xs font-mono">
            <span className="text-slate-400 mr-1">FOOD</span>
            <span className="font-bold text-slate-100">{Math.round(resources.food)}%</span>
          </div>
        </div>

        {/* Oxygen */}
        <div className="flex items-center gap-2 px-2 py-1 bg-slate-800/60 border border-slate-700 rounded-lg">
          <Wind className="w-4 h-4 text-cyan-300" />
          <div className="text-xs font-mono">
            <span className="text-slate-400 mr-1">O₂</span>
            <span className="font-bold text-slate-100">{Math.round(resources.oxygen)}%</span>
          </div>
        </div>

        {/* Crew Health */}
        <div className="flex items-center gap-2 px-2 py-1 bg-slate-800/60 border border-slate-700 rounded-lg">
          <Heart className="w-4 h-4 text-rose-400" />
          <div className="text-xs font-mono">
            <span className="text-slate-400 mr-1">CREW</span>
            <span className="font-bold text-slate-100">{Math.round(resources.crewHealth)}%</span>
          </div>
        </div>

        {/* Science Points */}
        <div className="flex items-center gap-2 px-2.5 py-1 bg-purple-950/40 border border-purple-500/40 rounded-lg">
          <Award className="w-4 h-4 text-purple-400" />
          <div className="text-xs font-mono">
            <span className="text-purple-300 font-bold">{resources.scienceScore}</span>
            <span className="text-purple-400/80 text-[10px] ml-1">PTS</span>
          </div>
        </div>
      </div>

      {/* Audio Mute & Camera Controls */}
      <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl p-1.5 shadow-2xl">
        <button
          onClick={onToggleMute}
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-lg transition-colors"
          title={isMuted ? "Unmute Audio" : "Mute Audio"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        <button
          onClick={onResetCamera}
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-lg transition-colors"
          title="Reset Camera Overview"
        >
          <RotateCcw className="w-4 h-4 text-slate-300" />
        </button>
      </div>
    </header>
  );
};
