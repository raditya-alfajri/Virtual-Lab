export type Rect = { x: number; y: number; w: number; h: number }

export type SceneLayout = {
  background: string
  stage: { width: number; height: number }
  // Posisi awal tiap benda (saat berada di rak alat & bahan).
  home: Record<string, Rect>
  // Area jatuh, sekaligus posisi benda saat berada di zona itu.
  zones: Record<string, Rect>
}
