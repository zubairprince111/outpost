import React, { useState } from 'react';
import { DecisionOption, ResourceState } from '../simulation/SimulationModels';
import {
  CheckCircle2,
  AlertOctagon,
  RotateCcw,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Award,
  Eye,
  EyeOff,
  Flag
} from 'lucide-react';

interface ConsequenceProps {
  decision: DecisionOption;
  previousState: ResourceState;
  updatedState: ResourceState;
  cycle: number;
  maxCycles: number;
  onDismiss: () => void;
  onRewind: () => void;
  onViewFinalResult: () => void;
}

export const ConsequenceSequence: React.FC<ConsequenceProps> = ({
  decision,
  previousState,
  updatedState,
  cycle,
  maxCycles,
  onDismiss,
  onRewind,
  onViewFinalResult
}) => {
  const [peek3D, setPeek3D] = useState(false);

  const isDangerous =
    updatedState.battery <= 40 ||
    updatedState.water <= 35 ||
    updatedState.crewHealth <= 60 ||
    decision.deltaBattery <= -20 ||
    decision.deltaCrew <= -10;

  const isFinalCycle = cycle >= maxCycles;

  const getKeyLesson = () => {
    if (decision.id === 'opt_solar_keep_running') {
      return "All space systems are connected: keeping non-essential science running at 100% drained the battery bank, pushing life support into danger!";
    }
    if (decision.id === 'opt_solar_reduce_science') {
      return "By pausing heavy science lasers during the shadow, you saved precious kilowatt-hours and kept habitat oxygen and heat completely safe!";
    }
    if (decision.id === 'opt_solar_emergency_power') {
      return "Emergency mode ensured maximum survival margins, proving that crew safety always comes before mission objectives.";
    }
    if (decision.id === 'opt_water_high_flush') {
      return "Investing a small burst of electrical power to restore 98% closed-loop water recycling prevented a long-term hydration crisis.";
    }
    if (decision.id === 'opt_water_ration') {
      return "Manual filter maintenance protected both power and water reserves at the cost of temporary research bandwidth.";
    }
    if (decision.id === 'opt_water_draw_emergency') {
      return "Consuming non-renewable backup crater ice without fixing the root filter clog eroded the outpost's survival cushion!";
    }
    if (decision.id === 'opt_storm_ignore_research') {
      return "Exposing unshielded electronics and astronauts during a solar storm yielded rare data, but severely damaged power inverters and crew health!";
    }
    return "Every decision on the Moon creates a ripple effect across power, battery storage, water, greenhouse food, and astronaut health.";
  };

  const metrics = [
    { label: 'POWER', prev: previousState.power, next: updatedState.power, delta: decision.deltaPower, unit: '%' },
    { label: 'BATTERY', prev: previousState.battery, next: updatedState.battery, delta: decision.deltaBattery, unit: '%' },
    { label: 'WATER', prev: previousState.water, next: updatedState.water, delta: decision.deltaWater, unit: '%' },
    { label: 'FOOD', prev: previousState.food, next: updatedState.food, delta: decision.deltaFood, unit: '%' },
    { label: 'OXYGEN', prev: previousState.oxygen, next: updatedState.oxygen, delta: decision.deltaOxygen, unit: '%' },
    { label: 'CREW HEALTH', prev: previousState.crewHealth, next: updatedState.crewHealth, delta: decision.deltaCrew, unit: '%' }
  ];

  if (peek3D) {
    return (
      <div className="absolute bottom-6 right-6 z-30 pointer-events-auto">
        <button
          onClick={() => setPeek3D(false)}
          className="px-4 py-2.5 bg-slate-950/90 hover:bg-slate-900 border border-cyan-400 text-cyan-300 font-bold text-xs rounded-2xl flex items-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)]"
        >
          <EyeOff className="w-4 h-4" />
          <span>SHOW RESULT REPORT</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center p-2.5 sm:p-4">
      {/* Subtle non-blurring backdrop so 3D world consequences remain visible */}
      <div className="absolute inset-0 bg-slate-950/40 pointer-events-auto"></div>

      {/* Main card */}
      <div className="relative pointer-events-auto w-full max-w-xl max-h-[90dvh] overflow-y-auto bg-slate-950/95 border border-cyan-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col gap-3.5 sm:gap-4 animate-in fade-in zoom-in-95 duration-300">
        {/* Outcome Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl border shrink-0 ${
              isDangerous
                ? 'bg-red-950/60 border-red-500/60 text-red-400'
                : 'bg-emerald-950/60 border-emerald-500/60 text-emerald-400'
            }`}>
              {isDangerous ? <AlertOctagon className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>

            <div>
              <div className="text-[11px] font-mono text-cyan-400 tracking-wider uppercase">
                // CYCLE {cycle}/{maxCycles} CONSEQUENCE RESULT
              </div>
              <h2 className="text-base font-bold text-slate-100">
                {isDangerous ? 'CRITICAL SUBSYSTEM STRAIN DETECTED' : 'OUTPOST SYSTEMS STABILIZED'}
              </h2>
            </div>
          </div>

          <button
            onClick={() => setPeek3D(true)}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 text-[11px] font-mono rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
            title="Temporarily hide modal to inspect 3D world"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>PEEK 3D</span>
          </button>
        </div>

        {/* Strategy & Complete Telemetry Comparison */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs font-bold text-slate-200">
              Strategy Executed: <span className="text-cyan-400">{decision.icon} {decision.title}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-purple-950/50 border border-purple-500/40 px-2.5 py-1 rounded-lg text-xs font-mono">
              <Award className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-400">SCIENCE:</span>
              <span className="text-slate-300">{previousState.scienceScore}</span>
              <span className="text-slate-500">→</span>
              <span className="font-bold text-purple-300">{updatedState.scienceScore} PTS</span>
              <span className={decision.deltaScience >= 0 ? 'text-emerald-400 text-[10px]' : 'text-amber-400 text-[10px]'}>
                ({decision.deltaScience >= 0 ? `+${decision.deltaScience}` : decision.deltaScience})
              </span>
            </div>
          </div>

          {/* 6-Resource Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
            {metrics.map((m) => {
              const diff = Math.round(m.next) - Math.round(m.prev);
              const isLow = m.next <= 35;
              return (
                <div
                  key={m.label}
                  className={`p-2.5 rounded-xl border ${
                    isLow
                      ? 'bg-red-950/30 border-red-500/50'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>{m.label}</span>
                    {diff !== 0 && (
                      <span className={diff > 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {diff > 0 ? `+${diff}%` : `${diff}%`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 font-bold">
                    <span className="text-slate-400">{Math.round(m.prev)}%</span>
                    <span className="text-slate-600">→</span>
                    <span
                      className={
                        isLow
                          ? 'text-red-400'
                          : diff > 0
                          ? 'text-emerald-400'
                          : diff < 0
                          ? 'text-amber-300'
                          : 'text-slate-200'
                      }
                    >
                      {Math.round(m.next)}%
                    </span>
                    {diff < 0 ? (
                      <TrendingDown className="w-3.5 h-3.5 text-red-400 ml-auto" />
                    ) : diff > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Causal Chain Pills */}
          <div className="pt-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase mb-1.5">Causal Chain Verified:</div>
            <div className="flex flex-wrap gap-1.5">
              {decision.causalChain.map((step, i) => (
                <span
                  key={i}
                  className="text-[11px] bg-slate-950/80 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg"
                >
                  {i + 1}. {step}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Systems Thinking Lesson */}
        <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-2xl p-3.5">
          <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5 mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> MISSION SYSTEMS LESSON
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            "{getKeyLesson()}"
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            onClick={onRewind}
            className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>REWIND</span>
          </button>

          {!isFinalCycle && (
            <button
              onClick={onDismiss}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all border border-cyan-500/40"
            >
              <span>CONTINUE EXPLORING</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onViewFinalResult}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{isFinalCycle ? 'VIEW FINAL MISSION RESULT' : 'FINAL RESULT REPORT'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

