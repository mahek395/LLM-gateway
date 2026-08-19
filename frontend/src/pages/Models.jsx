import { useState } from "react";
import { useModels } from "../hooks/useModels";

const EMPTY_FORM = {
    modelId: "",
    providerModelId: "",
    providerLabel: "",
    baseUrl: "",
    apiKey: "",
    inputCostPerM: "",
    outputCostPerM: "",
    capabilityScore: "",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    features: "",
    avgLatencyMs: 600,
    description: "",
};

function formatFeatures(features) {
    if (!Array.isArray(features) || features.length === 0) {
        return "—";
    }

    return features.join(", ");
}

function formatCost(value) {
    const number = Number(value);

    if (Number.isNaN(number)) {
        return "—";
    }

    return `$${number}/M`;
}

export function Models() {
    const {
        models,
        loading,
        error,
        createModel,
        deleteModel,
    } = useModels();

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState(null);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setSaving(true);
        setFormError(null);

        try {
            const payload = {
                modelId: form.modelId.trim(),
                providerModelId: form.providerModelId.trim(),
                providerLabel: form.providerLabel.trim(),
                baseUrl: form.baseUrl.trim(),
                apiKey: form.apiKey,

                inputCostPerM: Number(form.inputCostPerM),
                outputCostPerM: Number(form.outputCostPerM),
                capabilityScore: Number(form.capabilityScore),

                contextWindow: Number(form.contextWindow),
                maxOutputTokens: Number(form.maxOutputTokens),

                features: form.features
                    .split(",")
                    .map((feature) => feature.trim())
                    .filter(Boolean),

                avgLatencyMs: Number(form.avgLatencyMs),
                description: form.description.trim(),
            };

            await createModel(payload);

            setForm(EMPTY_FORM);
            setShowForm(false);
        } catch (err) {
            setFormError(err);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(model) {
        const confirmed = window.confirm(
            `Delete registered model "${model.model_id}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            await deleteModel(model.model_id);
        } catch (err) {
            window.alert(
                err?.message || "Failed to delete model"
            );
        }
    }

    if (loading) {
        return (
            <div className="text-gray-500">
                Loading models...
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Models
                    </h1>

                    <p className="text-sm text-gray-500 mt-1">
                        Manage the models available to HyperRouter.
                    </p>
                </div>

                <button
                    onClick={() => {
                        setShowForm((value) => !value);
                        setFormError(null);
                    }}
                    className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
                >
                    {showForm ? "Cancel" : "Register model"}
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                    Failed to load models: {error.message}
                </div>
            )}

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white border border-gray-200 rounded-lg p-6 mb-6"
                >
                    <h2 className="text-lg font-medium mb-5">
                        Register model
                    </h2>

                    {formError && (
                        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                            {formError.message}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Field
                            label="Model ID"
                            name="modelId"
                            value={form.modelId}
                            onChange={handleChange}
                            placeholder="groq/openai-gpt-oss-20b"
                            required
                        />

                        <Field
                            label="Provider Model ID"
                            name="providerModelId"
                            value={form.providerModelId}
                            onChange={handleChange}
                            placeholder="openai/gpt-oss-20b"
                            required
                        />

                        <Field
                            label="Provider Label"
                            name="providerLabel"
                            value={form.providerLabel}
                            onChange={handleChange}
                            placeholder="groq"
                        />

                        <Field
                            label="Base URL"
                            name="baseUrl"
                            value={form.baseUrl}
                            onChange={handleChange}
                            placeholder="https://api.groq.com/openai/v1"
                            required
                        />

                        <Field
                            label="Provider API Key"
                            name="apiKey"
                            type="password"
                            value={form.apiKey}
                            onChange={handleChange}
                            placeholder="Provider secret"
                            required
                        />

                        <Field
                            label="Input Cost / 1M"
                            name="inputCostPerM"
                            type="number"
                            step="0.000001"
                            min="0"
                            value={form.inputCostPerM}
                            onChange={handleChange}
                            placeholder="0.05"
                            required
                        />

                        <Field
                            label="Output Cost / 1M"
                            name="outputCostPerM"
                            type="number"
                            step="0.000001"
                            min="0"
                            value={form.outputCostPerM}
                            onChange={handleChange}
                            placeholder="0.08"
                            required
                        />

                        <Field
                            label="Capability Score"
                            name="capabilityScore"
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={form.capabilityScore}
                            onChange={handleChange}
                            placeholder="0.55"
                            required
                        />

                        <Field
                            label="Context Window"
                            name="contextWindow"
                            type="number"
                            min="1"
                            value={form.contextWindow}
                            onChange={handleChange}
                            required
                        />

                        <Field
                            label="Max Output Tokens"
                            name="maxOutputTokens"
                            type="number"
                            min="1"
                            value={form.maxOutputTokens}
                            onChange={handleChange}
                            required
                        />

                        <Field
                            label="Average Latency (ms)"
                            name="avgLatencyMs"
                            type="number"
                            min="0"
                            step="0.1"
                            value={form.avgLatencyMs}
                            onChange={handleChange}
                            required
                        />

                        <Field
                            label="Features"
                            name="features"
                            value={form.features}
                            onChange={handleChange}
                            placeholder="tools, json_mode, streaming"
                        />
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>

                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                            placeholder="Short description of this model"
                        />
                    </div>

                    <div className="flex justify-end mt-5">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                        >
                            {saving ? "Registering..." : "Register model"}
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {models.length === 0 ? (
                    <div className="p-10 text-center text-sm text-gray-500">
                        No models are registered yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                                        Model
                                    </th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                                        Provider
                                    </th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                                        Capability
                                    </th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                                        Pricing
                                    </th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                                        Context
                                    </th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                                        Latency
                                    </th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {models.map((model) => (
                                    <tr
                                        key={model.model_id}
                                        className="border-b border-gray-100 last:border-0"
                                    >
                                        <td className="px-4 py-4 align-top">
                                            <div className="font-medium text-gray-900">
                                                {model.model_id}
                                            </div>

                                            <div className="text-xs text-gray-500 mt-1">
                                                Provider ID:{" "}
                                                {model.provider_model_id}
                                            </div>

                                            <div className="text-xs text-gray-400 mt-1">
                                                {model.description || "—"}
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            {model.provider_label || "—"}
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            {Number(model.capability_score).toFixed(2)}
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <div>
                                                In:{" "}
                                                {formatCost(
                                                    model.input_cost_per_m
                                                )}
                                            </div>

                                            <div className="mt-1">
                                                Out:{" "}
                                                {formatCost(
                                                    model.output_cost_per_m
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <div>
                                                {Number(
                                                    model.context_window
                                                ).toLocaleString()}
                                            </div>

                                            <div className="text-xs text-gray-400 mt-1">
                                                max out:{" "}
                                                {Number(
                                                    model.max_output_tokens
                                                ).toLocaleString()}
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            {Math.round(
                                                Number(model.avg_latency_ms)
                                            )}
                                            ms
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <button
                                                onClick={() =>
                                                    handleDelete(model)
                                                }
                                                className="text-red-600 hover:underline"
                                            >
                                                Delete
                                            </button>

                                            <div className="text-xs text-gray-400 mt-2 max-w-40">
                                                {formatFeatures(
                                                    model.features
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function Field({
    label,
    name,
    value,
    onChange,
    type = "text",
    placeholder,
    required = false,
    ...props
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>

            <input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                {...props}
            />
        </div>
    );
}