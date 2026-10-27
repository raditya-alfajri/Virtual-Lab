import type { Experiment } from './types'
import { sampleK1 } from '../lib/sample-experiment'

// Sementara berisi data contoh. Ganti dengan data asli saat file K1–K3 dan F1–F3 sudah ada,
// misalnya: import { acidBaseTest } from './kimia/acid-base-test'
export const ALL_EXPERIMENTS: Experiment[] = [sampleK1]
