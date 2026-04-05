import { useCallback, useEffect, useState } from "react";
import { loadIncomeMonthsForYear, saveIncomeMonthsForYear } from "../data/incomeYtd";

export function useIncomeYtd(userId, year) {
  const [months, setMonthsState] = useState(() => loadIncomeMonthsForYear(userId, year));

  const refresh = useCallback(() => {
    setMonthsState(loadIncomeMonthsForYear(userId, year));
  }, [userId, year]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setMonths = useCallback(
    (next) => {
      setMonthsState((prev) => {
        const arr = typeof next === "function" ? next(prev) : next;
        const normalized = Array.from({ length: 12 }, (_, i) => Number(arr[i]) || 0);
        saveIncomeMonthsForYear(userId, year, normalized);
        return normalized;
      });
    },
    [userId, year]
  );

  const setMonth = useCallback(
    (monthIndex, value) => {
      const n = Math.max(0, Number(value) || 0);
      setMonths((prev) => {
        const copy = [...prev];
        copy[monthIndex] = n;
        return copy;
      });
    },
    [setMonths]
  );

  return { months, setMonths, setMonth, refresh };
}
