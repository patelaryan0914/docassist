import type {
  GenerateCodeSnippetInput,
  GenerateCodeSnippetOutput,
} from "../types"

export function generateCodeSnippet(
  input: GenerateCodeSnippetInput
): GenerateCodeSnippetOutput {
  const language = input.language ?? "typescript"

  const code =
    language === "bash"
      ? `curl -sS https://api.example.com/v1/${input.documentationId} \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '${JSON.stringify({ intent: input.intent })}'`
      : `import { createClient } from '@docassist/sdk'

const client = createClient({ documentation: '${input.documentationId}' })

export async function run() {
  const snippet = await client.generateSnippet({
    intent: ${JSON.stringify(input.intent)},
    language: '${language}',
  })
  return snippet.code
}`

  return {
    code,
    language,
    explanation:
      "Modular skill output: wire this to your backend or Cursor MCP router to stream real completions from indexed documentation.",
  }
}
