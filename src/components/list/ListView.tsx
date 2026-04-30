import type { Task, Bucket } from '../../types';
import { TASK_STATUS, TASK_PRIORITY, TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '../../types';
import { Badge } from '../shared/Badge';

interface ListViewProps {
  tasks: Task[];
  buckets: Bucket[];
  onTaskClick: (taskId: string) => void;
  onAddTask: () => void;
  loading: boolean;
}

export function ListView({ tasks, buckets, onTaskClick, onAddTask, loading }: ListViewProps) {
  const bucketMap = Object.fromEntries(buckets.map((b) => [b.pplanner_bucketid, b.pplanner_name]));

  if (loading) return <div className="list-loading">Loading tasks…</div>;

  return (
    <div className="list-view" role="region" aria-label="List view">
      <div className="list-toolbar">
        <button className="btn btn-primary" onClick={onAddTask}>
          + New task
        </button>
      </div>

      <table className="task-table" aria-label="Tasks">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Bucket</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && (
            <tr>
              <td colSpan={5} className="list-empty">No tasks found. Create one to get started.</td>
            </tr>
          )}
          {tasks.map((task) => {
            const isOverdue =
              task.pplanner_duedate &&
              task.pplanner_status !== 2 &&
              new Date(task.pplanner_duedate) < new Date();

            return (
              <tr
                key={task.pplanner_taskid}
                className="task-row"
                onClick={() => onTaskClick(task.pplanner_taskid)}
                onKeyDown={(e) => e.key === 'Enter' && onTaskClick(task.pplanner_taskid)}
                tabIndex={0}
                role="button"
                aria-label={`Open task: ${task.pplanner_title}`}
              >
                <td className="task-row-title">{task.pplanner_title}</td>
                <td>
                  <Badge
                    label={TASK_STATUS[task.pplanner_status]}
                    backgroundColor={TASK_STATUS_COLORS[task.pplanner_status]}
                  />
                </td>
                <td>
                  <Badge
                    label={TASK_PRIORITY[task.pplanner_priority]}
                    backgroundColor={TASK_PRIORITY_COLORS[task.pplanner_priority]}
                  />
                </td>
                <td>{task._pplanner_bucketid_value ? bucketMap[task._pplanner_bucketid_value] ?? '—' : '—'}</td>
                <td className={isOverdue ? 'overdue' : ''}>
                  {task.pplanner_duedate ? new Date(task.pplanner_duedate).toLocaleDateString() : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
