import { createGroq } from "@ai-sdk/groq"

export function resolveModel(
    provider: string,
    model: string
) {
    if (provider !== "groq") {
        throw new Error("Unsupported provider")
    }
    const client = createGroq({ apiKey: process.env.GROQ_API_KEY })
    return client(model)
}
