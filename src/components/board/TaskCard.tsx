import type { Task } from '../../types';
import { TASK_STATUS, TASK_PRIORITY, TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '../../types';
import { Badge } from '../shared/Badge';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

/** A single draggable task card in the board view. */
export function TaskCard({ task, onClick, onDragStart }: TaskCardProps) {
  const isOverdue =
    task.pplanner_duedate &&
    task.pplanner_status !== 2 &&
    new Date(task.pplanner_duedate) < new Date();

  return (
    <div
      className="task-card"
      draggable
      onDragStart={(e) => onDragStart(e, task.pplanner_taskid)}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      tabIndex={0}
      role="button"
      aria-label={`Task: ${task.pplanner_title}`}
    >
      {/* Priority stripe */}
      <div
        className="task-card-priority-stripe"
        style={{ background: TASK_PRIORITY_COLORS[task.pplanner_priority] }}
        aria-hidden="true"
      />

      <div className="task-card-body">
        <p className="task-card-title">{task.pplanner_title}</p>

        <div className="task-card-meta">
          <Badge
            label={TASK_STATUS[task.pplanner_status]}
            backgroundColor={TASK_STATUS_COLORS[task.pplanner_status]}
          />
          <Badge
            label={TASK_PRIORITY[task.pplanner_priority]}
            backgroundColor={TASK_PRIORITY_COLORS[task.pplanner_priority]}
          />
        </div>

        {task.pplanner_duedate && (
          <p className={`task-card-due${isOverdue ? ' overdue' : ''}`}>
            Due {new Date(task.pplanner_duedate).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
