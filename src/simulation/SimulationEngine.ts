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

  /**
   * Signature Feature: Deterministic Future Fork Simulator
   * Simulates the exact consequences of all 3 branches from the current state.
   */
  public static simulateFutureFork(
    currentState: ResourceState,
    event: CriticalEvent
  ): FutureOutcome[] {
    return event.options.map(option => {
      const simulatedPower = Math.max(0, Math.min(100, currentState.power + option.deltaPower));
      const simulatedBattery = Math.max(0, Math.min(100, currentState.battery + option.deltaBattery));
      const simulatedWater = Math.max(0, Math.min(100, currentState.water + option.deltaWater));
      const simulatedFood = Math.max(0, Math.min(100, currentState.food + option.deltaFood));
      const simulatedOxygen = Math.max(0, Math.min(100, currentState.oxygen + option.deltaOxygen));
      const simulatedCrew = Math.max(0, Math.min(100, currentState.crewHealth + option.deltaCrew));
      const simulatedScience = Math.max(0, currentState.scienceScore + option.deltaScience);

      const simulatedEndState: ResourceState = {
        ...currentState,
        power: simulatedPower,
        battery: simulatedBattery,
        water: simulatedWater,
        food: simulatedFood,
        oxygen: simulatedOxygen,
        crewHealth: simulatedCrew,
        scienceScore: simulatedScience
      };

      const startHealth = (currentState.battery * 0.35 + currentState.crewHealth * 0.35 + currentState.water * 0.15 + currentState.power * 0.15);
      const endHealth = (simulatedBattery * 0.35 + simulatedCrew * 0.35 + simulatedWater * 0.15 + simulatedPower * 0.15);
      const deltaHealth = endHealth - startHealth;

      const trajectory: TrajectoryPoint[] = [
        { hourLabel: "Now", healthValue: Math.round(startHealth) },
        { hourLabel: "+2h", healthValue: Math.round(Math.max(0, Math.min(100, startHealth + deltaHealth * 0.35))) },
        { hourLabel: "+4h", healthValue: Math.round(Math.max(0, Math.min(100, startHealth + deltaHealth * 0.70))) },
        { hourLabel: "+6h", healthValue: Math.round(Math.max(0, Math.min(100, endHealth))) }
      ];

      let riskStatus = FutureRiskStatus.SAFE;
      if (simulatedBattery <= 25 || simulatedCrew <= 35 || simulatedWater <= 20) {
        riskStatus = FutureRiskStatus.FAIL;
      } else if (simulatedBattery <= 45 || simulatedCrew <= 60 || simulatedPower <= 35) {
        riskStatus = FutureRiskStatus.RISKY;
      }

      const forecastBadge: 'OPTIMISTIC' | 'EXPECTED' | 'PESSIMISTIC' =
        riskStatus === FutureRiskStatus.FAIL ? 'PESSIMISTIC' :
        (option.deltaBattery > 10 || option.deltaCrew > 3) ? 'OPTIMISTIC' : 'EXPECTED';

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
   * Advances the mission cycle after user commits a decision
   */
  public static advanceCycle(
    state: ResourceState,
    option: DecisionOption,
    solarForecastModifier: number = 0
  ): ResourceState {
    const baselinePower = -4 + solarForecastModifier;
    const baselineBattery = state.power < 40 ? -8 : 4;
    const baselineWater = -3;
    const baselineFood = state.greenhouseMode === GreenhouseMode.GROW_MORE ? 5 : 2;
    const baselineOxygen = -1;
    const baselineCrew = (state.battery < 25 || state.oxygen < 30) ? -12 : 0;

    return {
      ...state,
      power: Math.max(0, Math.min(100, Math.round(state.power + option.deltaPower + baselinePower))),
      battery: Math.max(0, Math.min(100, Math.round(state.battery + option.deltaBattery + baselineBattery))),
      water: Math.max(0, Math.min(100, Math.round(state.water + option.deltaWater + baselineWater))),
      food: Math.max(0, Math.min(100, Math.round(state.food + option.deltaFood + baselineFood))),
      oxygen: Math.max(0, Math.min(100, Math.round(state.oxygen + option.deltaOxygen + baselineOxygen))),
      crewHealth: Math.max(0, Math.min(100, Math.round(state.crewHealth + option.deltaCrew + baselineCrew))),
      scienceScore: Math.max(0, state.scienceScore + option.deltaScience)
    };
  }

  /**
   * Generates Root Cause Mission Autopsy if Outpost fails
   */
  public static generateMissionAutopsy(
    finalState: ResourceState,
    missionLogs: MissionLogEntry[]
  ): MissionAutopsyData {
    let failedMetric = "CRITICAL POWER LOSS";
    if (finalState.battery <= 20) failedMetric = "BATTERY DEPLETION";
    else if (finalState.crewHealth <= 25) failedMetric = "CREW HEALTH COMPROMISED";
    else if (finalState.water <= 15) failedMetric = "WATER EXHAUSTION";

    const primaryCause = failedMetric === "BATTERY DEPLETION"
      ? "Battery bank reached critical 0% reserve. With no stored electrical power, habitat life support and heaters went offline."
      : "Life support margins were breached under prolonged energy deficit.";

    const missedWarning = "Solar intake fell in earlier cycles, but high-drain systems remained online instead of switching to energy-conservation mode.";
    const earliestRecoveryPoint = "During the Solar Power Drop crisis, choosing 'Save Power' or 'Emergency Mode' preserves over 40% battery life.";
    const alternativeDecision = "Save electricity early! Science experiments can wait, but life support batteries cannot.";
    const lessonLearned = "In lunar space exploration, all systems are interconnected: saving electricity early protects battery reserves, which keeps oxygen, heating, and food alive for your crew.";

    return {
      failedMetric,
      primaryCause,
      missedWarning,
      earliestRecoveryPoint,
      alternativeDecision,
      lessonLearned,
      timeline: [
        {
          stage: "NOMINAL",
          cycle: 1,
          description: "Mission began with healthy baseline reserves across all subsystems.",
          icon: "🚀",
          metricHighlight: "All systems nominal (100%)"
        },
        {
          stage: "WARNING",
          cycle: 2,
          description: "Solar panel intake plummeted when lunar mountain ridge cast shadows.",
          icon: "⚠️",
          metricHighlight: "Solar generation dropped 70%"
        },
        {
          stage: "DECISION",
          cycle: 2,
          description: "Full science operations were kept running at maximum power drain.",
          icon: "⚡",
          metricHighlight: "Battery drain accelerated"
        },
        {
          stage: "FAILURE",
          cycle: 3,
          description: "Battery reserves depleted completely, causing secondary cascade shutdown.",
          icon: "🔴",
          metricHighlight: "Battery reached 0%"
        }
      ]
    };
  }
}
