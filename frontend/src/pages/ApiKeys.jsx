import { useState } from "react";
import { useApiKeys } from "../hooks/useApiKeys";
import { CreateKeyForm } from "../components/CreateKeyForm";
import { NewKeyModal } from "../components/NewKeyModal";

export function ApiKeys() {
  const { keys, loading, error, createKey, revokeKey } = useApiKeys();
  const [newRawKey, setNewRawKey] = useState(null);

  async function handleCreate(label) {
    const created = await createKey(label);
    setNewRawKey(created.rawKey);
  }

  async function handleRevoke(id, label) {
    if (!confirm(`Revoke "${label}"? Any app using this key will stop working immediately.`)) return;
    await revokeKey(id);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">API Keys</h1>

      <CreateKeyForm onCreate={handleCreate} />

      {loading && <div className="text-gray-500">Loading...</div>}
      {error && <div className="text-red-600">Failed to load keys: {error.message}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Label</th>
                <th className="px-4 py-3 font-medium">Rate limit</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {keys.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No API keys yet — create one above.
                  </td>
                </tr>
              )}
              {keys.map((key) => (
                <tr key={key.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{key.label}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {key.rate_limit_capacity} burst / {key.refill_per_sec}/s
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(key.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {key.revoked_at ? (
                      <span className="text-red-600 text-xs font-medium">Revoked</span>
                    ) : (
                      <span className="text-green-600 text-xs font-medium">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!key.revoked_at && (
                      <button
                        onClick={() => handleRevoke(key.id, key.label)}
                        className="text-red-600 text-xs hover:underline"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {newRawKey && <NewKeyModal rawKey={newRawKey} onClose={() => setNewRawKey(null)} />}
    </div>
  );
}