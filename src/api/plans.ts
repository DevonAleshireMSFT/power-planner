import type { DataClient } from './dataverse';
import { unwrap } from './dataverse';
import type { Plan } from '../types';
import { TABLES } from '../types';

const SELECT = ['pplanner_planid', 'pplanner_name', 'pplanner_description', 'pplanner_startdate', 'pplanner_enddate', '_ownerid_value', 'statecode', 'statuscode', 'createdon', 'modifiedon'];

export async function fetchPlans(client: DataClient): Promise<Plan[]> {
  const result = await client.retrieveMultipleRecordsAsync<Plan>(TABLES.PLANS, {
    select: SELECT,
    filter: 'statecode eq 0',
    orderBy: ['createdon desc'],
  });
  return unwrap(result);
}

export async function fetchPlan(client: DataClient, planId: string): Promise<Plan> {
  const result = await client.retrieveRecordAsync<Plan>(TABLES.PLANS, planId, {
    select: SELECT,
  });
  return unwrap(result);
}

export interface CreatePlanInput {
  pplanner_name: string;
  pplanner_description?: string;
  pplanner_startdate?: string;
  pplanner_enddate?: string;
}

export async function createPlan(client: DataClient, input: CreatePlanInput): Promise<Plan> {
  const result = await client.createRecordAsync<CreatePlanInput, Plan>(TABLES.PLANS, input);
  return unwrap(result);
}

export async function updatePlan(
  client: DataClient,
  planId: string,
  changes: Partial<CreatePlanInput>,
): Promise<Plan> {
  const result = await client.updateRecordAsync<Partial<CreatePlanInput>, Plan>(
    TABLES.PLANS,
    planId,
    changes,
  );
  return unwrap(result);
}

export async function deletePlan(client: DataClient, planId: string): Promise<void> {
  const result = await client.deleteRecordAsync(TABLES.PLANS, planId);
  unwrap(result);
}
