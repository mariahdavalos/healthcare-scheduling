export type TargetType = 'SHIFTS' | 'HOURS';
export type Role = 'Physician' | 'PA';
export type PreferencePriority = 'RED' | 'YELLOW' | 'GREEN';
export type Severity = 'HARD' | 'SOFT' | 'DATA_ISSUE';

export interface Provider {
  providerId: string;
  name: string;
  role: Role;
  targetType: TargetType | null;
  targetValue: number | null;
  credentialedSites: string[];
  nightEligible: boolean;
}

export interface CoverageRequirement {
  key: string;
  shiftDate: string;
  siteCode: string;
  shiftCode: string;
  startTime: string;
  endTime: string;
  providersRequired: number;
}

export interface ApprovedLeave {
  providerId: string;
  leaveStart: string;
  leaveEnd: string;
  leaveType: string;
}

export interface Preference {
  providerId: string;
  providerNameRaw: string;
  appliesToRaw: string;
  priority: PreferencePriority;
  note: string;
}

export interface ScheduleEntry {
  key: string;
  shiftDate: string;
  siteCode: string;
  shiftCode: string;
  startTime: string;
  endTime: string;
  providerId: string | null;
  providerNameRaw: string | null;
  startDateTime: Date;
  endDateTime: Date;
  isNight: boolean;
  durationHours: number;
}

export interface RawData {
  providers: Provider[];
  coverage: CoverageRequirement[];
  leave: ApprovedLeave[];
  preferences: Preference[];
  schedule: ScheduleEntry[];
}

export interface Finding {
  id: string;
  severity: Severity;
  rule: string;
  ruleName: string;
  providerId: string | null;
  providerName: string | null;
  siteCode: string | null;
  shiftDate: string | null;
  shiftCode: string | null;
  summary: string;
  detail: string;
  evidence: Record<string, unknown>;
  suggestedAction: string;
}

export interface AuditResult {
  meta: {
    generatedAt: string;
    schedulingPeriod: string;
    sourceFiles: string[];
    providerCount: number;
    siteCount: number;
    shiftCount: number;
    totalHours: number;
  };
  publishable: boolean;
  summary: {
    hardViolationCount: number;
    softFindingCount: number;
    dataIssueCount: number;
    providersAffected: number;
    byRule: Record<string, number>;
  };
  findings: Finding[];
}
