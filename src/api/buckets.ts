import type { DataClient } from './dataverse';
import { unwrap } from './dataverse';
import type { Bucket } from '../types';
import { TABLES } from '../types';

const SELECT = ['pplanner_bucketid', 'pplanner_name', 'pplanner_order', '_pplanner_planid_value', 'createdon'];

export async function fetchBuckets(client: DataClient, planId: string): Promise<Bucket[]> {
  const result = await client.retrieveMultipleRecordsAsync<Bucket>(TABLES.BUCKETS, {
    select: SELECT,
    filter: `_pplanner_planid_value eq '${planId}'`,
    orderBy: ['pplanner_order asc'],
  });
  return unwrap(result);
}

export interface CreateBucketInput {
  pplanner_name: string;
  pplanner_order: number;
  'pplanner_planid@odata.bind': string; // e.g. "/pplanner_plans(<planId>)"
}

export async function createBucket(client: DataClient, input: CreateBucketInput): Promise<Bucket> {
  const result = await client.createRecordAsync<CreateBucketInput, Bucket>(TABLES.BUCKETS, input);
  return unwrap(result);
}

export async function updateBucket(
  client: DataClient,
  bucketId: string,
  changes: Partial<Pick<CreateBucketInput, 'pplanner_name' | 'pplanner_order'>>,
): Promise<Bucket> {
  const result = await client.updateRecordAsync<typeof changes, Bucket>(
    TABLES.BUCKETS,
    bucketId,
    changes,
  );
  return unwrap(result);
}

export async function deleteBucket(client: DataClient, bucketId: string): Promise<void> {
  const result = await client.deleteRecordAsync(TABLES.BUCKETS, bucketId);
  unwrap(result);
}

/** Seed default buckets for a brand-new plan. */
export async function seedDefaultBuckets(client: DataClient, planId: string): Promise<Bucket[]> {
  const defaults = ['To Do', 'In Progress', 'Done'];
  return Promise.all(
    defaults.map((name, i) =>
      createBucket(client, {
        pplanner_name: name,
        pplanner_order: i,
        'pplanner_planid@odata.bind': `/pplanner_plans(${planId})`,
      }),
    ),
  );
}
