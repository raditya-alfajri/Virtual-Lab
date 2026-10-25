export type Langkah = { id: string; instruksi: string; aksiBenar: string }

export type Experimen = {
id: string
  judul: string
  pelajaran: 'kimia' | 'fisika'
  topik: string
  kesulitan: 'Pemula' | 'Menengah'
  mode: string
  ringkasan: string
  deskripsi: string
  gambarPratinjau: string
  tujuan: string[]
  alatBahan: string[]
  langkah: Langkah[]
  tips: string[]
  aturan: (input: Record<string, number>) => Record<string, number | string>
  kolomPengamatan: string[]
}