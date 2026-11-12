function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

const optional = (name: string, fallback: string) =>
  process.env[name] || fallback

/** Read on each use, so a missing key fails the request and not the import. */
export const env = {
  get cloudflareBaseUrl() {
    return optional(
      'CLOUDFLARE_AI_BASE_URL',
      `https://api.cloudflare.com/client/v4/accounts/${required('CLOUDFLARE_ACCOUNT_ID')}/ai`,
    )
  },
  get cloudflareToken() {
    return required('CLOUDFLARE_API_TOKEN')
  },
  get chatModel() {
    return optional('CF_CHAT_MODEL', '@cf/meta/llama-3.3-70b-instruct-fp8-fast')
  },
  /** Identical chat requests raced per turn; the first to stream wins. 1 = off. */
  get chatHedge() {
    return Math.max(1, Number(optional('CF_CHAT_HEDGE', '2')))
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
  /** Replies per day over all visitors; the last line of defence for the API bill. */
  get dailyTurns() {
    return Number(optional('LABI_DAILY_TURNS', '3000'))
  },
  /** Optional shared store for the rate limiter (Upstash Redis REST). */
  get upstash() {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    return url && token ? { url, token } : null
  },
}
