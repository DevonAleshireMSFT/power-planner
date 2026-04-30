import type { Plan } from '../../types';
import type { ViewMode } from '../../types';

interface HeaderProps {
  plan: Plan | undefined;
  viewMode: ViewMode;
  onViewChange: (v: ViewMode) => void;
}

export function Header({ plan, viewMode, onViewChange }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header-left">
        <span className="app-header-logo" aria-hidden="true">📋</span>
        <span className="app-header-plan-name">{plan?.pplanner_name ?? 'Power Planner'}</span>
      </div>
      <nav className="app-header-views" aria-label="View switcher">
        <button
          className={`view-btn${viewMode === 'board' ? ' active' : ''}`}
          onClick={() => onViewChange('board')}
          aria-pressed={viewMode === 'board'}
        >
          Board
        </button>
        <button
          className={`view-btn${viewMode === 'list' ? ' active' : ''}`}
          onClick={() => onViewChange('list')}
          aria-pressed={viewMode === 'list'}
        >
          List
        </button>
      </nav>
    </header>
  );
}
