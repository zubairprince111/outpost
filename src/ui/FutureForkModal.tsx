import React, { useState } from 'react';
import { CriticalEvent, FutureOutcome, FutureRiskStatus } from '../simulation/SimulationModels';
import { Eye, EyeOff, CheckCircle, AlertTriangle, ShieldAlert, Sparkles, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface FutureForkModalProps {
  event: CriticalEvent;
  outcomes: FutureOutcome[];
  activePreviewId: string;
  onPreviewOption: (optionId: string) => void;
  onCommitDecision: (optionId: string) => void;
}

export const FutureForkModal: React.FC<FutureForkModalProps> = ({
  event,
  outcomes,
  activePreviewId,
  onPreviewOption,
  onCommitDecision
}) => {
  const [selectedId, setSelectedId] = useState<string>(activePreviewId || outcomes[0]?.option.id);
  const [peek3D, setPeek3D] = useState<boolean>(false);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onPreviewOption(id);
  };

  const selectedOutcome = outcomes.find(o => o.option.id === selectedId) || outcomes[0];

  const getRiskBadge = (risk: FutureRiskStatus) => {
    switch (risk) {
      case FutureRiskStatus.FAIL:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/80 px-2.5 py-1 rounded-full border border-red-500/60 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" /> CRITICAL RISK
          </span>
        );
      case FutureRiskStatus.RISKY:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/60">
            <AlertTriangle className="w-3.5 h-3.5" /> WARNING MARGIN
          </span>
        );
      case FutureRiskStatus.SAFE:
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/60">
            <CheckCircle className="w-3.5 h-3.5" /> SAFE OUTCOME
          </span>
        );
    }
  };

  if (peek3D) {
    return (
      <div className="absolute bottom-6 right-6 z-30 pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => setPeek3D(false)}
          className="px-4 py-2.5 bg-slate-950/90 hover:bg-slate-900 border border-cyan-400 text-cyan-300 font-bold text-xs rounded-2xl flex items-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)]"
        >
          <EyeOff className="w-4 h-4" />
          <span>RETURN TO FUTURE FORK OPTIONS</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center p-2.5 sm:p-4">
      {/* Light vignette backdrop without blur so 3D previews remain visible */}
      <div className="absolute inset-0 bg-slate-950/35 pointer-events-auto"></div>

      {/* Main Fork Modal Container */}
      <div className="relative pointer-events-auto w-full max-w-4xl max-h-[90dvh] overflow-y-auto bg-slate-950/95 border border-cyan-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col gap-3.5 sm:gap-4 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-950/60 border border-amber-500/60 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0">
              {event.icon}
            </div>
            <div>
              <div className="text-[11px] font-mono text-cyan-400 tracking-widest uppercase">
                // FUTURE FORK SIMULATION • DECISION POINT
              </div>
              <h2 className="text-lg md:text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>{event.title}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{event.summary}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPeek3D(true)}
              className="text-xs text-cyan-300 hover:text-cyan-200 font-mono bg-cyan-950/50 hover:bg-cyan-900/60 px-3 py-1.5 rounded-xl border border-cyan-500/40 flex items-center gap-1.5 transition-colors"
              title="Inspect 3D Preview Unobstructed"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>PEEK 3D WORLD</span>
            </button>
          </div>
        </div>

        {/* 3 Interactive Future Branch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {outcomes.map(({ option, simulatedEndState, riskStatus, trajectory }) => {
            const isSelected = option.id === selectedId;

            return (
              <div
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`cursor-pointer rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between border ${
                  isSelected
                    ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)] scale-[1.01]'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                <div>
                  {/* Top Bar of card */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-2xl p-1 bg-slate-800/80 rounded-xl">{option.icon}</span>
                    {getRiskBadge(riskStatus)}
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 mb-1">{option.title}</h3>
                  <p className="text-xs text-slate-400 mb-3">{option.subtitle}</p>

                  {/* Simulated Metrics Forecast */}
                  <div className="space-y-1.5 mb-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Battery End:</span>
                      <span className={`font-bold flex items-center gap-1 ${
                        option.deltaBattery < 0 ? 'text-red-400' : option.deltaBattery > 0 ? 'text-emerald-400' : 'text-slate-200'
                      }`}>
                        {option.deltaBattery < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : option.deltaBattery > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : null}
                        {Math.round(simulatedEndState.battery)}% ({option.deltaBattery >= 0 ? `+${option.deltaBattery}` : option.deltaBattery}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Water / Crew:</span>
                      <span className="font-bold text-cyan-300">
                        {Math.round(simulatedEndState.water)}% H₂O • {Math.round(simulatedEndState.crewHealth)}% ♥
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Science Yield:</span>
                      <span className={`font-bold ${option.deltaScience >= 0 ? 'text-purple-300' : 'text-slate-400'}`}>
                        {option.deltaScience >= 0 ? `+${option.deltaScience}` : option.deltaScience} PTS
                      </span>
                    </div>
                  </div>

                  {/* Trajectory Sparkline Preview */}
                  <div className="mb-3.5">
                    <div className="text-[10px] font-mono text-slate-500 mb-1">OUTPOST STABILITY TRAJECTORY (+6H)</div>
                    <div className="flex items-end gap-1.5 h-8 bg-slate-950/50 rounded-lg p-1.5 border border-slate-800">
                      {trajectory.map((pt, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                          <div
                            className={`w-full rounded-sm transition-all ${
                              riskStatus === FutureRiskStatus.FAIL
                                ? 'bg-red-500/70'
                                : riskStatus === FutureRiskStatus.RISKY
                                ? 'bg-amber-500/70'
                                : 'bg-cyan-400/80'
                            }`}
                            style={{ height: `${Math.max(12, pt.healthValue)}%` }}
                          ></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3D Preview Active Indicator */}
                <button
                  type="button"
                  className={`w-full py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isSelected ? 'PREVIEWING IN 3D' : 'PREVIEW THIS FUTURE'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Selected Branch Causal Chain Details */}
        {selectedOutcome && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="text-[11px] font-mono text-cyan-400 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> SIMULATED CAUSAL CHAIN:
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
                {selectedOutcome.option.causalChain.map((step, idx) => (
                  <span key={idx} className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                    {step}
                  </span>
                ))}
              </div>
            </div>

            {/* Commit Button */}
            <button
              onClick={() => onCommitDecision(selectedId)}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:scale-105 shrink-0"
            >
              <span>COMMIT STRATEGY</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

