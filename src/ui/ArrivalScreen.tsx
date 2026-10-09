import React from 'react';
import { Rocket, Sparkles, BookOpen } from 'lucide-react';

interface ArrivalProps {
  onStartMission: () => void;
  onOpenCredits: () => void;
}

export const ArrivalScreen: React.FC<ArrivalProps> = ({ onStartMission, onOpenCredits }) => {
  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-8">
      {/* Top NASA Space Apps Challenge Badge */}
      <div className="pointer-events-auto flex items-center justify-between">
        <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 rounded-2xl px-4 py-2">
          <img
            src="/images/logo.png"
            alt="Space Apps Logo"
            className="w-7 h-7 rounded-full border border-cyan-400/60"
          />
          <div className="text-[11px] font-mono tracking-wider">
            <span className="text-cyan-400 font-bold block">NASA SPACE APPS CHALLENGE 2026</span>
            <span className="text-slate-400">MISSION PROJECT // EDUCATIONAL SIMULATION</span>
          </div>
        </div>

        <button
          onClick={onOpenCredits}
          className="pointer-events-auto bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span>ATTRIBUTIONS & CREDITS</span>
        </button>
      </div>

      {/* Center Cinematic Title Treatment */}
      <div className="pointer-events-auto max-w-xl mx-auto text-center flex flex-col items-center gap-4 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 p-8 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-500">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>INTERACTIVE LUNAR ENVIRONMENT</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-cyan-200 to-blue-400">
          OUTPOST
        </h1>

        <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans max-w-md">
          Step foot onto the lunar South Pole. Balance solar power, battery storage, greenhouse crops, and research as unforeseen space emergencies strike.
        </p>

        {/* Start Mission Button */}
        <button
          onClick={onStartMission}
          className="mt-2 group relative px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-2xl flex items-center gap-2.5 transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95"
        >
          <Rocket className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          <span>START EXPEDITION</span>
        </button>

        <div className="text-[11px] font-mono text-slate-400">
          Click any lunar subsystem to inspect • Orbit with mouse / touch
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] font-mono text-slate-400">
        POWERED BY THREE.JS • WEB AUDIO • DETERMINISTIC MULTI-SYSTEM SIMULATION
      </div>
    </div>
  );
};
