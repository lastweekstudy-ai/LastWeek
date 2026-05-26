import { useState, useEffect, useCallback } from 'react';
import { getAdminSettings, updateAdminSettings as updateSettings } from '../appwrite/admin';

/**
 * Hook to manage admin settings
 * Provides cached settings with refresh capability
 */
const useAdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminSettings();
      setSettings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateAdminSettings = useCallback(async (updates) => {
    try {
      const updated = await updateSettings(updates);
      setSettings(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Convenience methods for common toggles
  const togglePreReg = useCallback(async (value) => {
    return updateAdminSettings({ preRegActive: value });
  }, [updateAdminSettings]);

  const togglePayments = useCallback(async (value) => {
    return updateAdminSettings({ paymentsActive: value });
  }, [updateAdminSettings]);

  const toggleDailyFreeSlots = useCallback(async (value) => {
    return updateAdminSettings({ dailyFreeSlotsActive: value });
  }, [updateAdminSettings]);

  const setDailySlotCount = useCallback(async (count) => {
    return updateAdminSettings({ dailyFreeSlotCount: count });
  }, [updateAdminSettings]);

  const togglePlan = useCallback(async (planKey, value) => {
    const fieldMap = {
      free: 'freePlanActive',
      pro: 'proPlanActive',
      plus: 'plusPlanActive',
      proplus: 'proPlusPlanActive',
    };
    const field = fieldMap[planKey];
    if (!field) throw new Error(`Unknown plan: ${planKey}`);
    return updateAdminSettings({ [field]: value });
  }, [updateAdminSettings]);

  return {
    settings,
    loading,
    error,
    refresh: fetchSettings,
    updateAdminSettings,
    togglePreReg,
    togglePayments,
    toggleDailyFreeSlots,
    setDailySlotCount,
    togglePlan,
    // Convenience booleans
    preRegActive: settings?.preRegActive ?? false,
    paymentsActive: settings?.paymentsActive ?? true,
    dailyFreeSlotsActive: settings?.dailyFreeSlotsActive ?? false,
    dailyFreeSlotCount: settings?.dailyFreeSlotCount ?? 10,
    freePlanActive: settings?.freePlanActive ?? true,
    proPlanActive: settings?.proPlanActive ?? true,
    plusPlanActive: settings?.plusPlanActive ?? true,
    proPlusPlanActive: settings?.proPlusPlanActive ?? true,
  };
};

export default useAdminSettings;
