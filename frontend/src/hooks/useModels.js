import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export function useModels() {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(() => {
        setLoading(true);
        setError(null);

        return api
            .get("/admin/models")
            .then(setModels)
            .catch((err) => {
                setError(err);
                throw err;
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        refresh().catch(() => { });
    }, [refresh]);

    async function createModel(model) {
        const result = await api.post(
            "/admin/models",
            model
        );

        await refresh();

        return result;
    }

    async function deleteModel(modelId) {
        await api.delete(
            `/admin/models/${encodeURIComponent(modelId)}`
        );

        await refresh();
    }

    return {
        models,
        loading,
        error,
        refresh,
        createModel,
        deleteModel,
    };
}