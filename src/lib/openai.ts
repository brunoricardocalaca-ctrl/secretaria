export async function getOpenAIEmbedding(text: string, apiKey: string) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            input: text,
            model: "text-embedding-3-small"
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`OpenAI Error: ${err.error?.message || response.statusText}`);
    }

    const { data } = await response.json();
    return data[0].embedding;
}

export async function getOpenAIBatchedEmbeddings(texts: string[], apiKey: string) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            input: texts,
            model: "text-embedding-3-small"
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`OpenAI Error: ${err.error?.message || response.statusText}`);
    }

    const { data } = await response.json();
    return data.map((d: any) => d.embedding);
}
