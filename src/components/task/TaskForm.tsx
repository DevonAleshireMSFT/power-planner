import { useState } from 'react';
import type { Bucket } from '../../types';
import { TASK_STATUS, TASK_PRIORITY } from '../../types';
import type { CreateTaskInput } from '../../api/tasks';

interface TaskFormProps {
  planId: string;
  buckets: Bucket[];
  defaultBucketId?: string;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  onCancel: () => void;
}

export function TaskForm({ planId, buckets, defaultBucketId, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(0);
  const [priority, setPriority] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [bucketId, setBucketId] = useState(defaultBucketId ?? buckets[0]?.pplanner_bucketid ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const input: CreateTaskInput = {
        pplanner_title: title.trim(),
        pplanner_description: description.trim() || undefined,
        pplanner_status: status,
        pplanner_priority: priority,
        pplanner_startdate: startDate || undefined,
        pplanner_duedate: dueDate || undefined,
        'pplanner_planid@odata.bind': `/pplanner_plans(${planId})`,
      };
      if (bucketId) {
        input['pplanner_bucketid@odata.bind'] = `/pplanner_buckets(${bucketId})`;
      }
      await onSubmit(input);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-group">
        <label className="form-label" htmlFor="task-title">Title *</label>
        <input
          id="task-title"
          className="form-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={300}
          required
          autoFocus
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="task-desc">Description</label>
        <textarea
          id="task-desc"
          className="form-input form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={4000}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="task-status">Status</label>
          <select
            id="task-status"
            className="form-input"
            value={status}
            onChange={(e) => setStatus(Number(e.target.value))}
          >
            {Object.entries(TASK_STATUS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="task-priority">Priority</label>
          <select
            id="task-priority"
            className="form-input"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          >
            {Object.entries(TASK_PRIORITY).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="task-start">Start date</label>
          <input
            id="task-start"
            className="form-input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="task-due">Due date</label>
          <input
            id="task-due"
            className="form-input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      {buckets.length > 0 && (
        <div className="form-group">
          <label className="form-label" htmlFor="task-bucket">Bucket</label>
          <select
            id="task-bucket"
            className="form-input"
            value={bucketId}
            onChange={(e) => setBucketId(e.target.value)}
          >
            <option value="">— No bucket —</option>
            {buckets.map((b) => (
              <option key={b.pplanner_bucketid} value={b.pplanner_bucketid}>{b.pplanner_name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save Task'}
        </button>
      </div>
    </form>
  );
}
