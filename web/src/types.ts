export type Severity = 'HARD' | 'SOFT' | 'DATA_ISSUE';
export type PreferencePriority = 'RED' | 'YELLOW' | 'GREEN';

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
  evidence: Record<string, unknown> & { preferencePriority?: PreferencePriority };
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

export interface ProviderGroup {
  id: string | null;
  name: string | null;
  findings: Finding[];
  hardCount: number;
  softCount: number;
}
