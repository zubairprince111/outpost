export enum RadiationSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH"
}

export enum FutureRiskStatus {
  SAFE = "SAFE",
  RISKY = "RISKY",
  FAIL = "FAIL"
}

export enum GreenhouseMode {
  SAVE_RESOURCES = "Conserve",
  BALANCED = "Standard",
  GROW_MORE = "Grow More"
}

export enum ScienceMode {
  PAUSED = "Paused",
  ACTIVE = "Standard",
  HIGH_OUTPUT = "Intensive"
}

export enum SubsystemType {
  SOLAR_ARRAY = "SOLAR_ARRAY",
  GREENHOUSE = "GREENHOUSE",
  HABITAT = "HABITAT",
  SCIENCE_LAB = "SCIENCE_LAB",
  BATTERY_STORAGE = "BATTERY_STORAGE",
  COMM_ARRAY = "COMM_ARRAY",
  ROVER = "ROVER",
  RADIATION_SHIELD = "RADIATION_SHIELD"
}

export interface ResourceState {
  power: number;         // 0..100 %
  battery: number;       // 0..100 %
  water: number;         // 0..100 %
  food: number;          // 0..100 %
  oxygen: number;        // 0..100 %
  crewHealth: number;    // 0..100 %
  scienceScore: number;  // points
  radiation: RadiationSeverity;
  shieldingActive: boolean;
  solarIrradiance: number; // %
  greenhouseMode: GreenhouseMode;
  scienceMode: ScienceMode;
}

export interface SubsystemState {
  type: SubsystemType;
  title: string;
  emoji: string;
  shortName: string;
  health: number;
  active: boolean;
  powerConsumption: number; // negative is generation
  statusText: string;
  kidExplanation: string;
  actionName?: string;
  position: [number, number, number]; // 3D coordinates in world
}

export interface DecisionOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  benefits: string[];
  costs: string[];
  risks: string[];
  deltaPower: number;
  deltaBattery: number;
  deltaWater: number;
  deltaFood: number;
  deltaOxygen: number;
  deltaCrew: number;
  deltaScience: number;
  causalChain: string[];
  worldVisualEffect: 'science_laser' | 'balanced_conserve' | 'emergency_dim';
}

export interface CriticalEvent {
  id: string;
  triggerCycle: number;
  title: string;
  icon: string;
  summary: string;
  orbitWarning: string;
  whyExplanation: string;
  options: DecisionOption[];
}

export interface TrajectoryPoint {
  hourLabel: string;
  healthValue: number;
}

export interface FutureOutcome {
  option: DecisionOption;
  simulatedEndState: ResourceState;
  riskStatus: FutureRiskStatus;
  trajectory: TrajectoryPoint[];
  forecastBadge: 'OPTIMISTIC' | 'EXPECTED' | 'PESSIMISTIC';
}

export interface MissionLogEntry {
  cycle: number;
  eventTitle: string;
  decisionChosen: string;
  batteryAtEnd: number;
  powerAtEnd: number;
  crewAtEnd: number;
  wasWarningSign: boolean;
  warningNote: string;
}

export interface AutopsyTimelineStep {
  stage: string;
  cycle: number;
  description: string;
  icon: string;
  metricHighlight: string;
}

export interface MissionAutopsyData {
  failedMetric: string;
  primaryCause: string;
  missedWarning: string;
  earliestRecoveryPoint: string;
  alternativeDecision: string;
  lessonLearned: string;
  timeline: AutopsyTimelineStep[];
}

export interface MissionLevel {
  id: number;
  title: string;
  subtitle: string;
  totalCycles: number;
  description: string;
  keyConcepts: string[];
}
