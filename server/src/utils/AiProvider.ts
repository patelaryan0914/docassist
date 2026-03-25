import { createOpenAI } from "@ai-sdk/openai"
import { createGroq } from "@ai-sdk/groq"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

export function resolveModel(
    provider: string,
    model: string
) {
    switch (provider) {
        case "openai": {
            const client = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
            return client(model)
        }

        case "groq": {
            const client = createGroq({ apiKey: process.env.GROQ_API_KEY })
            return client(model)
        }

        case "anthropic": {
            const client = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
            return client(model)
        }

        case "google": {
            const client = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY })
            return client(model)
        }

        default:
            throw new Error("Unsupported provider")
    }
}