import type { Bucket, Task } from '../../types';
import { BucketColumn } from './BucketColumn';

interface BoardViewProps {
  buckets: Bucket[];
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onTaskDrop: (taskId: string, bucketId: string) => void;
  onAddTask: (bucketId: string) => void;
  onAddBucket: () => void;
  loading: boolean;
}

export function BoardView({
  buckets,
  tasks,
  onTaskClick,
  onTaskDrop,
  onAddTask,
  onAddBucket,
  loading,
}: BoardViewProps) {
  if (loading) {
    return <div className="board-loading">Loading tasks…</div>;
  }

  return (
    <div className="board-view" role="region" aria-label="Board view">
      {buckets.map((bucket) => (
        <BucketColumn
          key={bucket.pplanner_bucketid}
          bucket={bucket}
          tasks={tasks.filter((t) => t._pplanner_bucketid_value === bucket.pplanner_bucketid)}
          onTaskClick={onTaskClick}
          onTaskDrop={onTaskDrop}
          onAddTask={onAddTask}
        />
      ))}

      <button className="board-add-bucket-btn" onClick={onAddBucket} aria-label="Add bucket">
        + Add bucket
      </button>
    </div>
  );
}
