export type Input = Record<string, number | string>

export type Step = {
  id: string
  instruction: string
  correctAction: string
  explanation: string
  compute?: boolean
  repeatFrom?: string
}

export type RuleResult = {
  values: Record<string, number | string>
  explanation: string
}

export type Concept = { title: string; content: string; formula?: string }

export type Experiment = {
  id: string
  title: string
  subject: 'kimia' | 'fisika'
  topic: string
  summary: string
  description: string
  previewImage: string
  objectives: string[]
  materials: string[]
  steps: Step[]
  tips: string[]
  rule: (input: Input) => RuleResult
  observationColumns: string[]
  concepts: Concept[]
}
