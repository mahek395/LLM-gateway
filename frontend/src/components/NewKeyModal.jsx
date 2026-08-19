import { useState } from "react";

export function NewKeyModal({ rawKey, onClose }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-2">API key created</h2>
        <p className="text-sm text-gray-600 mb-4">
          Copy this key now — it won't be shown again. If you lose it, you'll need to revoke it and create a new one.
        </p>
        <div className="bg-gray-100 rounded px-3 py-2 font-mono text-sm break-all mb-4">
          {rawKey}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 bg-gray-900 text-white rounded py-2 text-sm font-medium hover:bg-gray-800"
          >
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 rounded py-2 text-sm font-medium hover:bg-gray-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}