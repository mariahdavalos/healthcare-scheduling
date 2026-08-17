import { ingest } from './ingest';
import { checkDataQuality } from './rules/dataQuality';
import { checkHardRules } from './rules/hardRules';
import { checkSoftGoals } from './rules/softGoals';
import { AuditResult, Finding } from './types';

export function runAudit(dataDir: string): AuditResult {
  const { data, warnings } = ingest(dataDir);

  const hardFindings = checkHardRules(data);
  const softFindings = checkSoftGoals(data);
  const dataFindings = checkDataQuality(warnings);

  const allFindings: Finding[] = [
    ...hardFindings.filter((finding) => finding.severity === 'HARD'),
    ...softFindings.filter((finding) => finding.severity === 'SOFT'),
    ...hardFindings.filter((finding) => finding.severity === 'DATA_ISSUE'),
    ...softFindings.filter((finding) => finding.severity === 'DATA_ISSUE'),
    ...dataFindings,
  ];

  const hardCount = allFindings.filter((finding) => finding.severity === 'HARD').length;
  const softCount = allFindings.filter((finding) => finding.severity === 'SOFT').length;
  const dataIssueCount = allFindings.filter((finding) => finding.severity === 'DATA_ISSUE').length;

  const countByRule: Record<string, number> = {};
  for (const finding of allFindings) countByRule[finding.rule] = (countByRule[finding.rule] ?? 0) + 1;

  const providersAffected = new Set(allFindings.map((finding) => finding.providerId).filter(Boolean)).size;

  const shiftDates = data.coverage.map((requirement) => requirement.shiftDate).sort();

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      schedulingPeriod: shiftDates.length > 0 ? `${shiftDates[0]} to ${shiftDates[shiftDates.length - 1]}` : 'unknown',
      sourceFiles: [
        'providers.xlsx',
        'coverage_requirements.xlsx',
        'approved_leave.xlsx',
        'preferences.xlsx',
        'draft_schedule.xlsx',
      ],
      providerCount: data.providers.length,
      siteCount: new Set(data.coverage.map((requirement) => requirement.siteCode)).size,
      shiftCount: data.coverage.length,
      totalHours: data.schedule.reduce((sum, entry) => sum + entry.durationHours, 0),
    },
    publishable: hardCount === 0,
    summary: {
      hardViolationCount: hardCount,
      softFindingCount: softCount,
      dataIssueCount,
      providersAffected,
      byRule: countByRule,
    },
    findings: allFindings,
  };
}
