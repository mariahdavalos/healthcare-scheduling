import { useMemo, useState } from 'react';
import auditResultJson from './data/audit-result.json';
import { Banner } from './components/Banner';
import { DataNotes } from './components/DataNotes';
import { GapSection } from './components/GapSection';
import { ProviderCard } from './components/ProviderCard';
import { StatBar } from './components/StatBar';
import type { SeverityFilter } from './constants';
import { useReviewed } from './hooks/useReviewed';
import type { AuditResult, Finding, ProviderGroup } from './types';

const DATA = auditResultJson as AuditResult;

const SEVERITY_RANK: Record<Finding['severity'], number> = { HARD: 0, SOFT: 1, DATA_ISSUE: 2 };
const PRIORITY_RANK: Record<string, number> = { RED: 0, YELLOW: 1, GREEN: 2 };

function buildProviderGroups(findings: Finding[]): { unassigned: Finding[]; groups: ProviderGroup[] } {
  const groupsByProvider = new Map<string, ProviderGroup>();
  const unassigned: Finding[] = [];

  for (const finding of findings) {
    if (!finding.providerId) {
      unassigned.push(finding);
      continue;
    }
    let group = groupsByProvider.get(finding.providerId);
    if (!group) {
      group = { id: finding.providerId, name: finding.providerName, findings: [], hardCount: 0, softCount: 0 };
      groupsByProvider.set(finding.providerId, group);
    }
    group.findings.push(finding);
  }

  const groups = Array.from(groupsByProvider.values());
  for (const group of groups) {
    group.hardCount = group.findings.filter((finding) => finding.severity === 'HARD').length;
    group.softCount = group.findings.filter((finding) => finding.severity === 'SOFT').length;
    group.findings.sort((first, second) => {
      if (SEVERITY_RANK[first.severity] !== SEVERITY_RANK[second.severity]) {
        return SEVERITY_RANK[first.severity] - SEVERITY_RANK[second.severity];
      }
      const firstPriority = first.evidence.preferencePriority;
      const secondPriority = second.evidence.preferencePriority;
      if (firstPriority && secondPriority && firstPriority !== secondPriority) {
        return PRIORITY_RANK[firstPriority] - PRIORITY_RANK[secondPriority];
      }
      return 0;
    });
  }
  groups.sort((first, second) => (second.hardCount !== first.hardCount ? second.hardCount - first.hardCount : second.softCount - first.softCount));

  return { unassigned, groups };
}

export default function App() {
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const [search, setSearch] = useState('');

  const { unassigned, groups } = useMemo(() => buildProviderGroups(DATA.findings), []);
  const dataNoteFindings = useMemo(() => DATA.findings.filter((finding) => finding.severity === 'DATA_ISSUE'), []);
  const { reviewed, toggle } = useReviewed(`schedule-review:${DATA.meta.generatedAt}`);

  const searchTerm = search.trim().toLowerCase();

  const visibleUnassigned = useMemo(() => {
    if (searchTerm) return [];
    return unassigned.filter((finding) => filter === 'all' || finding.severity === filter);
  }, [unassigned, filter, searchTerm]);

  const visibleGroups = useMemo(() => {
    return groups
      .filter((group) => !searchTerm || (group.name ?? group.id ?? '').toLowerCase().includes(searchTerm))
      .map((group) => ({ ...group, findings: group.findings.filter((finding) => filter === 'all' || finding.severity === filter) }))
      .filter((group) => group.findings.length > 0);
  }, [groups, filter, searchTerm]);

  const nothingVisible = visibleUnassigned.length === 0 && visibleGroups.length === 0;

  return (
    <>
      <Banner data={DATA} />
      <StatBar
        total={DATA.findings.length}
        hard={DATA.summary.hardViolationCount}
        soft={DATA.summary.softFindingCount}
        data={DATA.summary.dataIssueCount}
        filter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={setSearch}
      />
      <div className="wrap">
        <GapSection findings={visibleUnassigned} />

        <p className="section-head">By provider</p>
        {visibleGroups.map((group) => (
          <ProviderCard key={group.id} group={group} reviewed={reviewed} onToggle={toggle} />
        ))}
        {nothingVisible && <div className="empty-state">Nothing matches this filter.</div>}

        <DataNotes findings={dataNoteFindings} />
      </div>
    </>
  );
}
