import type { SeverityFilter } from '../constants';

interface Props {
  total: number;
  hard: number;
  soft: number;
  data: number;
  filter: SeverityFilter;
  onFilterChange: (filter: SeverityFilter) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export function StatBar({ total, hard, soft, data, filter, onFilterChange, search, onSearchChange }: Props) {
  const buttons: { key: SeverityFilter; class: string; count: number; label: string }[] = [
    { key: 'all', class: 'all', count: total, label: 'All' },
    { key: 'HARD', class: 'hard', count: hard, label: 'Fix' },
    { key: 'SOFT', class: 'soft', count: soft, label: 'Review' },
    { key: 'DATA_ISSUE', class: 'data', count: data, label: 'Notes' },
  ];

  return (
    <div className="statbar">
      <div className="statbar-inner">
        <div className="stat-scroll">
          {buttons.map((button) => (
            <button
              key={button.key}
              type="button"
              className={`stat-btn ${button.class}`}
              aria-pressed={filter === button.key}
              onClick={() => onFilterChange(button.key)}
            >
              <strong>{button.count}</strong>
              <span>{button.label}</span>
            </button>
          ))}
        </div>
        <div className="search">
          <input
            type="search"
            aria-label="Filter by provider name"
            placeholder="🔎 Find a provider…"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
