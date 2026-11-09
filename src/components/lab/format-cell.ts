import type { Value } from '../../data/types'

export function formatCell(value: Value | undefined): string {
  if (value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak'
  if (typeof value === 'number') {
    return value.toLocaleString('id-ID', { maximumFractionDigits: 4 })
  }
  return value
}
