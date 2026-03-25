// ============================================================
// OSCAR MVP — Shared Types & Constants
// ============================================================

// --- Enums ---

export type Role = 'OPERATOR' | 'SUPERVISOR' | 'ADMIN';
export type ChecklistStatus = 'OK' | 'ATTENTION' | 'NA';
export type RoundStatus = 'IN_PROGRESS' | 'COMPLETED';
export type Condition = 'GREEN' | 'YELLOW' | 'RED';
export type Severity = 'GREEN' | 'CAUTION' | 'CRITICAL';

// --- User ---

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
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
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  sectionId: string;
  name: string;
  description: string | null;
  displayOrder: number;
  requiresNoteOnAttention: boolean;
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
  items: (ChecklistItem & { entry?: ChecklistEntry })[];
}

// --- Lab ---

export interface LabField {
  id: string;
  name: string;
  unit: string;
  displayOrder: number;
}

export interface LabEntry {
  id: string;
  roundId: string;
  labFieldId: string;
  value: number;
  timestamp: string;
}

export interface LabFieldWithEntry extends LabField {
  entry?: LabEntry;
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
  { name: 'Flow', unit: 'MGD' },
  { name: 'DO', unit: 'mg/L' },
  { name: 'pH', unit: 'SU' },
  { name: 'Temperature', unit: '°F' },
  { name: 'MLSS', unit: 'mg/L' },
  { name: 'RAS', unit: 'mg/L' },
  { name: 'WAS', unit: 'gal' },
  { name: 'Ammonia', unit: 'mg/L' },
  { name: 'Settlometer', unit: 'mL/L' },
] as const;

export const DEFAULT_SECTIONS = [
  'Arrival / Grounds',
  'Mechanical Equipment',
  'Process Observations',
  'Housekeeping',
  'Labs & Operating Data',
] as const;

export const DEFAULT_OBSERVATION_TAGS = [
  { name: 'Cloudy clarifier', category: 'Clarifier' },
  { name: 'Solids carryover', category: 'Clarifier' },
  { name: 'Excess foam', category: 'Aeration' },
  { name: 'Septic odor', category: 'General' },
  { name: 'Light basin', category: 'Aeration' },
  { name: 'Dark basin', category: 'Aeration' },
  { name: 'Floating sludge', category: 'Clarifier' },
  { name: 'Grease buildup', category: 'General' },
  { name: 'Unusual color', category: 'General' },
  { name: 'Equipment noise', category: 'Mechanical' },
] as const;

export const CONDITION_LABELS: Record<Condition, string> = {
  GREEN: 'All Good',
  YELLOW: 'Caution',
  RED: 'Critical',
};

export const CONDITION_COLORS: Record<Condition, string> = {
  GREEN: '#22C55E',
  YELLOW: '#EAB308',
  RED: '#EF4444',
};
