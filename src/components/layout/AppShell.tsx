import type { ReactNode } from 'react';
import type { Plan } from '../../types';
import type { ViewMode } from '../../types';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  plans: Plan[];
  selectedPlanId: string | null;
  viewMode: ViewMode;
  loading: boolean;
  onSelectPlan: (id: string) => void;
  onCreatePlan: () => void;
  onViewChange: (v: ViewMode) => void;
  children: ReactNode;
}

export function AppShell({
  plans,
  selectedPlanId,
  viewMode,
  loading,
  onSelectPlan,
  onCreatePlan,
  onViewChange,
  children,
}: AppShellProps) {
  const selectedPlan = plans.find((p) => p.pplanner_planid === selectedPlanId);

  return (
    <div className="app-shell">
      <Header plan={selectedPlan} viewMode={viewMode} onViewChange={onViewChange} />
      <div className="app-body">
        <Sidebar
          plans={plans}
          selectedPlanId={selectedPlanId}
          onSelectPlan={onSelectPlan}
          onCreatePlan={onCreatePlan}
          loading={loading}
        />
        <main className="app-main" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
