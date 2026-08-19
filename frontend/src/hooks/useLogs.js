import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export function useLogs(filters) {
  const [data, setData] = useState({ rows: [], total: 0, page: 1, pageSize: 25 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.provider) params.set("provider", filters.provider);
    if (filters.cacheHit !== "") params.set("cacheHit", filters.cacheHit);
    if (filters.search) params.set("search", filters.search);
    params.set("page", filters.page);
    params.set("pageSize", filters.pageSize);

    return api
      .get(`/admin/logs?${params.toString()}`)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [filters.provider, filters.cacheHit, filters.search, filters.page, filters.pageSize]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}