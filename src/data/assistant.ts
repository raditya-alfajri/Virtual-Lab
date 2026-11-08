import type { Row } from './types'

export type AssistantStage = 'tebak' | 'amati' | 'simpulkan'

export type AssistantRequest = {
  experimentid: string
  stage: AssistantStage
  prediction?: string
  rows: Row[]
  question?: string
  studentAnswer?: string
  lastHint?: string
}

export type AssistantResponse = {
  reply: string
  mode: 'ai' | 'fallback'
}
