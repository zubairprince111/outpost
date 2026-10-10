import {
  RadiationSeverity,
  FutureRiskStatus,
  GreenhouseMode,
  ScienceMode,
  SubsystemType,
  ResourceState,
  SubsystemState,
  DecisionOption,
  CriticalEvent,
  TrajectoryPoint,
  FutureOutcome,
  MissionLogEntry,
  MissionAutopsyData,
  MissionLevel
} from './SimulationModels';

export class SimulationEngine {
  public static getAvailableLevels(): MissionLevel[] {
    return [
      {
        id: 1,
        title: "First Footsteps",
        subtitle: "Power, Food & Water Basics",
        totalCycles: 5,
        description: "Learn how the outpost balances energy generation from the Sun with food and water reserves for crew survival.",
        keyConcepts: ["Solar vs Battery", "Water conservation", "Crew survival"]
      },
      {
        id: 2,
        title: "Life Support & Science",
        subtitle: "Oxygen & Research Balances",
        totalCycles: 7,
        description: "Operate the research laboratory while sustaining oxygen recycling and closed-loop greenhouse crops.",
        keyConcepts: ["Science trade-offs", "Oxygen cycling", "Subsystem prioritization"]
      },
      {
        id: 3,
        title: "Cosmic Rays & Solar Storms",
        subtitle: "Radiation Shielding & Forecasting",
        totalCycles: 10,
        description: "Navigate extreme space weather with regolith shielding and AI-assisted solar forecasting before darkness falls.",
        keyConcepts: ["Radiation shielding", "Solar forecasting", "Preventive decisions"]
      }
    ];
  }

  public static getInitialState(): ResourceState {
    return {
      power: 78,
      battery: 72,
      water: 68,
      food: 82,
      oxygen: 94,
      crewHealth: 90,
      scienceScore: 120,
      radiation: RadiationSeverity.LOW,
      shieldingActive: false,
      solarIrradiance: 85,
      greenhouseMode: GreenhouseMode.BALANCED,
      scienceMode: ScienceMode.ACTIVE
    };
  }

  public static getInitialSubsystems(state: ResourceState): SubsystemState[] {
    return [
      {
        type: SubsystemType.SOLAR_ARRAY,
        title: "Solar Power Array",
        emoji: "☀️",
        shortName: "Solar",
        health: 96,
        active: true,
        powerConsumption: -45, // negative consumption means generation!
        statusText: "Tracking Sun at 72° azimuth",
        kidExplanation: "Articulated solar wings catch sunlight and convert it into clean electricity for the entire outpost.",
        actionName: "Optimize Angle",
        position: [-14, 0, 8]
      },
      {
        type: SubsystemType.BATTERY_STORAGE,
        title: "Battery Storage Bank",
        emoji: "🔋",
        shortName: "Battery",
        health: 92,
        active: true,
        powerConsumption: 0,
        statusText: `${Math.round(state.battery)}% Reserve Capacity`,
        kidExplanation: "Heavy lithium-iron battery cells store energy for when the Sun dips below lunar mountains.",
        actionName: "Emergency Mode",
        position: [-6, 0, 5]
      },
      {
        type: SubsystemType.HABITAT,
        title: "Crew Habitat Dome",
        emoji: "🏠",
        shortName: "Habitat",
        health: 98,
        active: true,
        powerConsumption: 18,
        statusText: "Life Support 1.0 ATM (Safe)",
        kidExplanation: "Pressurized dome where astronauts sleep, exercise, eat, and breathe clean oxygen.",
        actionName: "Check Pressure",
        position: [0, 0, 0]
      },
      {
        type: SubsystemType.GREENHOUSE,
        title: "Lunar Biodome Greenhouse",
        emoji: "🌱",
        shortName: "Greenhouse",
        health: 88,
        active: true,
        powerConsumption: 12,
        statusText: `Microgreens & Spirulina (${state.greenhouseMode})`,
        kidExplanation: "Hydroponic plants use LED lights to make fresh vegetables and recycle carbon dioxide into oxygen.",
        actionName: "Adjust Crops",
        position: [8, 0, -4]
      },
      {
        type: SubsystemType.SCIENCE_LAB,
        title: "Science Laboratory",
        emoji: "🔬",
        shortName: "Lab",
        health: 95,
        active: state.scienceMode !== ScienceMode.PAUSED,
        powerConsumption: state.scienceMode === ScienceMode.HIGH_OUTPUT ? 24 : 14,
        statusText: `Lunar core spectrometer (${state.scienceMode})`,
        kidExplanation: "High-tech robotic microscopes and spectrometers analyze moon rocks to discover water ice and minerals.",
        actionName: "Toggle Output",
        position: [6, 0, 6]
      },
      {
        type: SubsystemType.COMM_ARRAY,
        title: "Deep Space Comm Antenna",
        emoji: "📡",
        shortName: "Comm",
        health: 90,
        active: true,
        powerConsumption: 6,
        statusText: "Earth Telemetry: 1.28s light delay",
        kidExplanation: "High-gain dish sends scientific data and astronaut video calls back to NASA Mission Control on Earth.",
        actionName: "Ping Houston",
        position: [-4, 0, -8]
      },
      {
        type: SubsystemType.ROVER,
        title: "Lunar Exploration Rover",
        emoji: "🚙",
        shortName: "Rover",
        health: 85,
        active: true,
        powerConsumption: 8,
        statusText: "Shackleton Crater Survey Bay",
        kidExplanation: "Autonomous 6-wheel rover that explores distant craters and drills for buried lunar ice.",
        actionName: "Deploy Survey",
        position: [12, 0, 8]
      }
    ];
  }

  public static getEventsForLevel(levelId: number): CriticalEvent[] {
    return [
      this.createSolarDropEvent(2),
      this.createWaterClogEvent(4)
    ];
  }

  public static createSolarDropEvent(triggerCycle: number): CriticalEvent {
    return {
      id: "event_solar_drop",
      triggerCycle,
      title: "SOLAR POWER DROP DETECTED",
      icon: "☀️",
      summary: "A tall lunar mountain ridge is casting a deep shadow over the main solar arrays. Solar power generation is plummeting fast!",
      orbitWarning: "Commander, solar power is falling fast! Our battery reserves will drain quickly unless we act immediately. What should we do?",
      whyExplanation: "Because the Moon has no atmosphere to scatter light, lunar mountain shadows are pitch black and immediately drop solar generation by over 70%.",
      options: [
        {
          id: "opt_solar_keep_running",
          title: "Keep Science Running",
          subtitle: "Continue full experiments & maximum comfort",
          icon: "🔬",
          benefits: ["Science discoveries proceed at 100% (+60 points)", "Crew comfort & laboratory stay full power"],
          costs: ["Power deficit draws heavily from battery bank", "Battery reserve drains rapidly"],
          risks: ["Severe danger of total battery depletion and blackout"],
          deltaPower: -25,
          deltaBattery: -35,
          deltaWater: -5,
          deltaFood: 0,
          deltaOxygen: 0,
          deltaCrew: -5,
          deltaScience: 60,
          causalChain: [
            "Decision: Full Power Maintained",
            "Solar intake remains low in shadow (-70%)",
            "Battery bank forced to bridge massive power gap",
            "Science laser yields huge discoveries (+60 pts)",
            "Battery reserve drops dangerously to 37%!"
          ],
          worldVisualEffect: 'science_laser'
        },
        {
          id: "opt_solar_reduce_science",
          title: "Save Power (Reduce Science)",
          subtitle: "Pause heavy lab lasers to protect battery life",
          icon: "⚡",
          benefits: ["Saves 20 kW electricity immediately", "Slows battery drain by 75%", "Life support stays 100% protected"],
          costs: ["Science research paused for this cycle"],
          risks: ["Slight delay in mission science objectives"],
          deltaPower: 10,
          deltaBattery: 12,
          deltaWater: 0,
          deltaFood: 5,
          deltaOxygen: 0,
          deltaCrew: 2,
          deltaScience: -15,
          causalChain: [
            "Decision: Science Paused / Conservation Active",
            "Heavy spectrometer laser powered down",
            "Battery drainage halted and stabilized safely",
            "Habitat and life support maintain optimal warmth",
            "Outpost operates smoothly within safe margins!"
          ],
          worldVisualEffect: 'balanced_conserve'
        },
        {
          id: "opt_solar_emergency_power",
          title: "Activate Emergency Mode",
          subtitle: "Cut non-essentials & dim habitat to preserve power",
          icon: "🔋",
          benefits: ["Conserves maximum energy reserve (+25% buffer)", "Guarantees habitat survival for over 48 hours"],
          costs: ["Science lab shut down", "Greenhouse lights dimmed"],
          risks: ["Slightly lower hydroponic crop growth"],
          deltaPower: 25,
          deltaBattery: 25,
          deltaWater: 5,
          deltaFood: -8,
          deltaOxygen: 1,
          deltaCrew: 5,
          deltaScience: -40,
          causalChain: [
            "Decision: Emergency Power Grid Engaged",
            "Non-essential subsystems enter sleep mode",
            "Batteries insulated and protected for future cycles",
            "Greenhouse enters low-power sleep (slight food dip)",
            "Maximum mission safety buffer achieved!"
          ],
          worldVisualEffect: 'emergency_dim'
        }
      ]
    };
  }

  public static createWaterClogEvent(triggerCycle: number): CriticalEvent {
    return {
      id: "event_water_clog",
      triggerCycle,
      title: "WATER RECYCLER FILTER ISSUE",
      icon: "💧",
      summary: "Mineral buildup from lunar regolith hydroponics has clogged the primary water filtration unit. Water reserves are not recharging.",
      orbitWarning: "Commander, our closed-loop water recycler is struggling. Every drop of water on the Moon is precious!",
      whyExplanation: "Water on the Moon is recycled up to 98% from moisture, sweat, and plant transpiration. If the recycler fails, the habitat relies on limited emergency ice reserves.",
      options: [
        {
          id: "opt_water_high_flush",
          title: "High-Pressure Thermal Flush",
          subtitle: "Use heating coils and pumps to vaporize mineral clog",
          icon: "🔥",
          benefits: ["Restores water recycling to 98% efficiency immediately", "Crops receive clean hydration"],
          costs: ["Requires sudden burst of electrical power and water"],
          risks: ["Temporary strain on power grid"],
          deltaPower: -15,
          deltaBattery: -12,
          deltaWater: 25,
          deltaFood: 5,
          deltaOxygen: 0,
          deltaCrew: 5,
          deltaScience: 0,
          causalChain: [
            "Thermal coils vaporize mineral block",
            "Clean water recycling restored (+25%)",
            "Greenhouse crops thrive with fresh moisture",
            "Water security restored across the outpost"
          ],
          worldVisualEffect: 'balanced_conserve'
        },
        {
          id: "opt_water_ration",
          title: "Ration Water & Manual Clean",
          subtitle: "Crew gently clears filters by hand to save electricity",
          icon: "🪛",
          benefits: ["Conserves electrical power completely", "Zero battery impact"],
          costs: ["Crew spends cycle cleaning instead of researching"],
          risks: ["Water recovers slowly over time"],
          deltaPower: 5,
          deltaBattery: 5,
          deltaWater: 10,
          deltaFood: -2,
          deltaOxygen: 0,
          deltaCrew: -3,
          deltaScience: -15,
          causalChain: [
            "Astronauts service filters manually",
            "Zero electricity spent",
            "Water reserves stabilize gradually",
            "Safe conservative engineering decision"
          ],
          worldVisualEffect: 'balanced_conserve'
        },
        {
          id: "opt_water_draw_emergency",
          title: "Melt Crater Ice Reserves",
          subtitle: "Use backup water ice without fixing the recycler",
          icon: "🧊",
          benefits: ["No crew work or electrical changes needed right now"],
          costs: ["Consumes precious non-renewable emergency ice"],
          risks: ["Leaves outpost vulnerable if another crisis occurs"],
          deltaPower: 0,
          deltaBattery: 0,
          deltaWater: -15,
          deltaFood: 0,
          deltaOxygen: 0,
          deltaCrew: -5,
          deltaScience: 10,
          causalChain: [
            "Backup crater ice melted and consumed",
            "Root filter clog left unaddressed",
            "Water reserves drop toward critical warning line",
            "Safety cushion eroded"
          ],
          worldVisualEffect: 'emergency_dim'
        }
      ]
    };
  }

  public static createRadiationStormEvent(triggerCycle: number): CriticalEvent {
    return {
      id: "event_radiation_storm",
      triggerCycle,
      title: "SOLAR RADIATION STORM INBOUND",
      icon: "🛡️",
      summary: "NASA Deep Space Network detected a coronal mass ejection heading toward the lunar South Pole. Unshielded electronics and crew face elevated radiation!",
      orbitWarning: "Commander, solar particle flux is spiking! We must balance electromagnetic shielding, crew shelter protocol, and telemetry.",
      whyExplanation: "Unlike Earth, the Moon has no global magnetic field or thick atmosphere to deflect solar protons. Active shielding and water-wall shelters protect astronauts.",
      options: [
        {
          id: "opt_storm_full_shield",
          title: "Energize Magnetic & Water Shielding",
          subtitle: "Divert battery power to habitat shielding coils",
          icon: "🛡️",
          benefits: ["Crew health 100% protected (+5%)", "All sensitive lab instruments preserved (+20 PTS)"],
          costs: ["Consumes 15% battery reserve for shield coils"],
          risks: ["Requires healthy battery buffer to sustain"],
          deltaPower: -10,
          deltaBattery: -15,
          deltaWater: 0,
          deltaFood: 0,
          deltaOxygen: 2,
          deltaCrew: 5,
          deltaScience: 20,
          causalChain: [
            "Decision: Active Radiation Shielding Online",
            "Battery bank powers electromagnetic deflector",
            "Crew sheltered safely inside habitat water-wall core",
            "Storm telemetry captured for +20 Science PTS!"
          ],
          worldVisualEffect: 'balanced_conserve'
        },
        {
          id: "opt_storm_shelter_only",
          title: "Passive Shelter & Low Power",
          subtitle: "Retreat crew to inner core and power down exterior arrays",
          icon: "🏠",
          benefits: ["Saves +10% battery and +10% power", "Protects crew with zero electrical drain"],
          costs: ["Exterior rover and telescope operations paused (-10 PTS)"],
          risks: ["Minor delay in surface exploration"],
          deltaPower: 10,
          deltaBattery: 10,
          deltaWater: 2,
          deltaFood: 0,
          deltaOxygen: 0,
          deltaCrew: 2,
          deltaScience: -10,
          causalChain: [
            "Decision: Passive Storm Shelter Protocol",
            "Exterior subsystems placed in safe sleep mode",
            "Battery reserves climb +10% during storm passage",
            "Crew emerges safe and ready for final mission phase"
          ],
          worldVisualEffect: 'emergency_dim'
        },
        {
          id: "opt_storm_ignore_research",
          title: "Ride Out Storm at Full Science",
          subtitle: "Record high-energy cosmic rays without powering down",
          icon: "⚡",
          benefits: ["Massive rare particle data (+75 Science PTS)"],
          costs: ["Radiation degrades solar circuits (-20% Power, -20% Battery)", "Crew stress increases (-18% Crew Health)"],
          risks: ["High risk of subsystem damage and crew radiation exposure"],
          deltaPower: -20,
          deltaBattery: -20,
          deltaWater: -5,
          deltaFood: -5,
          deltaOxygen: -5,
          deltaCrew: -18,
          deltaScience: 75,
          causalChain: [
            "Decision: Unshielded High-Energy Recording",
            "Spectrometers capture rare solar storm data (+75 PTS)",
            "Solar inverters suffer proton upsets (-20% Battery)",
            "Crew radiation exposure triggers medical alert (-18% Health)!"
          ],
          worldVisualEffect: 'science_laser'
        }
      ]
    };
  }

  public static getEventForCycle(cycle: number): CriticalEvent {
    const mod = ((cycle - 1) % 3);
    if (mod === 0) return this.createSolarDropEvent(cycle);
    if (mod === 1) return this.createWaterClogEvent(cycle);
    return this.createRadiationStormEvent(cycle);
  }

  /**
   * Signature Feature: Deterministic Future Fork Simulator
   * Simulates the exact consequences of all 3 branches from the current state.
   */
  public static simulateFutureFork(
    currentState: ResourceState,
    event: CriticalEvent
  ): FutureOutcome[] {
    return event.options.map(option => {
      const simulatedEndState = this.advanceCycle(currentState, option);

      const startHealth = (currentState.battery * 0.35 + currentState.crewHealth * 0.35 + currentState.water * 0.15 + currentState.power * 0.15);
      const endHealth = (simulatedEndState.battery * 0.35 + simulatedEndState.crewHealth * 0.35 + simulatedEndState.water * 0.15 + simulatedEndState.power * 0.15);
      const deltaHealth = endHealth - startHealth;

      const trajectory: TrajectoryPoint[] = [
        { hourLabel: "Now", healthValue: Math.round(startHealth) },
        { hourLabel: "+2h", healthValue: Math.round(Math.max(0, Math.min(100, startHealth + deltaHealth * 0.35))) },
        { hourLabel: "+4h", healthValue: Math.round(Math.max(0, Math.min(100, startHealth + deltaHealth * 0.70))) },
        { hourLabel: "+6h", healthValue: Math.round(Math.max(0, Math.min(100, endHealth))) }
      ];

      let riskStatus = FutureRiskStatus.SAFE;
      if (simulatedEndState.battery <= 25 || simulatedEndState.crewHealth <= 35 || simulatedEndState.water <= 20) {
        riskStatus = FutureRiskStatus.FAIL;
      } else if (simulatedEndState.battery <= 45 || simulatedEndState.crewHealth <= 65 || simulatedEndState.power <= 40 || option.deltaBattery <= -20) {
        riskStatus = FutureRiskStatus.RISKY;
      }

      const forecastBadge: 'OPTIMISTIC' | 'EXPECTED' | 'PESSIMISTIC' =
        riskStatus === FutureRiskStatus.FAIL ? 'PESSIMISTIC' :
        (option.deltaBattery >= 10 || option.deltaWater >= 15) ? 'OPTIMISTIC' : 'EXPECTED';

      return {
        option,
        simulatedEndState,
        riskStatus,
        trajectory,
        forecastBadge
      };
    });
  }

  /**
   * Advances the mission cycle after user commits a decision.
   * Matches simulateFutureFork 100% deterministically so preview == actual result.
   */
  public static advanceCycle(
    state: ResourceState,
    option: DecisionOption
  ): ResourceState {
    const nextScienceMode =
      option.worldVisualEffect === 'science_laser'
        ? ScienceMode.HIGH_OUTPUT
        : option.worldVisualEffect === 'emergency_dim'
        ? ScienceMode.PAUSED
        : ScienceMode.ACTIVE;

    const nextGreenhouseMode =
      option.worldVisualEffect === 'emergency_dim'
        ? GreenhouseMode.SAVE_RESOURCES
        : GreenhouseMode.BALANCED;

    return {
      ...state,
      power: Math.max(0, Math.min(100, Math.round(state.power + option.deltaPower))),
      battery: Math.max(0, Math.min(100, Math.round(state.battery + option.deltaBattery))),
      water: Math.max(0, Math.min(100, Math.round(state.water + option.deltaWater))),
      food: Math.max(0, Math.min(100, Math.round(state.food + option.deltaFood))),
      oxygen: Math.max(0, Math.min(100, Math.round(state.oxygen + option.deltaOxygen))),
      crewHealth: Math.max(0, Math.min(100, Math.round(state.crewHealth + option.deltaCrew))),
      scienceScore: Math.max(0, state.scienceScore + option.deltaScience),
      scienceMode: nextScienceMode,
      greenhouseMode: nextGreenhouseMode
    };
  }

  /**
   * Generates Root Cause Mission Autopsy & Final Evaluation
   */
  public static generateMissionAutopsy(
    finalState: ResourceState,
    missionLogs: MissionLogEntry[]
  ): MissionAutopsyData {
    const isFailed = finalState.battery <= 30 || finalState.crewHealth <= 45 || finalState.water <= 25;

    let failedMetric = "ALL SYSTEMS STABLE";
    if (finalState.battery <= 30) failedMetric = "BATTERY DEPLETION WARNING";
    else if (finalState.crewHealth <= 45) failedMetric = "CREW HEALTH COMPROMISED";
    else if (finalState.water <= 25) failedMetric = "WATER RESERVE CRITICAL";

    const primaryCause = isFailed
      ? `High-drain operations pushed outpost reserves into the red (${failedMetric}: Battery ${Math.round(finalState.battery)}%, Water ${Math.round(finalState.water)}%, Crew ${Math.round(finalState.crewHealth)}%).`
      : `Balanced systems engineering kept all vital life-support reserves safe (Battery ${Math.round(finalState.battery)}%, Water ${Math.round(finalState.water)}%, Crew ${Math.round(finalState.crewHealth)}%) while achieving ${finalState.scienceScore} Science PTS.`;

    const missedWarning = isFailed
      ? "When solar or filtration crises struck, keeping heavy research online drained backup buffers faster than the outpost could recharge."
      : "Early warning telemetry from ORBIT was heeded promptly, preventing any single subsystem crisis from cascading into life support.";

    const earliestRecoveryPoint = "During each Future Fork crisis, pausing non-essential loads or flushing clogged filters restores +10% to +25% safety margin.";
    const alternativeDecision = "Prioritize battery, water, and crew protection first — sustainable outposts unlock more long-term science than risky short-term surges.";
    const lessonLearned = "In lunar space exploration, all systems are interconnected: saving electricity and recycling water early protects battery reserves, which keeps oxygen, heating, and food alive for your crew.";

    const timeline = [
      {
        stage: "TOUCHDOWN",
        cycle: 1,
        description: "Mission began at Sol 42 with nominal baseline reserves (78% Power, 72% Battery, 68% Water).",
        icon: "🚀",
        metricHighlight: "Baseline Systems Nominal"
      },
      ...missionLogs.map((log, idx) => ({
        stage: log.wasWarningSign ? `RISK TAKEN` : `STABILIZED`,
        cycle: idx + 2,
        description: `${log.eventTitle}: Committed "${log.decisionChosen}".`,
        icon: log.wasWarningSign ? "⚠️" : "✅",
        metricHighlight: `BAT ${log.batteryAtEnd}% • PWR ${log.powerAtEnd}% • CREW ${log.crewAtEnd}%`
      })),
      {
        stage: isFailed ? "CRITICAL STRAIN" : "MISSION SUCCESS",
        cycle: missionLogs.length + 1,
        description: isFailed
          ? "Cumulative resource drain left the lunar base vulnerable to blackout."
          : "Outpost achieved full operational sustainability at the Lunar South Pole!",
        icon: isFailed ? "🔴" : "🏆",
        metricHighlight: `Final Score: ${finalState.scienceScore} PTS • BAT ${Math.round(finalState.battery)}%`
      }
    ];

    return {
      failedMetric,
      primaryCause,
      missedWarning,
      earliestRecoveryPoint,
      alternativeDecision,
      lessonLearned,
      timeline
    };
  }
}
