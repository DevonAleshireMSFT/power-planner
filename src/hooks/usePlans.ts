/**
 * usePlans.ts
 * Manages the list of plans and the currently selected plan.
 */
import { useState, useEffect, useCallback } from 'react';
import type { DataClient } from '../api/dataverse';
import type { Plan } from '../types';
import { fetchPlans, createPlan, updatePlan, deletePlan } from '../api/plans';
import type { CreatePlanInput } from '../api/plans';
import { seedDefaultBuckets } from '../api/buckets';

export function usePlans(client: DataClient | null) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlans(client);
      setPlans(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const addPlan = useCallback(
    async (input: CreatePlanInput) => {
      if (!client) throw new Error('No client');
      const created = await createPlan(client, input);
      // Seed default buckets for new plan
      await seedDefaultBuckets(client, created.pplanner_planid);
      setPlans((prev) => [created, ...prev]);
      return created;
    },
    [client],
  );

  const editPlan = useCallback(
    async (planId: string, changes: Partial<CreatePlanInput>) => {
      if (!client) throw new Error('No client');
      const updated = await updatePlan(client, planId, changes);
      setPlans((prev) => prev.map((p) => (p.pplanner_planid === planId ? { ...p, ...updated } : p)));
      return updated;
    },
    [client],
  );

  const removePlan = useCallback(
    async (planId: string) => {
      if (!client) throw new Error('No client');
      await deletePlan(client, planId);
      setPlans((prev) => prev.filter((p) => p.pplanner_planid !== planId));
    },
    [client],
  );

  return { plans, loading, error, refresh: load, addPlan, editPlan, removePlan };
}
