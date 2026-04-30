/**
 * useTasks.ts
 * Manages tasks for the currently selected plan.
 */
import { useState, useEffect, useCallback } from 'react';
import type { DataClient } from '../api/dataverse';
import type { Task } from '../types';
import {
  fetchTasksByPlan,
  createTask,
  updateTask,
  updateTaskStatus,
  moveTaskToBucket,
  deleteTask,
} from '../api/tasks';
import type { CreateTaskInput } from '../api/tasks';

export function useTasks(client: DataClient | null, planId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!client || !planId) {
      setTasks([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasksByPlan(client, planId);
      setTasks(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [client, planId]);

  useEffect(() => {
    void load();
  }, [load]);

  const addTask = useCallback(
    async (input: CreateTaskInput) => {
      if (!client) throw new Error('No client');
      const created = await createTask(client, input);
      setTasks((prev) => [...prev, created]);
      return created;
    },
    [client],
  );

  const editTask = useCallback(
    async (taskId: string, changes: Partial<Omit<CreateTaskInput, 'pplanner_planid@odata.bind'>>) => {
      if (!client) throw new Error('No client');
      setTasks((prev) => prev.map((t) => (t.pplanner_taskid === taskId ? { ...t, ...changes } : t)));
      try {
        const updated = await updateTask(client, taskId, changes);
        setTasks((prev) => prev.map((t) => (t.pplanner_taskid === taskId ? { ...t, ...updated } : t)));
        return updated;
      } catch (e) {
        if (import.meta.env.DEV) return; // mock doesn't support writes — keep optimistic state
        await load();
        throw e;
      }
    },
    [client, load],
  );

  const setTaskStatus = useCallback(
    async (taskId: string, status: number) => {
      if (!client) throw new Error('No client');
      setTasks((prev) => prev.map((t) => (t.pplanner_taskid === taskId ? { ...t, pplanner_status: status } : t)));
      try {
        await updateTaskStatus(client, taskId, status);
      } catch (e) {
        if (import.meta.env.DEV) return;
        await load();
        throw e;
      }
    },
    [client, load],
  );

  const moveToBucket = useCallback(
    async (taskId: string, bucketId: string) => {
      if (!client) throw new Error('No client');
      setTasks((prev) =>
        prev.map((t) => (t.pplanner_taskid === taskId ? { ...t, _pplanner_bucketid_value: bucketId } : t)),
      );
      try {
        await moveTaskToBucket(client, taskId, bucketId);
      } catch (e) {
        if (import.meta.env.DEV) return;
        await load();
        throw e;
      }
    },
    [client, load],
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      if (!client) throw new Error('No client');
      await deleteTask(client, taskId);
      setTasks((prev) => prev.filter((t) => t.pplanner_taskid !== taskId));
    },
    [client],
  );

  return { tasks, loading, error, refresh: load, addTask, editTask, setTaskStatus, moveToBucket, removeTask };
}
