import { useState } from "react";

export function CreateKeyForm({ onCreate }) {
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!label.trim()) return;
    setSubmitting(true);
    try {
      await onCreate(label.trim());
      setLabel("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <input
        type="text"
        placeholder="Key label (e.g. Portfolio Chatbot)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      <button
        type="submit"
        disabled={submitting || !label.trim()}
        className="bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
      >
        {submitting ? "Creating..." : "Generate key"}
      </button>
    </form>
  );
}