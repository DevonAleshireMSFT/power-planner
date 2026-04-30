import type { Plan } from '../../types';

interface SidebarProps {
  plans: Plan[];
  selectedPlanId: string | null;
  onSelectPlan: (id: string) => void;
  onCreatePlan: () => void;
  loading: boolean;
}

export function Sidebar({ plans, selectedPlanId, onSelectPlan, onCreatePlan, loading }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Plans navigation">
      <div className="sidebar-header">
        <span className="sidebar-title">Plans</span>
        <button
          className="sidebar-add-btn"
          onClick={onCreatePlan}
          title="Create new plan"
          aria-label="Create new plan"
        >
          +
        </button>
      </div>

      {loading && <p className="sidebar-loading">Loading…</p>}

      <ul className="sidebar-plan-list" role="listbox" aria-label="Plan list">
        {plans.map((plan) => (
          <li
            key={plan.pplanner_planid}
            role="option"
            aria-selected={plan.pplanner_planid === selectedPlanId}
            className={`sidebar-plan-item${plan.pplanner_planid === selectedPlanId ? ' selected' : ''}`}
            onClick={() => onSelectPlan(plan.pplanner_planid)}
            onKeyDown={(e) => e.key === 'Enter' && onSelectPlan(plan.pplanner_planid)}
            tabIndex={0}
          >
            <span className="sidebar-plan-icon" aria-hidden="true">📁</span>
            <span className="sidebar-plan-name">{plan.pplanner_name}</span>
          </li>
        ))}

        {!loading && plans.length === 0 && (
          <li className="sidebar-empty">No plans yet</li>
        )}
      </ul>
    </aside>
  );
}
