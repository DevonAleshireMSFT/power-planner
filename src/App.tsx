/**
 * App.tsx — Power Planner root component
 *
 * Architecture:
 *   App
 *   └── AppShell (header + sidebar)
 *       └── BoardView | ListView
 *           └── TaskDetailPanel (slide-over)
 *
 * Data flow:
 *   getClient(dataSourcesInfo) → DataClient
 *   usePlans / useTasks / useBuckets → local state
 *
 * GCCH note: `getContext()` resolves user identity from Entra ID.
 * No external services are called — all data stays within the
 * Dataverse environment.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getClient as paGetClient } from '@microsoft/power-apps/data';
import { getContext as paGetContext } from '@microsoft/power-apps/app';
import type { DataClient } from './api/dataverse';
import type { ViewMode } from './types';
import { AppShell } from './components/layout/AppShell';
import { BoardView } from './components/board/BoardView';
import { ListView } from './components/list/ListView';
import { CreatePlanModal } from './components/plans/CreatePlanModal';
import { TaskDetailPanel } from './components/task/TaskDetailPanel';
import { TaskForm } from './components/task/TaskForm';
import { Modal } from './components/shared/Modal';
import { usePlans } from './hooks/usePlans';
import { useTasks } from './hooks/useTasks';
import { useBuckets } from './hooks/useBuckets';
import './App.css';

// ---------------------------------------------------------------------------
// DataSourcesInfo — supplied by the Power Apps runtime in production.
// For local dev, call setDataOperationExecutor(createMockDataExecutor({...}))
// in main.tsx before ReactDOM renders. See docs/dataverse-setup.md.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Root App
// ---------------------------------------------------------------------------
export default function App() {
  const [client, setClient] = useState<DataClient | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createTaskBucketId, setCreateTaskBucketId] = useState<string | undefined>();
  const [initError, setInitError] = useState<string | null>(null);

  // ------------------------------------------------------------------
  // Initialise: resolve user context and build DataClient
  // ------------------------------------------------------------------
  useEffect(() => {
    async function init() {
      try {
        if (import.meta.env.DEV) {
          // Local dev: getContext() never resolves outside the Power Apps runtime.
          // Use stub identity; the mock executor (main.tsx) handles data.
          setCurrentUserId('dev-user-1');
          setCurrentUserName('Dev User');
          setClient(paGetClient({} as Parameters<typeof paGetClient>[0]));
          return;
        }

        const ctx = await paGetContext();
        setCurrentUserId(ctx.user.objectId ?? '');
        setCurrentUserName(ctx.user.fullName ?? ctx.user.userPrincipalName ?? 'Me');

        // TODO: Replace the empty object {} with the DataSourcesInfo injected
        // by your Power Apps Code App environment configuration.
        // See: docs/dataverse-setup.md
        setClient(paGetClient({} as Parameters<typeof paGetClient>[0]));
      } catch (e) {
        setInitError('Failed to initialise app context. Ensure the app is running inside Power Apps.');
        console.error(e);
      }
    }
    void init();
  }, []);

  // ------------------------------------------------------------------
  // Data hooks (null-safe — hooks guard internally when client is null)
  // ------------------------------------------------------------------
  const { plans, loading: plansLoading, addPlan } = usePlans(client);
  const { tasks, loading: tasksLoading, addTask, editTask, removeTask, moveToBucket } =
    useTasks(client, selectedPlanId);
  const { buckets, loading: bucketsLoading, addBucket } =
    useBuckets(client, selectedPlanId);

  // Auto-select first plan on load
  useEffect(() => {
    if (!selectedPlanId && plans.length > 0) {
      setSelectedPlanId(plans[0].pplanner_planid);
    }
  }, [plans, selectedPlanId]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.pplanner_taskid === selectedTaskId),
    [tasks, selectedTaskId],
  );

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------
  const handleTaskDrop = useCallback(
    async (taskId: string, bucketId: string) => {
      if (client) await moveToBucket(taskId, bucketId);
    },
    [client, moveToBucket],
  );

  const handleAddTaskInBucket = useCallback((bucketId: string) => {
    setCreateTaskBucketId(bucketId);
    setShowCreateTask(true);
  }, []);

  const handleAddBucket = useCallback(async () => {
    if (!client || !selectedPlanId) return;
    const name = window.prompt('Bucket name:');
    if (name?.trim()) await addBucket(name.trim(), selectedPlanId);
  }, [client, selectedPlanId, addBucket]);

  // ------------------------------------------------------------------
  // Render guards
  // ------------------------------------------------------------------
  if (initError) {
    return (
      <div style={{ padding: 32, fontFamily: 'Segoe UI, sans-serif', color: '#a4262c' }}>
        <h2>Initialisation Error</h2>
        <p>{initError}</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="app-loading" role="status" aria-live="polite">
        <div className="app-loading-spinner" aria-hidden="true" />
        <p>Loading Power Planner…</p>
      </div>
    );
  }

  return (
    <>
      <AppShell
        plans={plans}
        selectedPlanId={selectedPlanId}
        viewMode={viewMode}
        loading={plansLoading}
        onSelectPlan={setSelectedPlanId}
        onCreatePlan={() => setShowCreatePlan(true)}
        onViewChange={setViewMode}
      >
        {!selectedPlanId ? (
          <div className="app-empty">
            <p>Select a plan from the sidebar, or create a new one.</p>
            <button className="btn btn-primary" onClick={() => setShowCreatePlan(true)}>
              Create Plan
            </button>
          </div>
        ) : viewMode === 'board' ? (
          <BoardView
            buckets={buckets}
            tasks={tasks}
            loading={bucketsLoading || tasksLoading}
            onTaskClick={setSelectedTaskId}
            onTaskDrop={handleTaskDrop}
            onAddTask={handleAddTaskInBucket}
            onAddBucket={handleAddBucket}
          />
        ) : (
          <ListView
            tasks={tasks}
            buckets={buckets}
            loading={tasksLoading}
            onTaskClick={setSelectedTaskId}
            onAddTask={() => setShowCreateTask(true)}
          />
        )}
      </AppShell>

      {/* ── Create Plan Modal ─────────────────────────────────────── */}
      {showCreatePlan && (
        <CreatePlanModal
          onClose={() => setShowCreatePlan(false)}
          onSubmit={async (input) => {
            const created = await addPlan(input);
            setSelectedPlanId(created.pplanner_planid);
          }}
        />
      )}

      {/* ── Create Task Modal ─────────────────────────────────────── */}
      {showCreateTask && selectedPlanId && (
        <Modal title="New Task" onClose={() => setShowCreateTask(false)}>
          <TaskForm
            planId={selectedPlanId}
            buckets={buckets}
            defaultBucketId={createTaskBucketId}
            onCancel={() => setShowCreateTask(false)}
            onSubmit={async (input) => {
              await addTask(input);
              setShowCreateTask(false);
            }}
          />
        </Modal>
      )}

      {/* ── Task Detail Panel ─────────────────────────────────────── */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          buckets={buckets}
          client={client}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={async (taskId, changes) => {
            await editTask(taskId, changes);
          }}
          onDelete={async (taskId) => {
            await removeTask(taskId);
            setSelectedTaskId(null);
          }}
        />
      )}
    </>
  );
}
