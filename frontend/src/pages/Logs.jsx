import { useState } from "react";
import { useLogs } from "../hooks/useLogs";
import { LogDetailDrawer } from "../components/LogDetailDrawer";

const PAGE_SIZE = 25;

export function Logs() {
  const [provider, setProvider] = useState("");
  const [cacheHit, setCacheHit] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  const { data, loading, error } = useLogs({ provider, cacheHit, search, page, pageSize: PAGE_SIZE });

  function resetToFirstPage(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Request Logs</h1>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search prompt text..."
          value={search}
          onChange={(e) => resetToFirstPage(setSearch)(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <select
          value={provider}
          onChange={(e) => resetToFirstPage(setProvider)(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">All providers</option>
          <option value="groq">Groq</option>
          <option value="gemini">Gemini</option>
        </select>
        <select
          value={cacheHit}
          onChange={(e) => resetToFirstPage(setCacheHit)(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">Cache: all</option>
          <option value="true">Cache hits only</option>
          <option value="false">Cache misses only</option>
        </select>
      </div>

      {loading && <div className="text-gray-500">Loading...</div>}
      {error && <div className="text-red-600">Failed to load logs: {error.message}</div>}

      {!loading && !error && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Prompt</th>
                  <th className="px-4 py-3 font-medium">Cache</th>
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium">Cost</th>
                  <th className="px-4 py-3 font-medium">Latency</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No requests match these filters.
                    </td>
                  </tr>
                )}
                {data.rows.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">{log.prompt_text}</td>
                    <td className="px-4 py-3">
                      {log.cache_hit ? (
                        <span className="text-green-600 text-xs font-medium">HIT</span>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">MISS</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{log.provider}</td>
                    <td className="px-4 py-3 text-gray-500">
                      ${Number(log.estimated_cost_usd ?? 0).toFixed(6)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{log.latency_ms}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <div>{data.total} total requests</div>
            <div className="flex gap-2 items-center">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <LogDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}