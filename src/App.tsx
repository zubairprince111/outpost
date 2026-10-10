import React, { useEffect, useRef, useState } from 'react';
import { LunarSceneManager } from './scene/LunarSceneManager';
import { AudioEngine } from './audio/AudioEngine';
import { SimulationEngine } from './simulation/SimulationEngine';
import {
  ResourceState,
  SubsystemState,
  SubsystemType,
  CriticalEvent,
  FutureOutcome,
  DecisionOption,
  MissionLogEntry
} from './simulation/SimulationModels';
import { ResourceHud } from './ui/ResourceHud';
import { OrbitCompanionWidget } from './ui/OrbitCompanionWidget';
import { SubsystemInspector } from './ui/SubsystemInspector';
import { FutureForkModal } from './ui/FutureForkModal';
import { ConsequenceSequence } from './ui/ConsequenceSequence';
import { FinalResultModal } from './ui/FinalResultModal';
import { ArrivalScreen } from './ui/ArrivalScreen';
import { CreditsModal } from './ui/CreditsModal';

type GameState = 'arrival' | 'exploring' | 'future_fork' | 'consequence' | 'final_result';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<LunarSceneManager | null>(null);

  // Game & Simulation States
  const [gameState, setGameState] = useState<GameState>('arrival');
  const [sol] = useState<number>(42);
  const [cycle, setCycle] = useState<number>(1);
  const maxCycles = 5;

  const [initialResources] = useState<ResourceState>(() => SimulationEngine.getInitialState());
  const [resources, setResources] = useState<ResourceState>(() => SimulationEngine.getInitialState());
  const [previousResources, setPreviousResources] = useState<ResourceState>(() => SimulationEngine.getInitialState());
  const [subsystems, setSubsystems] = useState<SubsystemState[]>(() =>
    SimulationEngine.getInitialSubsystems(SimulationEngine.getInitialState())
  );
  const [selectedSubsystem, setSelectedSubsystem] = useState<SubsystemState | null>(null);
  const [missionLogs, setMissionLogs] = useState<MissionLogEntry[]>([]);

  // Ref to always access latest subsystems inside Three.js pointer callback
  const subsystemsRef = useRef<SubsystemState[]>(subsystems);
  useEffect(() => {
    const updatedSubs = SimulationEngine.getInitialSubsystems(resources);
    setSubsystems(updatedSubs);
    subsystemsRef.current = updatedSubs;
    if (selectedSubsystem) {
      const refreshed = updatedSubs.find(s => s.type === selectedSubsystem.type) || null;
      setSelectedSubsystem(refreshed);
    }
  }, [resources]);

  // Event & Future Fork States
  const [currentEvent, setCurrentEvent] = useState<CriticalEvent | null>(null);
  const [futureOutcomes, setFutureOutcomes] = useState<FutureOutcome[]>([]);
  const [activePreviewId, setActivePreviewId] = useState<string>('');
  const [lastCommittedDecision, setLastCommittedDecision] = useState<DecisionOption | null>(null);

  // ORBIT Companion State
  const [orbitMessage, setOrbitMessage] = useState<string>(
    "Welcome to OUTPOST, Commander! Systems nominal. Click any module to inspect our lunar base."
  );
  const [orbitMood, setOrbitMood] = useState<'normal' | 'alarmed' | 'thinking' | 'celebrating'>('normal');

  // Audio & Modals
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showCredits, setShowCredits] = useState<boolean>(false);

  const handleSubsystemSelected = (type: SubsystemType) => {
    const sub = subsystemsRef.current.find(s => s.type === type) || null;
    setSelectedSubsystem(sub);
    AudioEngine.getInstance().playSubsystemFocus();

    if (sub) {
      setOrbitMessage(`Inspecting ${sub.title}. ${sub.kidExplanation}`);
      setOrbitMood('normal');
      sceneManagerRef.current?.selectSubsystem(type);
    }
  };

  // Initialize Scene & Subsystems
  useEffect(() => {
    if (!containerRef.current) return;

    const sceneManager = new LunarSceneManager(containerRef.current, {
      onSubsystemClick: (type: SubsystemType) => {
        handleSubsystemSelected(type);
      },
      onCameraTransitionEnd: () => {
        // Camera move completed
      }
    });

    sceneManagerRef.current = sceneManager;

    return () => {
      sceneManager.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  /* ------------------ START EXPEDITION (Cinematic Arrival) ------------------ */
  const handleStartMission = () => {
    const audio = AudioEngine.getInstance();
    audio.playAmbient();
    audio.playBeep(720, 0.12, 'triangle');

    setGameState('exploring');
    sceneManagerRef.current?.startArrivalCinematic();

    setOrbitMood('celebrating');
    setOrbitMessage("Touchdown confirmed! Outpost life support online. Click any 3D module to inspect or run a crisis simulation.");

    setTimeout(() => {
      setOrbitMood('normal');
    }, 4500);
  };

  /* ------------------ TRIGGER CRISIS EVENT ------------------ */
  const handleTriggerCrisis = () => {
    const audio = AudioEngine.getInstance();
    audio.playCrisis();

    setSelectedSubsystem(null);
    sceneManagerRef.current?.selectSubsystem(null);

    const crisisEvent = SimulationEngine.getEventForCycle(cycle);
    setCurrentEvent(crisisEvent);

    // Calculate deterministic Future Fork outcomes
    const outcomes = SimulationEngine.simulateFutureFork(resources, crisisEvent);
    setFutureOutcomes(outcomes);
    setActivePreviewId(crisisEvent.options[0].id);

    // Update 3D World to Crisis Mode
    sceneManagerRef.current?.setVisualMode('crisis');
    setOrbitMood('alarmed');
    setOrbitMessage(crisisEvent.orbitWarning);

    setGameState('future_fork');
  };

  /* ------------------ 3D FUTURE PREVIEW TOGGLE ------------------ */
  const handlePreviewOption = (optionId: string) => {
    setActivePreviewId(optionId);
    AudioEngine.getInstance().playFutureForkWhoosh();

    const option = currentEvent?.options.find(o => o.id === optionId);
    if (!option) return;

    if (option.worldVisualEffect === 'science_laser') {
      sceneManagerRef.current?.setVisualMode('preview_keep_running');
      setOrbitMood('thinking');
      setOrbitMessage(`Previewing "${option.title}": High research output, but heavy strain on power reserves!`);
    } else if (option.worldVisualEffect === 'emergency_dim') {
      sceneManagerRef.current?.setVisualMode('preview_emergency');
      setOrbitMood('thinking');
      setOrbitMessage(`Previewing "${option.title}": Non-essentials dimmed to standby for maximum survival cushion.`);
    } else {
      sceneManagerRef.current?.setVisualMode('preview_conserve');
      setOrbitMood('normal');
      setOrbitMessage(`Previewing "${option.title}": Balanced conservation keeps life support and reserves safe.`);
    }
  };

  /* ------------------ COMMIT DECISION & CONSEQUENCES ------------------ */
  const handleCommitDecision = (optionId: string) => {
    const option = currentEvent?.options.find(o => o.id === optionId);
    if (!option || !currentEvent) return;

    setLastCommittedDecision(option);
    setPreviousResources(resources);

    // Deterministically advance simulation
    const updated = SimulationEngine.advanceCycle(resources, option);
    setResources(updated);
    const nextCycle = Math.min(maxCycles, cycle + 1);
    setCycle(nextCycle);

    const wasRisky = option.deltaBattery <= -20 || option.deltaWater <= -10 || option.deltaCrew < 0;
    setMissionLogs(prev => [
      ...prev,
      {
        cycle,
        eventTitle: currentEvent.title,
        decisionChosen: option.title,
        batteryAtEnd: Math.round(updated.battery),
        powerAtEnd: Math.round(updated.power),
        crewAtEnd: Math.round(updated.crewHealth),
        wasWarningSign: wasRisky,
        warningNote: option.causalChain[option.causalChain.length - 1] || ''
      }
    ]);

    // Update 3D World consequence state
    sceneManagerRef.current?.applyConsequenceState(updated, option.worldVisualEffect);

    const audio = AudioEngine.getInstance();
    if (!wasRisky) {
      audio.playSuccessChime();
      audio.playAmbient();
      setOrbitMood('celebrating');
      setOrbitMessage("Strategy committed! Outpost telemetry stabilized within safe operating margins.");
    } else {
      audio.playWarningKlaxon();
      setOrbitMood('alarmed');
      setOrbitMessage("Warning: High resource drain active! Check consequence telemetry carefully.");
    }

    setGameState('consequence');
  };

  /* ------------------ REWIND / TRY DIFFERENT STRATEGY ------------------ */
  const handleRewindDecision = () => {
    AudioEngine.getInstance().playBeep(440, 0.1);
    setResources(previousResources);
    setCycle(prev => Math.max(1, prev - 1));
    setMissionLogs(prev => prev.slice(0, -1));
    sceneManagerRef.current?.setVisualMode('crisis');
    setOrbitMood('thinking');
    setOrbitMessage("Timeline rewound! Compare the 3D outcomes and choose a safer strategy.");
    setGameState('future_fork');
  };

  /* ------------------ RESUME EXPLORATION AFTER CONSEQUENCE ------------------ */
  const handleResumeMission = () => {
    AudioEngine.getInstance().playBeep(880, 0.08);
    sceneManagerRef.current?.resetToOverview();
    setOrbitMood('normal');
    setOrbitMessage(`Sol 42 • Cycle ${cycle}/${maxCycles} active. Click any module to inspect or trigger the next crisis.`);
    setGameState('exploring');
  };

  /* ------------------ OPEN FINAL MISSION RESULT ------------------ */
  const handleOpenFinalResult = () => {
    const audio = AudioEngine.getInstance();
    audio.playSuccessChime();
    audio.playAmbient();
    setSelectedSubsystem(null);
    sceneManagerRef.current?.resetToOverview();
    setOrbitMood('celebrating');
    setOrbitMessage("Displaying Final Mission Result & Systems Thinking Evaluation!");
    setGameState('final_result');
  };

  /* ------------------ RESTART FULL EXPEDITION ------------------ */
  const handleRestartMission = () => {
    const fresh = SimulationEngine.getInitialState();
    setResources(fresh);
    setPreviousResources(fresh);
    setCycle(1);
    setMissionLogs([]);
    setSelectedSubsystem(null);
    sceneManagerRef.current?.setVisualMode('nominal');
    sceneManagerRef.current?.resetToOverview();
    AudioEngine.getInstance().playAmbient();
    AudioEngine.getInstance().playBeep(720, 0.12, 'triangle');
    setOrbitMood('celebrating');
    setOrbitMessage("New expedition initialized at Sol 42! All outpost reserves restored to baseline.");
    setGameState('exploring');
  };

  /* ------------------ RESET CAMERA OVERVIEW ------------------ */
  const handleResetCamera = () => {
    setSelectedSubsystem(null);
    sceneManagerRef.current?.resetToOverview();
    AudioEngine.getInstance().playBeep(520, 0.08);
  };

  /* ------------------ AUDIO MUTE TOGGLE ------------------ */
  const handleToggleMute = () => {
    const muted = AudioEngine.getInstance().toggleMute();
    setIsMuted(muted);
  };

  const autopsyData = SimulationEngine.generateMissionAutopsy(resources, missionLogs);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-black select-none">
      {/* Three.js 3D Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none" />

      {/* Cinematic Arrival Screen */}
      {gameState === 'arrival' && (
        <ArrivalScreen
          onStartMission={handleStartMission}
          onOpenCredits={() => setShowCredits(true)}
        />
      )}

      {/* Primary In-Game HUD (Visible during gameplay) */}
      {gameState !== 'arrival' && (
        <>
          <ResourceHud
            resources={resources}
            sol={sol}
            cycle={cycle}
            maxCycles={maxCycles}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onResetCamera={handleResetCamera}
            onTriggerCrisis={handleTriggerCrisis}
            onOpenFinalResult={handleOpenFinalResult}
            inCrisis={gameState === 'future_fork' || gameState === 'consequence' || gameState === 'final_result'}
          />

          {/* Hide ORBIT widget on mobile when SubsystemInspector bottom sheet is open to prevent overlap */}
          <div className={selectedSubsystem ? 'hidden md:block' : 'block'}>
            <OrbitCompanionWidget
              message={orbitMessage}
              mood={orbitMood}
              hasVoice={false}
            />
          </div>

          {/* Quick Subsystem Selector Bar (Swipeable bottom bar on mobile, bottom-right dock on desktop) */}
          {gameState === 'exploring' && (
            <div
              className={`
                ${selectedSubsystem ? 'hidden md:flex' : 'flex'}
                absolute bottom-2.5 left-2.5 right-2.5 sm:left-auto sm:bottom-6 sm:right-6 z-20
                pointer-events-auto items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar
                bg-slate-950/90 backdrop-blur-md border border-slate-700/70 rounded-2xl p-1 sm:p-1.5 shadow-2xl
              `}
            >
              {subsystems.map((sub) => {
                const isSelected = selectedSubsystem?.type === sub.type;
                return (
                  <button
                    key={sub.type}
                    onClick={() => handleSubsystemSelected(sub.type)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-mono flex items-center gap-1 sm:gap-1.5 shrink-0 transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                    }`}
                    title={`Select ${sub.title}`}
                  >
                    <span>{sub.emoji}</span>
                    <span className="font-bold">{sub.shortName}</span>
                  </button>
                );
              })}
            </div>
          )}

          <SubsystemInspector
            subsystem={selectedSubsystem}
            onClose={() => {
              setSelectedSubsystem(null);
              sceneManagerRef.current?.selectSubsystem(null);
            }}
            onFocus={() => {
              if (selectedSubsystem) {
                sceneManagerRef.current?.selectSubsystem(selectedSubsystem.type);
              }
            }}
          />
        </>
      )}

      {/* Future Fork Modal */}
      {gameState === 'future_fork' && currentEvent && (
        <FutureForkModal
          event={currentEvent}
          outcomes={futureOutcomes}
          activePreviewId={activePreviewId}
          onPreviewOption={handlePreviewOption}
          onCommitDecision={handleCommitDecision}
        />
      )}

      {/* Consequence Sequence Modal */}
      {gameState === 'consequence' && lastCommittedDecision && (
        <ConsequenceSequence
          decision={lastCommittedDecision}
          previousState={previousResources}
          updatedState={resources}
          cycle={cycle}
          maxCycles={maxCycles}
          onDismiss={handleResumeMission}
          onRewind={handleRewindDecision}
          onViewFinalResult={handleOpenFinalResult}
        />
      )}

      {/* Final Mission Result Modal */}
      {gameState === 'final_result' && (
        <FinalResultModal
          initialState={initialResources}
          finalState={resources}
          missionLogs={missionLogs}
          autopsy={autopsyData}
          cycle={cycle}
          maxCycles={maxCycles}
          onRestartMission={handleRestartMission}
          onReturnToBase={() => setGameState('exploring')}
        />
      )}

      {/* Credits & License Modal */}
      {showCredits && (
        <CreditsModal onClose={() => setShowCredits(false)} />
      )}
    </div>
  );
};


