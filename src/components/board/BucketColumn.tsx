import { useState } from 'react';
import type { Bucket, Task } from '../../types';
import { TaskCard } from './TaskCard';

interface BucketColumnProps {
  bucket: Bucket;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onTaskDrop: (taskId: string, bucketId: string) => void;
  onAddTask: (bucketId: string) => void;
}

export function BucketColumn({
  bucket,
  tasks,
  onTaskClick,
  onTaskDrop,
  onAddTask,
}: BucketColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) onTaskDrop(taskId, bucket.pplanner_bucketid);
  }

  return (
    <div
      className={`bucket-column${isDragOver ? ' drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label={`Bucket: ${bucket.pplanner_name}`}
    >
      <div className="bucket-header">
        <span className="bucket-name">{bucket.pplanner_name}</span>
        <span className="bucket-count">{tasks.length}</span>
      </div>

      <div className="bucket-task-list">
        {tasks.map((task) => (
          <TaskCard
            key={task.pplanner_taskid}
            task={task}
            onClick={() => onTaskClick(task.pplanner_taskid)}
            onDragStart={(e, id) => {
              e.dataTransfer.setData('taskId', id);
              e.dataTransfer.effectAllowed = 'move';
            }}
          />
        ))}
      </div>

      <button
        className="bucket-add-task-btn"
        onClick={() => onAddTask(bucket.pplanner_bucketid)}
        aria-label={`Add task to ${bucket.pplanner_name}`}
      >
        + Add task
      </button>
    </div>
  );
}
