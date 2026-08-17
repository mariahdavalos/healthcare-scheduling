import { IngestWarning } from '../ingest';
import { Finding } from '../types';

let counter = 0;
function nextId(): string {
  counter += 1;
  return `DATA-${String(counter).padStart(3, '0')}`;
}

/**
 * Problems with the source files themselves, not the schedule they describe.
 * These aren't rule violations — they're reasons a rule check couldn't run,
 * or reasons to double-check a join. Reported separately so they never get
 * confused with an actual scheduling error.
 */
export function checkDataQuality(warnings: IngestWarning[]): Finding[] {
  return warnings.map((warning) => ({
    id: nextId(),
    severity: 'DATA_ISSUE',
    rule: 'DATA',
    ruleName: 'Source data quality',
    providerId: null,
    providerName: null,
    siteCode: null,
    shiftDate: null,
    shiftCode: null,
    summary: warning.message,
    detail: `Source: ${warning.file}`,
    evidence: { file: warning.file },
    suggestedAction: 'Fix at the source file and re-run the audit.',
  }));
}
