// ============================================================
// OSCAR MVP — Shared Types & Constants
// ============================================================

// --- Enums ---

export type Role = 'USER' | 'ADMIN';
export type ChecklistStatus = 'OK' | 'ATTENTION' | 'NA';
export type RoundStatus = 'IN_PROGRESS' | 'COMPLETED';
export type Condition = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
export type Severity = 'GREEN' | 'CAUTION' | 'CRITICAL';
export type OperatorLevel = 'VETERAN' | 'EXPERIENCED' | 'TRAINEE';
export type StatusBand = 'Stable' | 'Slight Drift' | 'Moderate Concern' | 'High Risk';

// --- User ---

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  operatorLevel: OperatorLevel;
  active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// --- Plant ---

export interface Plant {
  id: string;
  name: string;
  location: string | null;
  plantType: string | null;
  active: boolean;
}

// --- Checklist ---

export interface ChecklistSection {
  id: string;
  name: string;
  displayOrder: number;
  active: boolean;
  items?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  sectionId: string;
  name: string;
  description: string | null;
  displayOrder: number;
  requiresNoteOnAttention: boolean;
  minimumLevel: OperatorLevel;
  active: boolean;
}

export interface ChecklistEntry {
  id: string;
  roundId: string;
  itemId: string;
  status: ChecklistStatus;
  note: string | null;
  imageUrl: string | null;
  timestamp: string;
}

export interface ChecklistSectionWithEntries extends ChecklistSection {
  items: Array<ChecklistItem & { entry: ChecklistEntry | null }>;
  completed: number;
  total: number;
}

// --- Lab Data ---

export interface LabField {
  id: string;
  name: string;
  unit: string;
  displayOrder: number;
  isRequired: boolean;
  recommendedFrequency: string;
}

export interface LabEntry {
  id: string;
  roundId: string;
  labFieldId: string;
  value: number;
  timestamp: string;
}

export interface LabFieldWithEntry extends LabField {
  entry: LabEntry | null;
}

// --- Observations ---

export interface ObservationTag {
  id: string;
  name: string;
  category: string | null;
}

export interface ObservationEntry {
  id: string;
  roundId: string;
  tagId: string;
  tag?: ObservationTag;
  area: string | null;
  note: string | null;
  timestamp: string;
}

// --- Rules ---

export interface ThresholdRule {
  id: string;
  plantId: string;
  labFieldId: string;
  labField?: LabField;
  cautionLow: number | null;
  cautionHigh: number | null;
  criticalLow: number | null;
  criticalHigh: number | null;
  suggestionText: string;
  active: boolean;
}

export interface TagRule {
  id: string;
  plantId: string;
  tagId: string;
  tag?: ObservationTag;
  suggestionText: string;
  severity: Severity;
  active: boolean;
}

// --- Suggestions ---

export interface Suggestion {
  id: string;
  roundId: string;
  ruleType: string;
  ruleName: string;
  message: string;
  severity: Severity;
  acknowledged: boolean;
  timestamp: string;
  // OSCAR Logic Matrix fields
  ruleId?: string;
  category?: string;
  title?: string;
  severityLevel?: number;
  deduction?: number;
  confidence?: string;
  supportingFields?: string[];
}

// --- Issues ---

export interface Issue {
  id: string;
  roundId: string;
  description: string;
  actionTaken: string | null;
  supervisorFlag: boolean;
  resolved: boolean;
  timestamp: string;
}

// --- Daily Round ---

export interface DailyRound {
  id: string;
  plantId: string;
  operatorId: string;
  date: string;
  startedAt: string;
  completedAt: string | null;
  signedOff: boolean;
  status: RoundStatus;
  overallCondition: Condition | null;
  notes: string | null;
  // Stability Index
  stabilityScore: number | null;
  displayScore: number | null;
  statusBand: StatusBand | null;
  confidenceLevel: string | null;
  primaryConcern: string | null;
  scoreBreakdown: any | null;
}

export interface DailyRoundFull extends DailyRound {
  operator?: User;
  plant?: Plant;
  checklistEntries?: ChecklistEntry[];
  labEntries?: LabEntry[];
  observationEntries?: ObservationEntry[];
  suggestions?: Suggestion[];
  issues?: Issue[];
}

// --- API Response ---

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// --- Constants ---

export const DEFAULT_LAB_FIELDS = [
  { name: 'Influent Flow', unit: 'MGD', isRequired: true },
  { name: 'MLSS', unit: 'mg/L', isRequired: true },
  { name: 'DO', unit: 'mg/L', isRequired: true },
  { name: 'Temperature', unit: '°F', isRequired: true },
  { name: 'RAS Rate', unit: 'GPM', isRequired: true },
  { name: 'RAS Concentration', unit: 'mg/L', isRequired: true },
  { name: 'WAS Rate', unit: 'gal', isRequired: true },
  { name: 'Blanket Depth', unit: 'ft', isRequired: true },
  { name: 'pH', unit: 'SU', isRequired: false },
  { name: 'Ammonia', unit: 'mg/L', isRequired: false },
  { name: 'Settleability', unit: 'mL/L', isRequired: false },
  { name: 'WAS Concentration', unit: 'mg/L', isRequired: false },
] as const;

export const DEFAULT_SECTIONS = [
  'Arrival / Grounds',
  'Mechanical Equipment',
  'Process Observations',
  'Housekeeping',
] as const;

export const DEFAULT_OBSERVATION_TAGS = [
  { name: 'Foam increase', category: 'Process' },
  { name: 'Pin floc observed', category: 'Process' },
  { name: 'Cloudy effluent', category: 'Clarifier' },
  { name: 'Septic odor', category: 'Process' },
  { name: 'Dark sludge', category: 'Process' },
  { name: 'Poor visible settling', category: 'Clarifier' },
  { name: 'Unusual flow condition', category: 'Hydraulic' },
  { name: 'Equipment issue', category: 'Mechanical' },
  { name: 'Other concern', category: 'General' },
  { name: 'Solids carryover', category: 'Clarifier' },
  { name: 'Floating sludge', category: 'Clarifier' },
] as const;

export const CONDITION_LABELS: Record<Condition, string> = {
  GREEN: 'Stable',
  YELLOW: 'Slight Drift',
  ORANGE: 'Moderate Concern',
  RED: 'High Risk',
};

export const CONDITION_COLORS: Record<Condition, string> = {
  GREEN: '#22C55E',
  YELLOW: '#EAB308',
  ORANGE: '#F97316',
  RED: '#EF4444',
};

export const SEVERITY_LEVEL_LABELS: Record<number, string> = {
  1: 'Stable',
  2: 'Slight Drift',
  3: 'Moderate Concern',
  4: 'High Risk',
};

export const SEVERITY_LEVEL_COLORS: Record<number, string> = {
  1: '#22C55E',
  2: '#EAB308',
  3: '#F97316',
  4: '#EF4444',
};
