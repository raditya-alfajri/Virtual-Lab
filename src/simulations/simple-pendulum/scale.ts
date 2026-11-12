/** F2 stage scale: 5 px per cm, so a 100 cm string is 500 px long. */
export const PX_PER_M = 500

/** The bob's ball diameter (px) for its mass (g). */
export function bobDiameter(mass: number): number {
  if (mass <= 50) return 28
  if (mass <= 100) return 34
  return 42
}
