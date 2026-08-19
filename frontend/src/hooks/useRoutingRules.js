import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export function useRoutingRules() {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    return api
      .get("/admin/routing-rules")
      .then(setRules)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function saveRules(updates) {
    const updated = await api.put("/admin/routing-rules", updates);
    setRules(updated);
    return updated;
  }

  return { rules, loading, error, saveRules };
}