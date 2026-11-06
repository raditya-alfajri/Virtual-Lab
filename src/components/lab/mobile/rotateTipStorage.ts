const KEY = 'virtual-lab:rotate-tip-seen'

export function rotateTipSeen(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

// Dipanggil saat petunjuk ditutup atau HP sudah diputar ke lanskap.
export function markRotateTipSeen() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // Penyimpanan diblokir: petunjuk muncul lagi lain kali, tidak masalah.
  }
}
