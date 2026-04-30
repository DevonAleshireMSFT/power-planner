import type { DataClient } from './dataverse';
import { unwrap } from './dataverse';
import type { ChecklistItem } from '../types';
import { TABLES } from '../types';

const SELECT = ['pplanner_checklistitemid', 'pplanner_title', 'pplanner_iscomplete', 'pplanner_order', '_pplanner_taskid_value'];

export async function fetchChecklistItems(
  client: DataClient,
  taskId: string,
): Promise<ChecklistItem[]> {
  const result = await client.retrieveMultipleRecordsAsync<ChecklistItem>(
    TABLES.CHECKLIST_ITEMS,
    {
      select: SELECT,
      filter: `_pplanner_taskid_value eq '${taskId}'`,
      orderBy: ['pplanner_order asc'],
    },
  );
  return unwrap(result);
}

export interface CreateChecklistItemInput {
  pplanner_title: string;
  pplanner_iscomplete: boolean;
  pplanner_order: number;
  'pplanner_taskid@odata.bind': string; // e.g. "/pplanner_tasks(<taskId>)"
}

export async function createChecklistItem(
  client: DataClient,
  input: CreateChecklistItemInput,
): Promise<ChecklistItem> {
  const result = await client.createRecordAsync<CreateChecklistItemInput, ChecklistItem>(
    TABLES.CHECKLIST_ITEMS,
    input,
  );
  return unwrap(result);
}

export async function toggleChecklistItem(
  client: DataClient,
  itemId: string,
  isComplete: boolean,
): Promise<ChecklistItem> {
  const result = await client.updateRecordAsync<{ pplanner_iscomplete: boolean }, ChecklistItem>(
    TABLES.CHECKLIST_ITEMS,
    itemId,
    { pplanner_iscomplete: isComplete },
  );
  return unwrap(result);
}

export async function deleteChecklistItem(client: DataClient, itemId: string): Promise<void> {
  const result = await client.deleteRecordAsync(TABLES.CHECKLIST_ITEMS, itemId);
  unwrap(result);
}
