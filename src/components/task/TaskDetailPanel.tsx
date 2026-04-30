import type { Task, Bucket } from '../../types';
import { TASK_STATUS, TASK_PRIORITY } from '../../types';
import type { DataClient } from '../../api/dataverse';
import { ChecklistSection } from './ChecklistSection';
import { CommentSection } from './CommentSection';
import type { CreateTaskInput } from '../../api/tasks';

interface TaskDetailPanelProps {
  task: Task;
  buckets: Bucket[];
  client: DataClient;
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
  onUpdate: (taskId: string, changes: Partial<Omit<CreateTaskInput, 'pplanner_planid@odata.bind'>>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export function TaskDetailPanel({
  task,
  buckets,
  client,
  currentUserId,
  currentUserName,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailPanelProps) {
  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await onUpdate(task.pplanner_taskid, { pplanner_status: Number(e.target.value) }).catch(() => {});
  }

  async function handlePriorityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await onUpdate(task.pplanner_taskid, { pplanner_priority: Number(e.target.value) }).catch(() => {});
  }

  async function handleBucketChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    await onUpdate(task.pplanner_taskid, {
      'pplanner_bucketid@odata.bind': val ? `/pplanner_buckets(${val})` : undefined,
    }).catch(() => {});
  }

  async function handleDelete() {
    if (window.confirm(`Delete task "${task.pplanner_title}"? This cannot be undone.`)) {
      await onDelete(task.pplanner_taskid);
      onClose();
    }
  }

  return (
    <div className="task-detail-overlay" role="dialog" aria-modal="true" aria-label="Task details">
      <div className="task-detail-panel">
        {/* Header */}
        <div className="task-detail-header">
          <h2 className="task-detail-title">{task.pplanner_title}</h2>
          <div className="task-detail-header-actions">
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
              aria-label="Delete task"
            >
              Delete
            </button>
            <button className="modal-close" onClick={onClose} aria-label="Close panel">✕</button>
          </div>
        </div>

        <div className="task-detail-body">
          {/* Quick-edit row */}
          <div className="task-detail-meta-row">
            <div className="form-group">
              <label className="form-label" htmlFor="td-status">Status</label>
              <select
                id="td-status"
                className="form-input"
                value={task.pplanner_status}
                onChange={handleStatusChange}
              >
                {Object.entries(TASK_STATUS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="td-priority">Priority</label>
              <select
                id="td-priority"
                className="form-input"
                value={task.pplanner_priority}
                onChange={handlePriorityChange}
              >
                {Object.entries(TASK_PRIORITY).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="td-bucket">Bucket</label>
              <select
                id="td-bucket"
                className="form-input"
                value={task._pplanner_bucketid_value ?? ''}
                onChange={handleBucketChange}
              >
                <option value="">— None —</option>
                {buckets.map((b) => (
                  <option key={b.pplanner_bucketid} value={b.pplanner_bucketid}>{b.pplanner_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          {(task.pplanner_startdate || task.pplanner_duedate) && (
            <div className="task-detail-dates">
              {task.pplanner_startdate && (
                <span>Start: {new Date(task.pplanner_startdate).toLocaleDateString()}</span>
              )}
              {task.pplanner_duedate && (
                <span>Due: {new Date(task.pplanner_duedate).toLocaleDateString()}</span>
              )}
            </div>
          )}

          {/* Description */}
          {task.pplanner_description && (
            <div className="task-detail-description">
              <h4 className="section-title">Description</h4>
              <p>{task.pplanner_description}</p>
            </div>
          )}

          {/* Checklist */}
          <ChecklistSection taskId={task.pplanner_taskid} client={client} />

          {/* Comments */}
          <CommentSection
            taskId={task.pplanner_taskid}
            client={client}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </div>
      </div>
    </div>
  );
}
