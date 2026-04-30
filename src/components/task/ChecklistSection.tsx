import { useState } from 'react';
import type { DataClient } from '../../api/dataverse';
import type { ChecklistItem } from '../../types';
import {
  fetchChecklistItems,
  createChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from '../../api/checklistItems';
import { useEffect } from 'react';

interface ChecklistSectionProps {
  taskId: string;
  client: DataClient;
}

export function ChecklistSection({ taskId, client }: ChecklistSectionProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChecklistItems(client, taskId)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [client, taskId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const created = await createChecklistItem(client, {
        pplanner_title: newTitle.trim(),
        pplanner_iscomplete: false,
        pplanner_order: items.length,
        'pplanner_taskid@odata.bind': `/pplanner_tasks(${taskId})`,
      });
      setItems((prev) => [...prev, created]);
      setNewTitle('');
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(item: ChecklistItem) {
    const updated = await toggleChecklistItem(client, item.pplanner_checklistitemid, !item.pplanner_iscomplete);
    setItems((prev) =>
      prev.map((i) => (i.pplanner_checklistitemid === item.pplanner_checklistitemid ? updated : i)),
    );
  }

  async function handleDelete(itemId: string) {
    await deleteChecklistItem(client, itemId);
    setItems((prev) => prev.filter((i) => i.pplanner_checklistitemid !== itemId));
  }

  const completed = items.filter((i) => i.pplanner_iscomplete).length;

  if (loading) return <div className="checklist-loading">Loading checklist…</div>;

  return (
    <section className="checklist-section" aria-label="Checklist">
      <div className="section-header">
        <h4 className="section-title">
          Checklist
          {items.length > 0 && (
            <span className="checklist-progress"> ({completed}/{items.length})</span>
          )}
        </h4>
      </div>

      {items.length > 0 && (
        <div className="checklist-progress-bar" aria-hidden="true">
          <div
            className="checklist-progress-fill"
            style={{ width: `${items.length > 0 ? (completed / items.length) * 100 : 0}%` }}
          />
        </div>
      )}

      <ul className="checklist-list">
        {items.map((item) => (
          <li key={item.pplanner_checklistitemid} className="checklist-item">
            <input
              type="checkbox"
              checked={item.pplanner_iscomplete}
              onChange={() => handleToggle(item)}
              aria-label={item.pplanner_title}
              id={`cl-${item.pplanner_checklistitemid}`}
            />
            <label
              htmlFor={`cl-${item.pplanner_checklistitemid}`}
              className={item.pplanner_iscomplete ? 'checklist-done' : ''}
            >
              {item.pplanner_title}
            </label>
            <button
              className="checklist-delete"
              onClick={() => handleDelete(item.pplanner_checklistitemid)}
              aria-label={`Delete checklist item: ${item.pplanner_title}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="checklist-add-form">
        <input
          className="form-input checklist-add-input"
          type="text"
          placeholder="Add checklist item…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          maxLength={200}
        />
        <button type="submit" className="btn btn-secondary btn-sm" disabled={adding || !newTitle.trim()}>
          Add
        </button>
      </form>
    </section>
  );
}
