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

function formatCost(value) {
    const number = Number(value);
    return Number.isFinite(number)
        ? `$${number}/M`
        : "—";
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
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState(null);

    function openCreate() {
        setEditing(false);
        setForm(EMPTY_FORM);
        setFormError(null);
        setShowForm(true);
    }

    function openEdit(model) {
        setEditing(true);
        setFormError(null);

        setForm({
            modelId: model.model_id,
            providerModelId: model.provider_model_id ?? "",
            providerLabel: model.provider_label ?? "",
            baseUrl: model.base_url ?? "",
            apiKey: "",
            inputCostPerM: model.input_cost_per_m ?? "",
            outputCostPerM: model.output_cost_per_m ?? "",
            capabilityScore: model.capability_score ?? "",
            contextWindow: model.context_window ?? 128000,
            maxOutputTokens: model.max_output_tokens ?? 4096,
            features: Array.isArray(model.features)
                ? model.features.join(", ")
                : "",
            avgLatencyMs: model.avg_latency_ms ?? 600,
            description: model.description ?? "",
        });

        setShowForm(true);
    }

    function closeForm() {
        if (saving) return;

        setShowForm(false);
        setEditing(false);
        setForm(EMPTY_FORM);
        setFormError(null);
    }

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
            if (
                Number(form.capabilityScore) < 0 ||
                Number(form.capabilityScore) > 1
            ) {
                throw new Error(
                    "Capability score must be between 0 and 1."
                );
            }

            const payload = {
                modelId: form.modelId.trim(),
                providerModelId:
                    form.providerModelId.trim(),
                providerLabel:
                    form.providerLabel.trim(),
                baseUrl: form.baseUrl.trim(),

                // Empty on edit means keep existing secret.
                ...(form.apiKey.trim()
                    ? { apiKey: form.apiKey.trim() }
                    : {}),

                inputCostPerM: Number(
                    form.inputCostPerM
                ),
                outputCostPerM: Number(
                    form.outputCostPerM
                ),
                capabilityScore: Number(
                    form.capabilityScore
                ),

                contextWindow: Number(
                    form.contextWindow
                ),
                maxOutputTokens: Number(
                    form.maxOutputTokens
                ),

                features: form.features
                    .split(",")
                    .map((feature) => feature.trim())
                    .filter(Boolean),

                avgLatencyMs: Number(
                    form.avgLatencyMs
                ),

                description: form.description.trim(),
            };

            await createModel(payload);

            closeForm();
        } catch (err) {
            setFormError(err);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(model) {
        const confirmed = window.confirm(
            `Delete "${model.model_id}"?\n\nThis removes it from the routing pool.`
        );

        if (!confirmed) return;

        try {
            await deleteModel(model.model_id);
        } catch (err) {
            window.alert(
                err?.message || "Failed to delete model."
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
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Models
                    </h1>

                    <p className="text-sm text-gray-500 mt-1">
                        Manage the models available to
                        HyperRouter.
                    </p>
                </div>

                <button
                    onClick={showForm ? closeForm : openCreate}
                    className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
                >
                    {showForm
                        ? "Close"
                        : "Register model"}
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                    Failed to load models:{" "}
                    {error.message}
                </div>
            )}

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white border border-gray-200 rounded-lg p-6 mb-6"
                >
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-lg font-semibold">
                                {editing
                                    ? "Edit model"
                                    : "Register model"}
                            </h2>

                            <p className="text-xs text-gray-500 mt-1">
                                {editing
                                    ? "Leave API key empty to keep the existing key."
                                    : "Provider credentials are encrypted before storage."}
                            </p>
                        </div>
                    </div>

                    {formError && (
                        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                            {formError.message}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                            label="Model ID"
                            name="modelId"
                            value={form.modelId}
                            onChange={handleChange}
                            placeholder="groq/openai-gpt-oss-20b"
                            required
                            disabled={editing}
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
                            label="Provider"
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
                            label={
                                editing
                                    ? "Provider API Key (optional)"
                                    : "Provider API Key"
                            }
                            name="apiKey"
                            type="password"
                            value={form.apiKey}
                            onChange={handleChange}
                            placeholder={
                                editing
                                    ? "Leave blank to keep current key"
                                    : "Provider secret"
                            }
                            required={!editing}
                        />

                        <Field
                            label="Input cost / 1M"
                            name="inputCostPerM"
                            type="number"
                            step="0.000001"
                            min="0"
                            value={form.inputCostPerM}
                            onChange={handleChange}
                            required
                        />

                        <Field
                            label="Output cost / 1M"
                            name="outputCostPerM"
                            type="number"
                            step="0.000001"
                            min="0"
                            value={form.outputCostPerM}
                            onChange={handleChange}
                            required
                        />

                        <Field
                            label="Capability score"
                            name="capabilityScore"
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={form.capabilityScore}
                            onChange={handleChange}
                            required
                        />

                        <Field
                            label="Context window"
                            name="contextWindow"
                            type="number"
                            min="1"
                            value={form.contextWindow}
                            onChange={handleChange}
                            required
                        />

                        <Field
                            label="Max output tokens"
                            name="maxOutputTokens"
                            type="number"
                            min="1"
                            value={form.maxOutputTokens}
                            onChange={handleChange}
                            required
                        />

                        <Field
                            label="Average latency (ms)"
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
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            placeholder="Short description"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-5">
                        <button
                            type="button"
                            onClick={closeForm}
                            disabled={saving}
                            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                        >
                            {saving
                                ? "Saving..."
                                : editing
                                    ? "Save changes"
                                    : "Register model"}
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
                                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
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
                                            {Number(
                                                model.capability_score
                                            ).toFixed(2)}
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
                                            {Number(
                                                model.context_window
                                            ).toLocaleString()}
                                            <div className="text-xs text-gray-400 mt-1">
                                                max out:{" "}
                                                {Number(
                                                    model.max_output_tokens
                                                ).toLocaleString()}
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            {Math.round(
                                                Number(
                                                    model.avg_latency_ms
                                                )
                                            )}
                                            ms
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() =>
                                                        openEdit(model)
                                                    }
                                                    className="text-gray-700 hover:underline"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleDelete(model)
                                                    }
                                                    className="text-red-600 hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            </div>

                                            <div className="text-xs text-gray-400 mt-2 max-w-44">
                                                {Array.isArray(
                                                    model.features
                                                ) &&
                                                    model.features.length
                                                    ? model.features.join(", ")
                                                    : "No features"}
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
    disabled = false,
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
                disabled={disabled}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm ${disabled
                        ? "bg-gray-100 text-gray-500"
                        : ""
                    }`}
            />
        </div>
    );
}