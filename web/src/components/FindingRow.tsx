import { PREF_LABELS, RULE_LABELS, SEVERITY_ICON } from '../constants';
import type { Finding } from '../types';

interface Props {
  finding: Finding;
  reviewed: boolean;
  onToggle: (id: string, checked: boolean) => void;
}

const STRIPE_CLASS: Record<Finding['severity'], string> = {
  HARD: 'hard',
  SOFT: 'soft',
  DATA_ISSUE: 'data',
};

export function FindingRow({ finding, reviewed, onToggle }: Props) {
  const priority = finding.evidence.preferencePriority;
  const stripe = STRIPE_CLASS[finding.severity];
  const inputId = `-${finding.id}`;

  return (
    <div className={`finding-row${reviewed ? ' reviewed' : ''}`}>
      <div className={`severity-icon ${stripe}`} aria-hidden="true">
        {SEVERITY_ICON[finding.severity]}
      </div>
      <div className="finding-body">
        <div className="finding-top">
          <span className="finding-summary">{finding.summary}</span>
          <span className="rule-chip" title={finding.ruleName}>
            {RULE_LABELS[finding.rule] ?? finding.rule}
          </span>
          {priority && <span className={`pref-chip ${priority.toLowerCase()}`}>{PREF_LABELS[priority]}</span>}
        </div>
        <p className="finding-detail">{finding.detail}</p>
        <p className="finding-action">
          <b>Do:</b> {finding.suggestedAction}
        </p>
        <div className="finding-footer">
          <label className="reviewed-toggle" htmlFor={inputId}>
            <input
              id={inputId}
              type="checkbox"
              checked={reviewed}
              onChange={(event) => onToggle(finding.id, event.target.checked)}
            />
            Reviewed
          </label>
        </div>
      </div>
    </div>
  );
}
