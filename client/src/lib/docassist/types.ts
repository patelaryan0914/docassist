export type DocSlug =
  | "stripe"
  | "livekit"
  | "firebase"
  | "openai"
  | "nextjs"

export type SelectDocumentationInput = {
  documentationId: DocSlug
}

export type SelectDocumentationOutput = {
  ok: true
  documentationId: DocSlug
  label: string
  indexUrl: string
}

export type QueryDocumentationInput = {
  documentationId: DocSlug
  query: string
}

export type SourceRef = {
  title: string
  url: string
}

export type QueryDocumentationOutput = {
  answer: string
  sources: SourceRef[]
  suggestedCode?: string
  codeLanguage?: string
}

export type GenerateCodeSnippetInput = {
  documentationId: DocSlug
  intent: string
  language?: "typescript" | "javascript" | "python" | "bash"
}

export type GenerateCodeSnippetOutput = {
  code: string
  language: string
  explanation: string
}

export type SummarizeDocsInput = {
  documentationId: DocSlug
  sectionHint?: string
}

export type SummarizeDocsOutput = {
  summary: string
  bulletPoints: string[]
}

export type DocAssistSkillName =
  | "selectDocumentation"
  | "queryDocumentation"
  | "generateCodeSnippet"
  | "summarizeDocs"
