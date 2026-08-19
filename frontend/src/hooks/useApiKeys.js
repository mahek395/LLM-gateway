import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export function useApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    return api
      .get("/admin/api-keys")
      .then(setKeys)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function createKey(label) {
    const created = await api.post("/admin/api-keys", { label });
    await refresh();
    return created; // includes rawKey — caller must show it once
  }

  async function revokeKey(id) {
    await api.delete(`/admin/api-keys/${id}`);
    await refresh();
  }

  return { keys, loading, error, createKey, revokeKey };
}