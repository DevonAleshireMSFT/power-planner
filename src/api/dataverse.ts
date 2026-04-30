/**
 * dataverse.ts
 * ------------------------------------------------------------------
 * Thin wrapper around the Power Apps Code Apps DataClient.
 *
 * Usage:
 *   import { getDataClient } from './dataverse';
 *   const client = getDataClient(dataSourcesInfo);
 *   const result = await client.retrieveMultipleRecordsAsync<Task>('pplanner_tasks', { filter: "..." });
 *
 * The `dataSourcesInfo` object is injected by the Power Apps runtime.
 * In development you can supply a mock via the MockDataExecutor from
 * `@microsoft/power-apps/data/executors`.
 *
 * GCCH note: All calls resolve against the environment's Dataverse
 * endpoint (*.crm.microsoftdynamics.us) — no public-cloud deps.
 * ------------------------------------------------------------------
 */
import { getClient } from '@microsoft/power-apps/data';
import type { DataClient } from '@microsoft/power-apps/data';
import type { IOperationOptions, IOperationResult } from '@microsoft/power-apps/data';

/** Inferred from getClient's first parameter — not directly exported by the SDK. */
export type DataSourcesInfo = Parameters<typeof getClient>[0];

export type { DataClient, IOperationOptions, IOperationResult };

/**
 * Creates a typed DataClient bound to the provided DataSourcesInfo.
 * Call once per render cycle (or memoize) at the component level.
 */
export function getDataClient(dataSourcesInfo: DataSourcesInfo): DataClient {
  return getClient(dataSourcesInfo);
}

/**
 * Unwraps an IOperationResult and throws if unsuccessful.
 * Keeps API call-sites clean.
 */
export function unwrap<T>(result: IOperationResult<T>): T {
  if (!result.success) {
    throw result.error ?? new Error('Dataverse operation failed with no error detail.');
  }
  return result.data;
}
