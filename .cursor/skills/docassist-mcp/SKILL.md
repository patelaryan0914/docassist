---
name: docassist-mcp
description: DocAssist modular documentation skills — use when extending Cursor/MCP workflows for doc selection, Q&A, snippets, and summaries.
---

# DocAssist MCP + skills

DocAssist splits **UI**, **router**, and **skill implementations** so agents and MCP servers can call the same functions the product uses.

## Layout

| Layer | Path |
|--------|------|
| MCP manifests + JSON tool schemas | `client/src/lib/docassist/mcp/` |
| Skill implementations | `client/src/lib/docassist/skills/` |
| Type-safe router | `client/src/lib/docassist/router.ts` → `invokeDocAssistSkill(name, input)` |
| Marketing / demo UI | `client/src/components/landing/` |

## Tools (mirror of MCP `tools/*.json`)

1. **selectDocumentation** — `documentationId`: `stripe` \| `livekit` \| `nextjs`
2. **queryDocumentation** — `documentationId` + `query` (natural language)
3. **generateCodeSnippet** — `documentationId` + `intent` + optional `language`
4. **summarizeDocs** — `documentationId` + optional `sectionHint`

## Agent usage

- From TypeScript in this repo, call:

  `import { invokeDocAssistSkill } from "@/lib/docassist/router"`

- Map each MCP tool name to the same string passed as the first argument (`selectDocumentation`, etc.).
- Extend retrieval by replacing the bodies in `skills/query-documentation.ts` (or wiring them to your backend) without changing the UI contract.

## Stitch MCP

For visual iteration on the landing experience, use the **stitch-design** skill and reference `client/src/components/landing/` as the implementation source of truth after generation.
