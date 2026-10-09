import React from 'react';
import { DecisionOption, ResourceState } from '../simulation/SimulationModels';
import { CheckCircle2, AlertOctagon, RotateCcw, ArrowRight, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';

interface ConsequenceProps {
  decision: DecisionOption;
  previousState: ResourceState;
  updatedState: ResourceState;
  onDismiss: () => void;
  onRewind: () => void;
}

export const ConsequenceSequence: React.FC<ConsequenceProps> = ({
  decision,
  previousState,
  updatedState,
  onDismiss,
  onRewind
}) => {
  const isDangerous = updatedState.battery <= 40 || decision.deltaBattery < -20;

  const keyLesson = decision.id === 'opt_solar_keep_running'
    ? "All space systems are connected: keeping non-essential science running at 100% drained the battery bank, pushing life support into danger!"
    : decision.id === 'opt_solar_reduce_science'
    ? "By pausing science during the shadow, you saved precious kilowatt-hours and kept habitat oxygen and heat completely safe!"
    : "Emergency mode ensured maximum survival margins, proving that crew safety always comes before mission objectives.";

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center p-4">
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-auto"></div>

      {/* Main card */}
      <div className="relative pointer-events-auto w-full max-w-lg bg-slate-950/95 border border-cyan-500/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
        {/* Outcome Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${
            isDangerous
              ? 'bg-red-950/60 border-red-500/60 text-red-400'
              : 'bg-emerald-950/60 border-emerald-500/60 text-emerald-400'
          }`}>
            {isDangerous ? <AlertOctagon className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>

          <div>
            <div className="text-[11px] font-mono text-cyan-400 tracking-wider uppercase">
              // CONSEQUENCE SIMULATION COMPLETE
            </div>
            <h2 className="text-base font-bold text-slate-100">
              {isDangerous ? 'BATTERY DRAIN WARNING ACTIVE' : 'OUTPOST POWER STABILIZED'}
            </h2>
          </div>
        </div>

        {/* Causal Feedback */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
          <div className="text-xs font-bold text-slate-200">
            Strategy Executed: <span className="text-cyan-400">{decision.title}</span>
          </div>

          {/* Metric Comparison */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">BATTERY CAPACITY</span>
              <div className="flex items-center gap-1 font-bold">
                <span className="text-slate-400">{Math.round(previousState.battery)}%</span>
                <span className="text-slate-500">→</span>
                <span className={updatedState.battery < previousState.battery ? 'text-red-400' : 'text-emerald-400'}>
                  {Math.round(updatedState.battery)}%
                </span>
                {decision.deltaBattery < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5 text-red-400 ml-auto" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
                )}
              </div>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">SCIENCE DISCOVERIES</span>
              <div className="flex items-center gap-1 font-bold">
                <span className="text-slate-400">{previousState.scienceScore}</span>
                <span className="text-slate-500">→</span>
                <span className="text-purple-300">{updatedState.scienceScore} PTS</span>
                {decision.deltaScience > 0 && <TrendingUp className="w-3.5 h-3.5 text-purple-400 ml-auto" />}
              </div>
            </div>
          </div>
        </div>

        {/* Systems Thinking Lesson */}
        <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-2xl p-4">
          <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> MISSION SYSTEMS LESSON
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            "{keyLesson}"
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onRewind}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>TRY DIFFERENT STRATEGY</span>
          </button>

          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            <span>RESUME MISSION</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
