import { useCallback, useEffect, useState } from "react";
import { loadClients, saveClients } from "../data/clients";

export function useClients(userId) {
  const [clients, setClients] = useState([]);

  const refresh = useCallback(() => {
    if (!userId) {
      setClients([]);
      return;
    }
    setClients(loadClients(userId));
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const persistList = useCallback(
    (list) => {
      setClients(list);
      saveClients(userId, list);
    },
    [userId]
  );

  return { clients, refresh, persistList };
}
