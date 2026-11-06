export type Rect = { x: number; y: number; w: number; h: number }

// Posisi benda yang menempel pada benda lain, relatif terhadap pojok kiri atas
// kotak induknya. Ukuran default sama dengan kotak home benda itu. `rotate`
// dalam derajat (searah jarum jam), diputar dari tengah kotak. `labelSide`
// menggantikan sisi label benda selama menempel di induk ini.
export type Offset = {
  x: number
  y: number
  w?: number
  h?: number
  rotate?: number
  labelSide?: LabelSide
}

export type LabelSide = 'top' | 'bottom' | 'left' | 'right'

// Satu area kerja di mode HP: bagian panggung yang diperbesar dan ditampilkan
// sendiri (mis. meja timbang), dalam koordinat panggung.
export type MobileView = { id: string; label: string; region: Rect }

export type SceneLayout = {
  background: string
  stage: { width: number; height: number }
  // Posisi awal tiap benda (saat berada di rak alat & bahan).
  home: Record<string, Rect>
  // Area jatuh, sekaligus posisi benda saat berada di zona itu.
  zones: Record<string, Rect>
  // Zona yang menampung banyak benda sekaligus (mis. meja kerja). Benda di
  // zona ini memakai posisi khususnya di sini, atau posisi home kalau tidak ada.
  spread?: Record<string, Record<string, Rect>>
  // attach[anak][induk]: posisi benda saat menempel pada benda lain.
  attach?: Record<string, Record<string, Offset>>
  // Layar yang menampilkan `reading` benda yang berada di zona itu
  // (mis. layar neraca untuk kaca arloji di zona balance).
  displays?: Record<string, Rect>
  // Sisi tempat label benda ditampilkan. Default: di bawah benda.
  labelSide?: Record<string, LabelSide>
  // Sisi tombol aksi (mis. Aduk, Nyalakan) saat benda tidak menempel pada
  // benda lain. Default dan untuk benda yang menempel: di atas benda.
  actionSide?: Record<string, LabelSide>
  // Mode HP (< 768 px): adegan dibagi menjadi area kerja yang tampil satu per
  // satu, urut sesuai tab. Tanpa ini, adegan utuh diskalakan seperti di desktop.
  // `actionSide` menggantikan sisi tombol aksi di mode HP, tempat tombol
  // diperbesar agar mudah disentuh dan bisa keluar dari panggung.
  mobile?: {
    views: MobileView[]
    actionSide?: Record<string, LabelSide>
  }
}
