import type { DocAssistSkillName } from "./types"
import {
  generateCodeSnippet,
  queryDocumentation,
  selectDocumentation,
  summarizeDocs,
} from "./skills"

export function invokeDocAssistSkill(
  name: DocAssistSkillName,
  input: unknown
): unknown {
  switch (name) {
    case "selectDocumentation":
      return selectDocumentation(
        input as Parameters<typeof selectDocumentation>[0]
      )
    case "queryDocumentation":
      return queryDocumentation(
        input as Parameters<typeof queryDocumentation>[0]
      )
    case "generateCodeSnippet":
      return generateCodeSnippet(
        input as Parameters<typeof generateCodeSnippet>[0]
      )
    case "summarizeDocs":
      return summarizeDocs(input as Parameters<typeof summarizeDocs>[0])
    default: {
      const _exhaustive: never = name
      return _exhaustive
    }
  }
}
