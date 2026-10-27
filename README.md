# Virtual Lab

Laboratorium virtual berbasis web untuk praktikum kimia dan fisika.

## Menjalankan

```bash
npm install
npm run dev      # server pengembangan
npm test         # unit test (Vitest)
npm run lint     # ESLint
npm run format   # Prettier, jalankan sebelum membuat pull request
npm run build    # build produksi
```

Halaman `/dev/engine` hanya tersedia saat `npm run dev`, untuk mencoba mesin eksperimen secara manual.

## Struktur

| Folder                         | Isi                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `src/data/types.ts`            | Tipe data eksperimen (`Experiment`, `Step`, dll.)                               |
| `src/lib/engine.ts`            | Mesin eksperimen (fungsi murni `runEngine`)                                     |
| `src/lib/sample-experiment.ts` | Contoh data eksperimen `sampleK1`, dipakai test dan halaman dev                 |
| `src/hooks/useExperiment.ts`   | Hook React di atas mesin                                                        |
| `src/pages/`                   | Halaman, nama file PascalCase                                                   |
| `public/img/`                  | Gambar yang dirujuk lewat path teks, misalnya `previewImage: '/img/cairan.jpg'` |

Gambar yang dirujuk dengan path teks di data harus ditaruh di `public/`, bukan `src/assets/`.

## Aturan menulis langkah eksperimen

- Langkah dengan `compute: true` mencatat satu baris pengamatan, lalu **selalu melompat kembali** ke langkah `repeatFrom` (atau ke langkah sebelumnya jika `repeatFrom` tidak diisi). Karena itu, langkah compute harus menjadi **akhir dari satu siklus percobaan**.
- Jika langkah terakhir bukan compute, setelah langkah itu eksperimen ditandai selesai dan kembali ke langkah pertama.
