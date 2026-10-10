import React from 'react';
import { ResourceState } from '../simulation/SimulationModels';
import { Zap, Battery, Droplets, Apple, Wind, Heart, Award, Volume2, VolumeX, RotateCcw, AlertTriangle, Flag } from 'lucide-react';

interface ResourceHudProps {
  resources: ResourceState;
  sol: number;
  cycle: number;
  maxCycles: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onResetCamera: () => void;
  onTriggerCrisis: () => void;
  onOpenFinalResult: () => void;
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
  onOpenFinalResult,
  inCrisis
}) => {
  const getBatteryColor = (val: number) => {
    if (val <= 25) return 'text-red-400 border-red-500/50 bg-red-950/40 animate-pulse';
    if (val <= 50) return 'text-amber-400 border-amber-500/50 bg-amber-950/40';
    return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-20 p-2 sm:p-3 pointer-events-none flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-1.5 sm:gap-2.5">
      {/* Top Bar on Mobile: Outpost Badge + Action Buttons + Utility Icons */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
        <div className="pointer-events-auto flex items-center justify-between flex-1 xl:flex-initial gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-2xl min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/images/logo.png" alt="Logo" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-cyan-500/50 object-cover shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs font-bold tracking-wider text-cyan-400 flex items-center gap-1.5 truncate">
                <span className="truncate">OUTPOST</span>
                <span className="hidden sm:inline">LUNAR BASE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0"></span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 truncate">
                SOL {sol} • CYCLE {cycle}/{maxCycles}
              </div>
            </div>
          </div>

          {/* Crisis Alert Trigger & Final Result Buttons */}
          {!inCrisis && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={onTriggerCrisis}
                className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-amber-300 bg-amber-950/75 hover:bg-amber-800/80 border border-amber-500/50 rounded-lg flex items-center gap-1 transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)] active:scale-95"
                title="Simulate Lunar Crisis Decision"
              >
                <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                <span>{cycle < maxCycles ? 'CRISIS' : 'FINAL CRISIS'}</span>
              </button>

              <button
                onClick={onOpenFinalResult}
                className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-cyan-300 bg-cyan-950/75 hover:bg-cyan-800/80 border border-cyan-500/50 rounded-lg flex items-center gap-1 transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] active:scale-95"
                title="View Final Mission Result & Evaluation"
              >
                <Flag className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
                <span>RESULT</span>
              </button>
            </div>
          )}
        </div>

        {/* Audio Mute & Camera Controls (Inline on mobile so no 3rd row is needed) */}
        <div className="pointer-events-auto flex xl:hidden items-center gap-1 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl p-1 shadow-2xl shrink-0">
          <button
            onClick={onToggleMute}
            className="p-2 text-slate-300 hover:text-cyan-300 active:bg-slate-800 rounded-lg transition-colors"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={onResetCamera}
            className="p-2 text-slate-300 hover:text-cyan-300 active:bg-slate-800 rounded-lg transition-colors"
            title="Reset Camera Overview"
          >
            <RotateCcw className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Vital Resource Gauges (Single horizontal scrollable strip on mobile, wrapped on desktop) */}
      <div className="pointer-events-auto flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-2xl">
        {/* Power */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:py-1 bg-slate-800/60 border border-slate-700 rounded-lg shrink-0">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <div className="text-[11px] sm:text-xs font-mono">
            <span className="text-slate-400 mr-1">PWR</span>
            <span className="font-bold text-slate-100">{Math.round(resources.power)}%</span>
          </div>
        </div>

        {/* Battery */}
        <div className={`flex items-center gap-1.5 px-2 py-0.5 sm:py-1 border rounded-lg transition-all shrink-0 ${getBatteryColor(resources.battery)}`}>
          <Battery className="w-3.5 h-3.5" />
          <div className="text-[11px] sm:text-xs font-mono">
            <span className="opacity-75 mr-1">BAT</span>
            <span className="font-bold">{Math.round(resources.battery)}%</span>
          </div>
        </div>

        {/* Water */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:py-1 bg-slate-800/60 border border-slate-700 rounded-lg shrink-0">
          <Droplets className="w-3.5 h-3.5 text-blue-400" />
          <div className="text-[11px] sm:text-xs font-mono">
            <span className="text-slate-400 mr-1">H₂O</span>
            <span className="font-bold text-slate-100">{Math.round(resources.water)}%</span>
          </div>
        </div>

        {/* Food */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:py-1 bg-slate-800/60 border border-slate-700 rounded-lg shrink-0">
          <Apple className="w-3.5 h-3.5 text-emerald-400" />
          <div className="text-[11px] sm:text-xs font-mono">
            <span className="text-slate-400 mr-1">FOOD</span>
            <span className="font-bold text-slate-100">{Math.round(resources.food)}%</span>
          </div>
        </div>

        {/* Oxygen */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:py-1 bg-slate-800/60 border border-slate-700 rounded-lg shrink-0">
          <Wind className="w-3.5 h-3.5 text-cyan-300" />
          <div className="text-[11px] sm:text-xs font-mono">
            <span className="text-slate-400 mr-1">O₂</span>
            <span className="font-bold text-slate-100">{Math.round(resources.oxygen)}%</span>
          </div>
        </div>

        {/* Crew Health */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:py-1 bg-slate-800/60 border border-slate-700 rounded-lg shrink-0">
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          <div className="text-[11px] sm:text-xs font-mono">
            <span className="text-slate-400 mr-1">CREW</span>
            <span className="font-bold text-slate-100">{Math.round(resources.crewHealth)}%</span>
          </div>
        </div>

        {/* Science Points */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:py-1 bg-purple-950/40 border border-purple-500/40 rounded-lg shrink-0">
          <Award className="w-3.5 h-3.5 text-purple-400" />
          <div className="text-[11px] sm:text-xs font-mono">
            <span className="text-purple-300 font-bold">{resources.scienceScore}</span>
            <span className="text-purple-400/80 text-[10px] ml-1">PTS</span>
          </div>
        </div>
      </div>

      {/* Desktop Audio Mute & Camera Controls */}
      <div className="pointer-events-auto hidden xl:flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl p-1.5 shadow-2xl shrink-0">
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

