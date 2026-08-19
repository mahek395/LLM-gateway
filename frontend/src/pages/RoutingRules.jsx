import { useState, useEffect } from "react";
import { useRoutingRules } from "../hooks/useRoutingRules";

const DEFAULT_FORM = {
  routingPolicy: "balanced",
  lambdaCost: 100,
  cascadeThreshold: 0.60,
  capabilityMargin: 0.08,
  minCapabilityFloor: 0.00,
  enableCascadeFallback: true,
  cacheSimilarityThreshold: 0.95,
};

const POLICIES = [
  {
    value: "balanced",
    label: "Balanced",
    description:
      "Balances model capability against request cost.",
  },
  {
    value: "cost_minimizing",
    label: "Cost Minimizing",
    description:
      "Uses the cheapest model that is capable enough.",
  },
  {
    value: "quality_maximizing",
    label: "Quality Maximizing",
    description:
      "Always prefers the highest-capability registered model.",
  },
  {
    value: "threshold_cascade",
    label: "Threshold Cascade",
    description:
      "Uses cheaper qualified models below a complexity threshold and the strongest model above it.",
  },
  {
    value: "latency_minimizing",
    label: "Latency Minimizing",
    description:
      "Prefers the fastest model that is capable enough.",
  },
];

export function RoutingRules() {
  const {
    rules,
    loading,
    error,
    saveRules,
  } = useRoutingRules();

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // ------------------------------------------------------------
  // Populate local form from backend rules
  // ------------------------------------------------------------
  useEffect(() => {
    if (!rules) return;

    setForm({
      routingPolicy:
        rules.routing_policy ??
        DEFAULT_FORM.routingPolicy,

      lambdaCost:
        Number(rules.lambda_cost) ??
        DEFAULT_FORM.lambdaCost,

      cascadeThreshold:
        Number(rules.cascade_threshold) ??
        DEFAULT_FORM.cascadeThreshold,

      capabilityMargin:
        Number(rules.capability_margin) ??
        DEFAULT_FORM.capabilityMargin,

      minCapabilityFloor:
        Number(rules.min_capability_floor) ??
        DEFAULT_FORM.minCapabilityFloor,

      enableCascadeFallback:
        rules.enable_cascade_fallback ??
        DEFAULT_FORM.enableCascadeFallback,

      cacheSimilarityThreshold:
        Number(rules.cache_similarity_threshold) ??
        DEFAULT_FORM.cacheSimilarityThreshold,
    });
  }, [rules]);

  if (loading) {
    return (
      <div className="text-gray-500">
        Loading routing configuration...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600">
        Failed to load routing rules: {error.message}
      </div>
    );
  }

  if (!form) {
    return null;
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSaveError(null);
    setSavedAt(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSavedAt(null);

    try {
      await saveRules({
        routing_policy: form.routingPolicy,
        lambda_cost: Number(form.lambdaCost),
        cascade_threshold: Number(
          form.cascadeThreshold
        ),
        capability_margin: Number(
          form.capabilityMargin
        ),
        min_capability_floor: Number(
          form.minCapabilityFloor
        ),
        enable_cascade_fallback:
          Boolean(form.enableCascadeFallback),
        cache_similarity_threshold: Number(
          form.cacheSimilarityThreshold
        ),
      });

      setSavedAt(new Date());
    } catch (err) {
      setSaveError(err);
    } finally {
      setSaving(false);
    }
  }

  const selectedPolicy = POLICIES.find(
    (policy) =>
      policy.value === form.routingPolicy
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-2">
        Routing Rules
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        Control how HyperRouter chooses among registered
        models. Changes apply without redeploying the gateway.
      </p>

      <div className="space-y-6">

        {/* -------------------------------------------------- */}
        {/* Routing policy */}
        {/* -------------------------------------------------- */}

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Routing policy
          </h2>

          <p className="text-sm text-gray-500 mb-4">
            Choose the strategy HyperRouter uses when
            selecting a registered model.
          </p>

          <select
            value={form.routingPolicy}
            onChange={(e) =>
              updateField(
                "routingPolicy",
                e.target.value
              )
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          >
            {POLICIES.map((policy) => (
              <option
                key={policy.value}
                value={policy.value}
              >
                {policy.label}
              </option>
            ))}
          </select>

          {selectedPolicy && (
            <p className="text-xs text-gray-500 mt-2">
              {selectedPolicy.description}
            </p>
          )}
        </section>

        {/* -------------------------------------------------- */}
        {/* Cost / capability controls */}
        {/* -------------------------------------------------- */}

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">
            Routing parameters
          </h2>

          {/* Lambda cost */}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost sensitivity:{" "}
              {Number(form.lambdaCost).toFixed(1)}
            </label>

            <input
              type="range"
              min="0"
              max="500"
              step="5"
              value={form.lambdaCost}
              onChange={(e) =>
                updateField(
                  "lambdaCost",
                  Number(e.target.value)
                )
              }
              className="w-full"
            />

            <p className="text-xs text-gray-400 mt-1">
              Higher values make cost matter more when
              comparing otherwise suitable models.
            </p>
          </div>

          {/* Cascade threshold */}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cascade threshold:{" "}
              {Number(form.cascadeThreshold).toFixed(2)}
            </label>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={form.cascadeThreshold}
              onChange={(e) =>
                updateField(
                  "cascadeThreshold",
                  Number(e.target.value)
                )
              }
              className="w-full"
            />

            <p className="text-xs text-gray-400 mt-1">
              Used by Threshold Cascade. Requests at or
              above this complexity use the strongest
              available model.
            </p>
          </div>

          {/* Capability margin */}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capability margin:{" "}
              {Number(form.capabilityMargin).toFixed(2)}
            </label>

            <input
              type="range"
              min="0"
              max="0.30"
              step="0.01"
              value={form.capabilityMargin}
              onChange={(e) =>
                updateField(
                  "capabilityMargin",
                  Number(e.target.value)
                )
              }
              className="w-full"
            />

            <p className="text-xs text-gray-400 mt-1">
              Allows a model to be slightly below the
              estimated prompt complexity and still qualify.
            </p>
          </div>

          {/* Minimum capability */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum capability floor:{" "}
              {Number(
                form.minCapabilityFloor
              ).toFixed(2)}
            </label>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={form.minCapabilityFloor}
              onChange={(e) =>
                updateField(
                  "minCapabilityFloor",
                  Number(e.target.value)
                )
              }
              className="w-full"
            />

            <p className="text-xs text-gray-400 mt-1">
              Prevents models below this capability score
              from being considered for routing.
            </p>
          </div>
        </section>

        {/* -------------------------------------------------- */}
        {/* Fallback */}
        {/* -------------------------------------------------- */}

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Fallback behavior
          </h2>

          <p className="text-sm text-gray-500 mb-4">
            Controls whether the router recommends a stronger
            model as an escalation/fallback candidate.
          </p>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.enableCascadeFallback}
              onChange={(e) =>
                updateField(
                  "enableCascadeFallback",
                  e.target.checked
                )
              }
              className="w-4 h-4"
            />

            <span className="text-sm text-gray-700">
              Enable cascade fallback
            </span>
          </label>
        </section>

        {/* -------------------------------------------------- */}
        {/* Semantic cache */}
        {/* -------------------------------------------------- */}

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Semantic cache
          </h2>

          <p className="text-sm text-gray-500 mb-5">
            Configure how similar a previous request must be
            before the gateway returns a cached response.
          </p>

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Similarity threshold:{" "}
            {Number(
              form.cacheSimilarityThreshold
            ).toFixed(2)}
          </label>

          <input
            type="range"
            min="0.50"
            max="1"
            step="0.01"
            value={form.cacheSimilarityThreshold}
            onChange={(e) =>
              updateField(
                "cacheSimilarityThreshold",
                Number(e.target.value)
              )
            }
            className="w-full"
          />

          <p className="text-xs text-gray-400 mt-1">
            Higher values require more precise matches.
            Lower values increase cache hits but increase
            the risk of returning an incorrect cached answer.
          </p>
        </section>

        {/* -------------------------------------------------- */}
        {/* Save */}
        {/* -------------------------------------------------- */}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save configuration"}
          </button>

          {savedAt && (
            <span className="text-sm text-green-600">
              Saved at{" "}
              {savedAt.toLocaleTimeString()}
            </span>
          )}

          {saveError && (
            <span className="text-sm text-red-600">
              Failed to save: {saveError.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}