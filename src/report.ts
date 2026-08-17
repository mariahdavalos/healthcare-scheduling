import { AuditResult, Finding } from './types';

const RULE_NAMES: Record<string, string> = {
  H1: 'H1: Every shift covered by exactly one provider',
  H2: 'H2: Site credentialing',
  H3: 'H3: Night eligibility / PA restriction',
  H4: 'H4: No overlapping or same-day double-booking',
  H5: 'H5: Minimum 10 hours off between shifts',
  H6: 'H6: Max 3 consecutive night shifts',
  H7: 'H7: No shift during approved leave',
  H8: 'H8: Assigned load within target band',
  H9: 'H9: Minimum 12 shifts per period',
  S1: 'S1: Honor stated preferences',
  S2: 'S2: Equitable night-shift distribution',
  S3: 'S3: Avoid island nights / honor recovery days',
  S4: 'S4: Equitable weekend distribution',
  DATA: 'Source data quality',
};

function groupBy<Item, Key>(items: Item[], keyFn: (item: Item) => Key): Map<Key, Item[]> {
  const itemsByKey = new Map<Key, Item[]>();
  for (const item of items) {
    const key = keyFn(item);
    const itemsForKey = itemsByKey.get(key) ?? [];
    itemsForKey.push(item);
    itemsByKey.set(key, itemsForKey);
  }
  return itemsByKey;
}

export function renderHumanReport(result: AuditResult): string {
  const lines: string[] = [];
  const hardFindings = result.findings.filter((finding) => finding.severity === 'HARD');
  const softFindings = result.findings.filter((finding) => finding.severity === 'SOFT');
  const dataIssues = result.findings.filter((finding) => finding.severity === 'DATA_ISSUE');

  lines.push(`# Schedule Audit: ${result.meta.schedulingPeriod}`);
  lines.push('');
  lines.push(
    result.publishable
      ? '**Status: No hard-rule violations found.** Review the notes before publishing.'
      : `**Status: NOT PUBLISHABLE. ${hardFindings.length} violation${hardFindings.length === 1 ? '' : 's'} must be fixed.**`
  );
  lines.push('');
  lines.push(
    `${result.meta.providerCount} providers · ${result.meta.siteCount} sites · ${result.meta.shiftCount} shifts · ${result.meta.totalHours}h scheduled · ${result.summary.providersAffected} provider(s) touched by at least one finding.`
  );
  lines.push('');

  lines.push(`## Hard-rule violations: must fix before publishing (${hardFindings.length})`);
  lines.push('');
  if (hardFindings.length === 0) {
    lines.push('None. Every hard rule (H1–H9) is satisfied.');
  } else {
    const findingsByRule = groupBy(hardFindings, (finding) => finding.rule);
    for (const rule of Object.keys(RULE_NAMES).filter((ruleCode) => findingsByRule.has(ruleCode))) {
      const findingsForRule = findingsByRule.get(rule)!;
      lines.push(`### ${RULE_NAMES[rule]} (${findingsForRule.length})`);
      for (const finding of findingsForRule) {
        lines.push(`- **${finding.summary}**`);
        lines.push(`  - ${finding.detail}`);
        lines.push(`  - Action: ${finding.suggestedAction}`);
      }
      lines.push('');
    }
  }

  lines.push(`## Soft-goal issues: should fix, in priority order (${softFindings.length})`);
  lines.push('');
  if (softFindings.length === 0) {
    lines.push('None.');
  } else {
    const findingsByRule = groupBy(softFindings, (finding) => finding.rule);
    for (const rule of ['S1', 'S2', 'S3', 'S4']) {
      const findingsForRule = findingsByRule.get(rule);
      if (!findingsForRule || findingsForRule.length === 0) continue;
      lines.push(`### ${RULE_NAMES[rule]} (${findingsForRule.length})`);
      for (const finding of findingsForRule) {
        const priority = (finding.evidence.preferencePriority as string | undefined) ?? null;
        const tag = priority ? `[${priority}] ` : '';
        lines.push(`- ${tag}${finding.summary}`);
        lines.push(`  - Action: ${finding.suggestedAction}`);
      }
      lines.push('');
    }
  }

  lines.push(`## Data quality notes: can't be fully verified (${dataIssues.length})`);
  lines.push('');
  if (dataIssues.length === 0) {
    lines.push('None.');
  } else {
    for (const finding of dataIssues) {
      lines.push(`- ${finding.summary}`);
      lines.push(`  - ${finding.detail}`);
    }
  }
  lines.push('');

  lines.push('## Totals by rule');
  lines.push('');
  lines.push('| Rule | Count |');
  lines.push('| --- | --- |');
  for (const [rule, count] of Object.entries(result.summary.byRule).sort()) {
    lines.push(`| ${RULE_NAMES[rule] ?? rule} | ${count} |`);
  }
  lines.push('');

  return lines.join('\n');
}
