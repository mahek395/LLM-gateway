export function LogDetailDrawer({ log, onClose }) {
  if (!log) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={onClose}>
      <div
        className="bg-white h-full w-full max-w-md p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold">Request detail</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-gray-500">Prompt</dt>
            <dd className="mt-1 whitespace-pre-wrap">{log.prompt_text}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Cache hit</dt>
            <dd className="mt-1">{log.cache_hit ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Provider / Model</dt>
            <dd className="mt-1">{log.provider} / {log.model}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Tokens</dt>
            <dd className="mt-1">
              {log.prompt_tokens ?? "—"} in / {log.completion_tokens ?? "—"} out
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Cost</dt>
            <dd className="mt-1">${Number(log.estimated_cost_usd ?? 0).toFixed(6)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Latency</dt>
            <dd className="mt-1">{log.latency_ms}ms</dd>
          </div>
          <div>
            <dt className="text-gray-500">Time</dt>
            <dd className="mt-1">{new Date(log.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Request ID</dt>
            <dd className="mt-1 font-mono text-xs text-gray-500">{log.request_id}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}