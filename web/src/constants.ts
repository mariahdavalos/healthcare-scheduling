import type { PreferencePriority, Severity } from './types';

export const RULE_LABELS: Record<string, string> = {
  H1: 'Coverage',
  H2: 'Site credentialing',
  H3: 'Night eligibility',
  H4: 'Double-booking',
  H5: 'Rest period',
  H6: 'Consecutive nights',
  H7: 'Approved leave',
  H8: 'Load target',
  H9: 'Minimum shifts',
  S1: 'Preference',
  S2: 'Night equity',
  S3: 'Night pattern',
  S4: 'Weekend equity',
  DATA: 'Data quality',
};

export const PREF_LABELS: Record<PreferencePriority, string> = {
  RED: 'Hardship request',
  YELLOW: 'Stated preference',
  GREEN: 'Nice-to-have',
};

export const SEVERITY_ICON: Record<Severity, string> = {
  HARD: '❗',
  SOFT: '⚠️',
  DATA_ISSUE: '📝',
};

export type SeverityFilter = 'all' | Severity;
