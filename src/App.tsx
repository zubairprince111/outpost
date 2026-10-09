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
  DecisionOption
} from './simulation/SimulationModels';
import { ResourceHud } from './ui/ResourceHud';
import { OrbitCompanionWidget } from './ui/OrbitCompanionWidget';
import { SubsystemInspector } from './ui/SubsystemInspector';
import { FutureForkModal } from './ui/FutureForkModal';
import { ConsequenceSequence } from './ui/ConsequenceSequence';
import { ArrivalScreen } from './ui/ArrivalScreen';
import { CreditsModal } from './ui/CreditsModal';

type GameState = 'arrival' | 'exploring' | 'future_fork' | 'consequence';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<LunarSceneManager | null>(null);

  // Game & Simulation States
  const [gameState, setGameState] = useState<GameState>('arrival');
  const [sol] = useState<number>(42);
  const [cycle, setCycle] = useState<number>(1);
  const maxCycles = 5;

  const [resources, setResources] = useState<ResourceState>(SimulationEngine.getInitialState());
  const [previousResources, setPreviousResources] = useState<ResourceState>(SimulationEngine.getInitialState());
  const [subsystems, setSubsystems] = useState<SubsystemState[]>([]);
  const [selectedSubsystem, setSelectedSubsystem] = useState<SubsystemState | null>(null);

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

  // Initialize Scene & Subsystems
  useEffect(() => {
    if (!containerRef.current) return;

    const initialSubsystems = SimulationEngine.getInitialSubsystems(resources);
    setSubsystems(initialSubsystems);

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

  const handleSubsystemSelected = (type: SubsystemType) => {
    const sub = subsystems.find(s => s.type === type) || null;
    setSelectedSubsystem(sub);
    AudioEngine.getInstance().playSubsystemFocus();

    if (sub) {
      setOrbitMessage(`Inspecting ${sub.title}. ${sub.kidExplanation}`);
      setOrbitMood('normal');
      sceneManagerRef.current?.selectSubsystem(type);
    }
  };

  /* ------------------ START EXPEDITION (Cinematic Arrival) ------------------ */
  const handleStartMission = () => {
    const audio = AudioEngine.getInstance();
    audio.playAmbient();
    audio.playBeep(720, 0.12, 'triangle');

    setGameState('exploring');
    sceneManagerRef.current?.startArrivalCinematic();

    setOrbitMood('celebrating');
    setOrbitMessage("Touchdown confirmed! Outpost life support online. Take a look around or prepare for scheduled solar operations.");

    setTimeout(() => {
      setOrbitMood('normal');
    }, 4500);
  };

  /* ------------------ TRIGGER SOLAR POWER CRISIS ------------------ */
  const handleTriggerCrisis = () => {
    const audio = AudioEngine.getInstance();
    audio.playCrisis();
    audio.playVoice('problem1');

    const solarEvent = SimulationEngine.createSolarDropEvent(cycle + 1);
    setCurrentEvent(solarEvent);

    // Calculate deterministic Future Fork outcomes
    const outcomes = SimulationEngine.simulateFutureFork(resources, solarEvent);
    setFutureOutcomes(outcomes);
    setActivePreviewId(solarEvent.options[0].id);

    // Update 3D World to Crisis Mode
    sceneManagerRef.current?.setVisualMode('crisis');
    setOrbitMood('alarmed');
    setOrbitMessage(solarEvent.orbitWarning);

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
      setOrbitMessage("Previewing Full Science: Discoveries surge, but battery banks face intense discharge!");
    } else if (option.worldVisualEffect === 'emergency_dim') {
      sceneManagerRef.current?.setVisualMode('preview_emergency');
      setOrbitMood('thinking');
      setOrbitMessage("Previewing Emergency Mode: Habitat lighting dimmed to standby. 48-hour battery cushion guaranteed.");
    } else {
      sceneManagerRef.current?.setVisualMode('preview_conserve');
      setOrbitMood('normal');
      setOrbitMessage("Previewing Power Conservation: Science laser paused, life support safe and balanced.");
    }
  };

  /* ------------------ COMMIT DECISION & CONSEQUENCES ------------------ */
  const handleCommitDecision = (optionId: string) => {
    const option = currentEvent?.options.find(o => o.id === optionId);
    if (!option) return;

    setLastCommittedDecision(option);
    setPreviousResources(resources);

    // Deterministically advance simulation
    const updated = SimulationEngine.advanceCycle(resources, option);
    setResources(updated);
    setCycle(prev => Math.min(maxCycles, prev + 1));

    // Update 3D World consequence state
    sceneManagerRef.current?.applyConsequenceState(updated, option.worldVisualEffect);

    const audio = AudioEngine.getInstance();
    if (option.deltaBattery >= 0) {
      audio.playSuccessChime();
      audio.playAmbient();
      setOrbitMood('celebrating');
      setOrbitMessage("Strategy committed! Power grid stabilized and batteries protected.");
    } else {
      audio.playWarningKlaxon();
      setOrbitMood('alarmed');
      setOrbitMessage("Warning: High power draw active! Batteries draining toward critical threshold.");
    }

    setGameState('consequence');
  };

  /* ------------------ REWIND / TRY DIFFERENT STRATEGY ------------------ */
  const handleRewindDecision = () => {
    AudioEngine.getInstance().playBeep(440, 0.1);
    setResources(previousResources);
    setCycle(prev => Math.max(1, prev - 1));
    sceneManagerRef.current?.setVisualMode('crisis');
    setOrbitMood('thinking');
    setOrbitMessage("Timeline rewound! Choose your preferred strategy carefully.");
    setGameState('future_fork');
  };

  /* ------------------ RESUME EXPLORATION AFTER CONSEQUENCE ------------------ */
  const handleResumeMission = () => {
    AudioEngine.getInstance().playBeep(880, 0.08);
    sceneManagerRef.current?.resetToOverview();
    setOrbitMood('normal');
    setOrbitMessage("Mission resumed on Sol 42. Subsystems operating on committed power grid profile.");
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

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Three.js 3D Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

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
            inCrisis={gameState === 'future_fork' || gameState === 'consequence'}
          />

          <OrbitCompanionWidget
            message={orbitMessage}
            mood={orbitMood}
            onPlayVoice={() => AudioEngine.getInstance().playVoice('problem1')}
            hasVoice={true}
          />

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
          onDismiss={handleResumeMission}
          onRewind={handleRewindDecision}
        />
      )}

      {/* Credits & License Modal */}
      {showCredits && (
        <CreditsModal onClose={() => setShowCredits(false)} />
      )}
    </div>
  );
};
