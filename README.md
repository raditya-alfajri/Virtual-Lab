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
| `src/data/types.ts`            | Tipe data eksperimen (`Experiment`, `ItemDef`, `Zone`, `World`, dll.)           |
| `src/data/instruments.ts`      | Helper bersama untuk data: update state, pembulatan, warna, stopwatch           |
| `src/data/kimia/`, `fisika/`   | Satu file per eksperimen beserta test-nya                                       |
| `src/data/index.ts`            | Daftar semua eksperimen (`ALL_EXPERIMENTS`)                                     |
| `src/lib/engine.ts`            | Mesin lab (fungsi murni `runEngine`)                                            |
| `src/lib/sample-experiment.ts` | Data contoh kecil `sampleK1`, hanya untuk test mesin                            |
| `src/hooks/useExperiment.ts`   | Hook React di atas mesin, termasuk loop waktu                                   |
| `src/pages/`                   | Halaman, nama file PascalCase                                                   |
| `public/img/`                  | Gambar yang dirujuk lewat path teks, misalnya `previewImage: '/img/cairan.jpg'` |

Gambar yang dirujuk dengan path teks di data harus ditaruh di `public/`, bukan `src/assets/`.

## Cara kerja lab (sandbox)

Lab bersifat bebas seperti simulasi PhET: tidak ada langkah berurutan. Siswa menyeret benda, fenomena berjalan bertahap, dan data hanya tercatat saat siswa memakai alat ukur.

### Data eksperimen

- `items`: setiap benda fisik punya id sendiri (`tube-1`, `tube-2`). `kind` adalah jenisnya (`tube`) dan dipakai untuk mencocokkan interaksi. Sifat ilmiah yang tetap disimpan di `props` (`{ ph: 3 }`), state awal di `state`. Benda dengan `fixed: true` tidak bisa diseret tetapi bisa menjadi tujuan.
- `zones`: tempat tetap di meja (rak, neraca, wastafel). `accepts` berisi kind yang boleh ditaruh, `capacity` jumlah maksimum.
- Lokasi benda (`at`) bisa berupa id zona, id benda lain (menempel atau ada di dalamnya, misalnya beban di troli), atau `'shelf'` (rak alat & bahan).
- `interactions`: efek saat benda kind `source` dijatuhkan ke `target` (kind benda, id zona, atau `'shelf'`). `run` mengembalikan `ok(world, { record, explanation, hint })` atau `reject('pesan')`.
- `use`, `pull`, `release`: handler per kind untuk tap pada benda (sakelar, stopwatch, mengaduk) serta menarik dan melepas benda (bandul).
- `guard`: penolakan sebelum benda dipindah, misalnya mengganti tali saat bandul berayun.
- `tick(world, dt)`: proses berbasis waktu. `isActive(world)` menandakan ada proses yang berjalan.
- `view(world)`: tampilan per benda untuk FE. Kunci yang dipakai saat ini: `label`, `color` (hex), `level` (0–1, tinggi isi), `reading` (bacaan alat ukur), `action` (teks tombol tap).
- Semua nilai ilmiah (pH, warna, molaritas, percepatan) dihitung di file data, bukan di komponen FE. Angka diambil dari PRD; nilai yang perlu dicek guru diberi `TODO(cek guru)`.

### Mesin

`runEngine(exp, state, action)` adalah fungsi murni. State berisi `world` (`time` dan lokasi serta state setiap benda), `rows`, `hint`, dan `explanation`.

| Aksi                  | Arti                                                              |
| --------------------- | ----------------------------------------------------------------- |
| `drop { id, target }` | Benda dijatuhkan ke zona, benda lain, atau `'shelf'`              |
| `use { id }`          | Tap pada benda                                                    |
| `pull { id, value }`  | Menarik benda ke nilai tertentu (sudut bandul)                    |
| `release { id }`      | Melepas benda yang ditarik                                        |
| `tick { dt }`         | Waktu maju `dt` detik (dibatasi 0–1 detik), hanya saat `isActive` |
| `removeRow { index }` | Menghapus satu baris tabel                                        |
| `reset`               | Kembali ke kondisi awal                                           |

Urutan `drop`: `guard` → interaksi yang cocok → kembali ke rak (benda dan semua yang menempel padanya kembali bersih) → pindah ke zona (cek `accepts` dan `capacity`) → selain itu ditolak.

- Penolakan menghasilkan `hint: { text, target }` agar FE bisa menampilkannya di dekat zona atau benda tujuan. Hint hilang pada aksi berikutnya yang berhasil.
- Baris tabel hanya berasal dari `record` yang dikembalikan alat ukur, dan baris yang sama tidak dicatat dua kali.
- Mesin tidak memakai timer. Selama tidak ada proses, `tick` mengembalikan state yang sama sehingga tidak ada render ulang.

### Hook

```ts
const lab = useExperiment(exp, speed) // speed: 1 atau 5

lab.items // lokasi dan state setiap benda
lab.view // tampilan per benda, dari exp.view
lab.columns // kolom tabel { key, label }
lab.observationRows
lab.hint // { text, target } | null
lab.explanation // { result, reason, formula? } | null
lab.active // ada proses yang berjalan
lab.drop(id, target)
lab.use(id)
lab.pull(id, value)
lab.release(id)
lab.removeRow(index)
lab.reset()
```

Hook menjalankan `requestAnimationFrame` hanya saat `active`, lalu mengirim `tick` dengan `dt × speed`. Saat eksperimen berganti, pasang ulang komponen dengan `key={exp.id}`.

Playground `/dev/engine` adalah prototipe acuan memakai dnd-kit: seret benda ke tujuan, atau tap benda lalu tap tujuan.
