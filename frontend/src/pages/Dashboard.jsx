import { useStats } from "../hooks/useStats";
import { StatCard } from "../components/StatCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function Dashboard() {
  const { stats, loading, error } = useStats();

  if (loading) return <div className="text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="text-red-600">Failed to load stats: {error.message}</div>;
  if (!stats) return null;

  const latencyData = [
    { name: "Cache hit", ms: Math.round(stats.avgLatencyCacheHitMs) },
    { name: "Cache miss", ms: Math.round(stats.avgLatencyCacheMissMs) },
  ];

  const providerData = stats.byProvider.map((p) => ({
    name: `${p.provider} (${p.model})`,
    requests: Number(p.requests),
    cost: Number(p.cost_usd),
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total requests" value={stats.totalRequests} />
        <StatCard
          label="Cache hit rate"
          value={`${(stats.cacheHitRate * 100).toFixed(1)}%`}
          hint={`${stats.cacheHits} of ${stats.totalRequests} requests`}
        />
        <StatCard label="Total cost" value={`$${stats.totalCostUsd.toFixed(6)}`} />
        <StatCard
          label="Latency (hit vs miss)"
          value={`${Math.round(stats.avgLatencyCacheHitMs)}ms / ${Math.round(stats.avgLatencyCacheMissMs)}ms`}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Average latency: cache hit vs miss (ms)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="ms" fill="#111827" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Requests by provider</h2>
          {providerData.length === 0 ? (
            <div className="text-sm text-gray-400 py-16 text-center">
              No non-cached requests yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={providerData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="requests" fill="#111827" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}