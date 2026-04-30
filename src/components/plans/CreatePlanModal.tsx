import { useState } from 'react';
import { Modal } from '../shared/Modal';
import type { CreatePlanInput } from '../../api/plans';

interface CreatePlanModalProps {
  onClose: () => void;
  onSubmit: (input: CreatePlanInput) => Promise<void>;
}

export function CreatePlanModal({ onClose, onSubmit }: CreatePlanModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Plan name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        pplanner_name: name.trim(),
        pplanner_description: description.trim() || undefined,
        pplanner_startdate: startDate || undefined,
        pplanner_enddate: endDate || undefined,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create plan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Create Plan" onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="form-group">
          <label className="form-label" htmlFor="plan-name">Plan name *</label>
          <input
            id="plan-name"
            className="form-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="plan-desc">Description</label>
          <textarea
            id="plan-desc"
            className="form-input form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="plan-start">Start date</label>
            <input
              id="plan-start"
              className="form-input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="plan-end">End date</label>
            <input
              id="plan-end"
              className="form-input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create Plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
