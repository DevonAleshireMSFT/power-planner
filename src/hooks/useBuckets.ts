/**
 * useBuckets.ts
 * Manages buckets for the currently selected plan.
 */
import { useState, useEffect, useCallback } from 'react';
import type { DataClient } from '../api/dataverse';
import type { Bucket } from '../types';
import { fetchBuckets, createBucket, updateBucket, deleteBucket } from '../api/buckets';
import type { CreateBucketInput } from '../api/buckets';

export function useBuckets(client: DataClient | null, planId: string | null) {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!client || !planId) {
      setBuckets([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBuckets(client, planId);
      setBuckets(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [client, planId]);

  useEffect(() => {
    void load();
  }, [load]);

  const addBucket = useCallback(
    async (name: string, planId: string) => {
      if (!client) throw new Error('No client');
      const order = buckets.length;
      const created = await createBucket(client, {
        pplanner_name: name,
        pplanner_order: order,
        'pplanner_planid@odata.bind': `/pplanner_plans(${planId})`,
      } satisfies CreateBucketInput);
      setBuckets((prev) => [...prev, created]);
      return created;
    },
    [client, buckets.length],
  );

  const editBucket = useCallback(
    async (bucketId: string, changes: { pplanner_name?: string; pplanner_order?: number }) => {
      if (!client) throw new Error('No client');
      const updated = await updateBucket(client, bucketId, changes);
      setBuckets((prev) =>
        prev.map((b) => (b.pplanner_bucketid === bucketId ? { ...b, ...updated } : b)),
      );
    },
    [client],
  );

  const removeBucket = useCallback(
    async (bucketId: string) => {
      if (!client) throw new Error('No client');
      await deleteBucket(client, bucketId);
      setBuckets((prev) => prev.filter((b) => b.pplanner_bucketid !== bucketId));
    },
    [client],
  );

  return { buckets, loading, error, refresh: load, addBucket, editBucket, removeBucket };
}
