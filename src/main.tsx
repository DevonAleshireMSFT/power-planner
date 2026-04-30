import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ---------------------------------------------------------------------------
// Local development mock — bypasses the Power Apps runtime and power.config.json.
// Remove (or guard with import.meta.env.DEV) before deploying to Power Apps.
// ---------------------------------------------------------------------------
if (import.meta.env.DEV) {
  const { createMockDataExecutor } = await import('@microsoft/power-apps/data/executors');
  const { setDataOperationExecutor } = await import('@microsoft/power-apps/internal/data');
  setDataOperationExecutor(
    createMockDataExecutor({
      pplanner_plans: {
        'plan-1': {
          pplanner_planid: 'plan-1',
          pplanner_name: 'Demo Plan',
          pplanner_description: 'A sample plan for local development',
          statecode: 0,
          statuscode: 1,
        },
      },
      pplanner_buckets: {
        'bucket-1': { pplanner_bucketid: 'bucket-1', pplanner_name: 'To Do',       pplanner_order: 0, _pplanner_planid_value: 'plan-1' },
        'bucket-2': { pplanner_bucketid: 'bucket-2', pplanner_name: 'In Progress', pplanner_order: 1, _pplanner_planid_value: 'plan-1' },
        'bucket-3': { pplanner_bucketid: 'bucket-3', pplanner_name: 'Done',        pplanner_order: 2, _pplanner_planid_value: 'plan-1' },
      },
      pplanner_tasks: {
        'task-1': {
          pplanner_taskid: 'task-1',
          pplanner_title: 'Set up Dataverse tables',
          pplanner_status: 2,
          pplanner_priority: 2,
          _pplanner_planid_value: 'plan-1',
          _pplanner_bucketid_value: 'bucket-3',
          statecode: 0,
          statuscode: 1,
        },
        'task-2': {
          pplanner_taskid: 'task-2',
          pplanner_title: 'Build board view',
          pplanner_status: 1,
          pplanner_priority: 1,
          _pplanner_planid_value: 'plan-1',
          _pplanner_bucketid_value: 'bucket-2',
          statecode: 0,
          statuscode: 1,
        },
        'task-3': {
          pplanner_taskid: 'task-3',
          pplanner_title: 'Deploy to GCCH',
          pplanner_status: 0,
          pplanner_priority: 3,
          pplanner_duedate: '2026-05-15',
          _pplanner_planid_value: 'plan-1',
          _pplanner_bucketid_value: 'bucket-1',
          statecode: 0,
          statuscode: 1,
        },
      },
      pplanner_taskassignments: {},
      pplanner_comments: {},
      pplanner_checklistitems: {},
    }),
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
