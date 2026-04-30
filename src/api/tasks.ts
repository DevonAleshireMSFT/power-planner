import type { DataClient } from './dataverse';
import { unwrap } from './dataverse';
import type { Task } from '../types';
import { TABLES } from '../types';

const SELECT = [
  'pplanner_taskid',
  'pplanner_title',
  'pplanner_description',
  'pplanner_startdate',
  'pplanner_duedate',
  'pplanner_status',
  'pplanner_priority',
  '_pplanner_planid_value',
  '_pplanner_bucketid_value',
  'statecode',
  'statuscode',
  'createdon',
  'modifiedon',
];

/** Fetch all active tasks for a plan. */
export async function fetchTasksByPlan(client: DataClient, planId: string): Promise<Task[]> {
  const result = await client.retrieveMultipleRecordsAsync<Task>(TABLES.TASKS, {
    select: SELECT,
    filter: `_pplanner_planid_value eq '${planId}' and statecode eq 0`,
    orderBy: ['createdon asc'],
  });
  return unwrap(result);
}

/** Fetch all active tasks in a specific bucket. */
export async function fetchTasksByBucket(client: DataClient, bucketId: string): Promise<Task[]> {
  const result = await client.retrieveMultipleRecordsAsync<Task>(TABLES.TASKS, {
    select: SELECT,
    filter: `_pplanner_bucketid_value eq '${bucketId}' and statecode eq 0`,
    orderBy: ['createdon asc'],
  });
  return unwrap(result);
}

/** Fetch a single task record. */
export async function fetchTask(client: DataClient, taskId: string): Promise<Task> {
  const result = await client.retrieveRecordAsync<Task>(TABLES.TASKS, taskId, {
    select: SELECT,
  });
  return unwrap(result);
}

export interface CreateTaskInput {
  pplanner_title: string;
  pplanner_description?: string;
  pplanner_startdate?: string;
  pplanner_duedate?: string;
  pplanner_status: number;
  pplanner_priority: number;
  'pplanner_planid@odata.bind': string;   // e.g. "/pplanner_plans(<planId>)"
  'pplanner_bucketid@odata.bind'?: string; // e.g. "/pplanner_buckets(<bucketId>)"
}

/** Create a new task. Returns the created record. */
export async function createTask(client: DataClient, input: CreateTaskInput): Promise<Task> {
  const result = await client.createRecordAsync<CreateTaskInput, Task>(TABLES.TASKS, input);
  return unwrap(result);
}

/** Update any subset of task fields. */
export async function updateTask(
  client: DataClient,
  taskId: string,
  changes: Partial<Omit<CreateTaskInput, 'pplanner_planid@odata.bind'>>,
): Promise<Task> {
  const result = await client.updateRecordAsync<typeof changes, Task>(
    TABLES.TASKS,
    taskId,
    changes,
  );
  return unwrap(result);
}

/** Convenience: update only the task's status. */
export async function updateTaskStatus(
  client: DataClient,
  taskId: string,
  status: number,
): Promise<Task> {
  return updateTask(client, taskId, { pplanner_status: status });
}

/** Convenience: move a task to a different bucket. */
export async function moveTaskToBucket(
  client: DataClient,
  taskId: string,
  bucketId: string,
): Promise<Task> {
  return updateTask(client, taskId, {
    'pplanner_bucketid@odata.bind': `/pplanner_buckets(${bucketId})`,
  });
}

/** Soft-delete: deactivate the task record (statecode = 1). */
export async function deleteTask(client: DataClient, taskId: string): Promise<void> {
  const result = await client.deleteRecordAsync(TABLES.TASKS, taskId);
  unwrap(result);
}
