/** The first number in a name, as in 'Bandul 200 g' → 200 or 'Beban 0,5 kg' → 0.5. */
export function firstNumber(name: string): number {
  const match = /\d+(?:,\d+)?/.exec(name)
  return match ? Number(match[0].replace(',', '.')) : 0
}

/** A name without its first word, as in 'Kipas 2 N' → '2 N'. */
export function amountOf(name: string): string {
  return name.trim().split(/\s+/).slice(1).join(' ')
}
