import React from 'react';
import {
  ResourceState,
  MissionLogEntry,
  MissionAutopsyData
} from '../simulation/SimulationModels';
import {
  Trophy,
  AlertOctagon,
  RotateCcw,
  Compass,
  Award,
  CheckCircle2,
  Sparkles,
  Zap,
  Battery,
  Droplets,
  Apple,
  Wind,
  Heart
} from 'lucide-react';

interface FinalResultModalProps {
  initialState: ResourceState;
  finalState: ResourceState;
  missionLogs: MissionLogEntry[];
  autopsy: MissionAutopsyData;
  cycle: number;
  maxCycles: number;
  onRestartMission: () => void;
  onReturnToBase: () => void;
}

export const FinalResultModal: React.FC<FinalResultModalProps> = ({
  initialState,
  finalState,
  missionLogs,
  autopsy,
  cycle,
  maxCycles,
  onRestartMission,
  onReturnToBase
}) => {
  const isCritical =
    finalState.battery <= 30 ||
    finalState.crewHealth <= 45 ||
    finalState.water <= 25;

  // Calculate overall mission score & commander grade
  const avgVitality = Math.round(
    (finalState.power +
      finalState.battery +
      finalState.water +
      finalState.food +
      finalState.oxygen +
      finalState.crewHealth) /
      6
  );

  const commanderRank = isCritical
    ? { grade: 'C', title: 'CRITICAL STRAIN — RECOVERY REQUIRED', color: 'text-red-400 border-red-500/60 bg-red-950/60' }
    : avgVitality >= 80 && finalState.scienceScore >= 120
    ? { grade: 'S', title: 'EXEMPLARY LUNAR COMMANDER', color: 'text-emerald-400 border-emerald-500/60 bg-emerald-950/60' }
    : avgVitality >= 70
    ? { grade: 'A', title: 'SUSTAINABLE OUTPOST ARCHITECT', color: 'text-cyan-400 border-cyan-500/60 bg-cyan-950/60' }
    : { grade: 'B', title: 'MISSION STABILIZED', color: 'text-amber-400 border-amber-500/60 bg-amber-950/60' };

  const resourceRows = [
    { label: 'Electrical Power', icon: <Zap className="w-3.5 h-3.5 text-amber-400" />, start: initialState.power, end: finalState.power, barColor: 'bg-amber-400' },
    { label: 'Battery Reserve', icon: <Battery className="w-3.5 h-3.5 text-emerald-400" />, start: initialState.battery, end: finalState.battery, barColor: finalState.battery <= 35 ? 'bg-red-500' : 'bg-emerald-400' },
    { label: 'Water Recycling', icon: <Droplets className="w-3.5 h-3.5 text-blue-400" />, start: initialState.water, end: finalState.water, barColor: finalState.water <= 35 ? 'bg-red-500' : 'bg-blue-400' },
    { label: 'Biodome Food', icon: <Apple className="w-3.5 h-3.5 text-lime-400" />, start: initialState.food, end: finalState.food, barColor: 'bg-lime-400' },
    { label: 'Habitat Oxygen', icon: <Wind className="w-3.5 h-3.5 text-cyan-300" />, start: initialState.oxygen, end: finalState.oxygen, barColor: 'bg-cyan-400' },
    { label: 'Crew Health', icon: <Heart className="w-3.5 h-3.5 text-rose-400" />, start: initialState.crewHealth, end: finalState.crewHealth, barColor: finalState.crewHealth <= 50 ? 'bg-red-500' : 'bg-rose-400' }
  ];

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center p-2.5 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/55 pointer-events-auto"></div>

      <div className="relative pointer-events-auto w-full max-w-3xl max-h-[90dvh] overflow-y-auto bg-slate-950/95 border border-cyan-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col gap-3.5 sm:gap-4 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
              isCritical
                ? 'bg-red-950/60 border-red-500/60 text-red-400'
                : 'bg-emerald-950/60 border-emerald-500/60 text-emerald-400'
            }`}>
              {isCritical ? <AlertOctagon className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
            </div>

            <div>
              <div className="text-[11px] font-mono text-cyan-400 tracking-widest uppercase">
                // SOL 42 EXPEDITION • FINAL MISSION RESULT (CYCLE {cycle}/{maxCycles})
              </div>
              <h2 className="text-lg md:text-xl font-extrabold text-slate-100">
                {isCritical ? 'OUTPOST CRITICAL STRAIN AUTOPSY' : 'LUNAR EXPEDITION ACCOMPLISHED'}
              </h2>
            </div>
          </div>

          <div className={`px-3.5 py-2 rounded-2xl border text-right font-mono shrink-0 ${commanderRank.color}`}>
            <div className="text-[10px] opacity-80">COMMAND RATING</div>
            <div className="text-sm font-extrabold">RANK {commanderRank.grade} • {avgVitality}% STABILITY</div>
          </div>
        </div>

        {/* Summary Banner */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>{commanderRank.title}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {autopsy.primaryCause}
            </p>
          </div>

          <div className="bg-purple-950/50 border border-purple-500/40 rounded-xl px-4 py-2.5 text-center shrink-0">
            <div className="text-[10px] font-mono text-purple-300 flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5 text-purple-400" /> SCIENCE YIELD
            </div>
            <div className="text-lg font-extrabold font-mono text-purple-200">
              {finalState.scienceScore} PTS
            </div>
            <div className="text-[10px] font-mono text-purple-400">
              ({finalState.scienceScore - initialState.scienceScore >= 0 ? `+${finalState.scienceScore - initialState.scienceScore}` : finalState.scienceScore - initialState.scienceScore} from start)
            </div>
          </div>
        </div>

        {/* Two-column body: Telemetry Bars + Mission Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Final Resource Telemetry */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider mb-1">
              Final Outpost Telemetry
            </div>
            {resourceRows.map((row) => {
              const delta = Math.round(row.end) - Math.round(row.start);
              return (
                <div key={row.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      {row.icon}
                      <span>{row.label}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-100">
                      <span className="text-slate-500 font-normal mr-1">{Math.round(row.start)}% →</span>
                      {Math.round(row.end)}%
                      {delta !== 0 && (
                        <span className={`ml-1 text-[10px] ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          ({delta > 0 ? `+${delta}%` : `${delta}%`})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${row.barColor}`}
                      style={{ width: `${Math.max(4, Math.min(100, row.end))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Causal Mission Timeline */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider mb-2.5">
                Mission Causal Timeline ({missionLogs.length} Decisions)
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {autopsy.timeline.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-2.5 text-xs flex items-start gap-2.5"
                  >
                    <span className="text-base leading-none mt-0.5">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-[10px] text-cyan-400">
                          CYCLE {item.cycle} • {item.stage}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 truncate">
                          {item.metricHighlight}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Educational Takeaway */}
            <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-xl p-3">
              <div className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> SYSTEMS THINKING CONCLUSION
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {autopsy.lessonLearned}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
          <button
            onClick={onReturnToBase}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>INSPECT 3D OUTPOST</span>
          </button>

          <button
            onClick={onRestartMission}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>START NEW EXPEDITION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
