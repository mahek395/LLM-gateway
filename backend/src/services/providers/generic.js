export async function callGeneric({
    model,
    providerModelId,
    baseUrl,
    apiKey,
    messages,
    temperature,
    maxTokens,
    tools,
}) {
    const providerModel = providerModelId || model;

    const response = await fetch(
        `${baseUrl.replace(/\/$/, "")}/chat/completions`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: providerModel,
                messages,

                ...(temperature !== undefined && {
                    temperature,
                }),

                ...(maxTokens !== undefined && {
                    max_tokens: maxTokens,
                }),

                ...(tools?.length && {
                    tools,
                }),
            }),
        }
    );

    if (!response.ok) {
        const errBody = await response.text().catch(() => "");

        throw new Error(
            `Provider HTTP ${response.status}: ${errBody.slice(0, 300)}`
        );
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (!choice?.message?.content) {
        throw new Error(
            "Provider response missing choices[0].message.content"
        );
    }

    return {
        text: choice.message.content,
        promptTokens: data.usage?.prompt_tokens ?? null,
        completionTokens: data.usage?.completion_tokens ?? null,
    };
}