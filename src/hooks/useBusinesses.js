import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadBusinesses,
  loadSelectedBusinessId,
  migrateLegacyBusinessProfile,
  saveBusinesses,
  saveSelectedBusinessId,
} from "../data/businesses";

export function useBusinesses(userId) {
  const [businesses, setBusinesses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const refresh = useCallback(() => {
    if (!userId) {
      setBusinesses([]);
      setSelectedId(null);
      return;
    }
    migrateLegacyBusinessProfile(userId);
    const list = loadBusinesses(userId);
    setBusinesses(list);
    const stored = loadSelectedBusinessId(userId);
    const valid = list.some((b) => b.id === stored);
    const nextId = valid ? stored : list[0]?.id ?? null;
    setSelectedId(nextId);
    if (nextId && nextId !== stored) saveSelectedBusinessId(userId, nextId);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selected = useMemo(
    () => businesses.find((b) => b.id === selectedId) ?? null,
    [businesses, selectedId]
  );

  const selectBusiness = useCallback(
    (id) => {
      setSelectedId(id);
      if (userId && id) saveSelectedBusinessId(userId, id);
    },
    [userId]
  );

  const persistList = useCallback(
    (list) => {
      setBusinesses(list);
      saveBusinesses(userId, list);
    },
    [userId]
  );

  return {
    businesses,
    selected,
    selectedId,
    selectBusiness,
    persistList,
    refresh,
  };
}
