function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

const optional = (name: string, fallback: string) =>
  process.env[name] || fallback

/** Read on each use, so a missing key fails the request and not the import. */
export const env = {
  get geminiKey() {
    return required('GEMINI_API_KEY')
  },
  get geminiBaseUrl() {
    return optional(
      'GEMINI_BASE_URL',
      'https://generativelanguage.googleapis.com/v1beta/openai',
    ).replace(/\/+$/, '')
  },
  get chatModel() {
    return required('GEMINI_MODEL')
  },
  /** Sent as `reasoning_effort` only when set; little thinking keeps spoken replies quick. */
  get reasoningEffort() {
    return process.env.GEMINI_REASONING_EFFORT || undefined
  },
  get elevenLabsKey() {
    return required('ELEVENLABS_API_KEY')
  },
  get voiceId() {
    return optional('ELEVENLABS_VOICE_ID', 'cgSgspJ2msm6clMCkdW9')
  },
  get ttsModel() {
    return optional('ELEVENLABS_TTS_MODEL', 'eleven_flash_v2_5')
  },
  get sttModel() {
    return optional('ELEVENLABS_STT_MODEL', 'scribe_v2_realtime')
  },
  /** Replies per day over all visitors; kept under the Gemini free tier's daily quota. */
  get dailyTurns() {
    return Number(optional('LABI_DAILY_TURNS', '400'))
  },
  /** Replies per minute over all visitors; kept under the Gemini project's per-minute quota. */
  get globalRpm() {
    return Number(optional('LABI_GLOBAL_RPM', '15'))
  },
  /** Optional shared store for the rate limiter (Upstash Redis REST). */
  get upstash() {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    return url && token ? { url, token } : null
  },
}
