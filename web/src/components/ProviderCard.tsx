import { FindingRow } from './FindingRow';
import type { ProviderGroup } from '../types';

interface Props {
  group: ProviderGroup;
  reviewed: Record<string, boolean>;
  onToggle: (id: string, checked: boolean) => void;
}

export function ProviderCard({ group, reviewed, onToggle }: Props) {
  return (
    <div className="provider-card">
      <div className="provider-head">
        <span className="provider-name">{group.name ?? group.id}</span>
        <span className="provider-id">{group.id}</span>
        <div className="provider-counts">
          {group.hardCount > 0 && <span className="count-chip hard">{group.hardCount} Fix</span>}
          {group.softCount > 0 && <span className="count-chip soft">{group.softCount} Review</span>}
        </div>
      </div>
      <div className="finding-list">
        {group.findings.map((finding) => (
          <FindingRow key={finding.id} finding={finding} reviewed={!!reviewed[finding.id]} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}
