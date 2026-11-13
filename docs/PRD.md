# PRD Virtual Lab

Versi 1.2, 13 November 2026. Disusun oleh tim Virtual Lab untuk Logicodix 2026.

## 1. Gambaran Singkat

Virtual Lab adalah web praktikum kimia dan fisika untuk siswa SMA. Di dalamnya ada meja lab yang bisa dipakai bebas: siswa menyeret alat dan bahan, melihat prosesnya terjadi pelan-pelan, lalu mengukur hasilnya dengan alat ukur. Data yang didapat langsung masuk ke tabel pengamatan.

Selama praktikum, siswa ditemani Labi, robot asisten lab berbasis AI. Labi membantu di awal, menjawab pertanyaan lewat teks maupun suara, dan menjelaskan apa yang baru saja terjadi di meja lab.

| Item            | Keterangan                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------- |
| Lomba           | Logicodix 2026 Hackathon                                                                     |
| Subtema         | Smart & Fun Education                                                                        |
| Kategori        | Web                                                                                          |
| Tim             | Muhammad Raditya Alfajri (ketua), Muhammad Zidna Fadla, Raihan Khairullah, Raja Aunur Rahman |
| Masa pengerjaan | 7 – 14 November 2026 (code freeze 14 November, 23.59 WIB)                                    |

## 2. Latar Belakang

Praktikum di banyak SMA masih terkendala. Alat dan bahan terbatas, waktunya sempit, dan beberapa bahan berbahaya kalau tidak diawasi. Akibatnya praktikum sering diganti dengan membaca langkah di buku atau menonton video, sehingga siswa tidak benar-benar mencoba.

Saat praktikum berlangsung pun, satu guru biasanya mendampingi satu kelas penuh. Siswa yang bingung jarang sempat bertanya, dan banyak yang hanya mengikuti prosedur tanpa tahu kenapa hasilnya seperti itu.

Kami ingin siswa bisa praktikum kapan saja dari HP atau laptop, mengulang percobaan sebanyak yang mereka mau, dan tetap punya teman belajar yang bisa ditanya.

## 3. Tujuan

1. Siswa bisa melakukan praktikum sendiri dan mendapatkan data dari percobaannya.
2. Siswa memahami alasan di balik hasil percobaan, bukan hanya hafal hasilnya.
3. Praktikum terasa menyenangkan dan mudah diakses dari HP maupun laptop.

Ukuran yang kami pakai saat uji coba dengan 3–5 siswa:

| Yang diukur                                                  | Target           |
| ------------------------------------------------------------ | ---------------- |
| Siswa yang berhasil mendapatkan minimal 3 data tanpa dibantu | 4 dari 5         |
| Siswa yang bisa menyebutkan kesimpulan setelah praktikum     | 4 dari 5         |
| Siswa yang merasa Labi membantu                              | 4 dari 5         |
| Siswa yang menemukan eksperimen dalam 30 detik               | 4 dari 5         |
| Nilai rata-rata "seru dipakai"                               | minimal 4 dari 5 |

## 4. Pengguna

**Raka, 16 tahun, kelas 11.** Sekolahnya jarang praktikum dan ia lebih sering belajar lewat HP. Ia ingin paham materi tanpa harus menghafal.

**Nadia, 15 tahun, kelas 10.** Ia cepat bosan dengan bacaan panjang dan lebih mudah mengerti kalau mencoba sendiri. Ia butuh tempat bertanya saat bingung.

**Bu Sari, guru kimia.** Ia mencari media praktikum yang bisa dipakai di kelas atau diberikan sebagai tugas rumah.

## 5. Ruang Lingkup

**Sudah dikerjakan:**

- Beranda, pilih laboratorium, katalog eksperimen dengan pencarian dan filter topik, serta halaman detail eksperimen.
- Halaman praktikum untuk enam eksperimen: Uji Asam dan Basa, Konsentrasi Larutan, Laju Reaksi, Hukum Newton, Ayunan Sederhana, dan Hukum Hooke.
- Tabel pengamatan otomatis, penjelasan hasil dengan alasan dan rumus, tombol reset, dan kecepatan waktu 1× dan 5×.
- Labi: maskot dengan ekspresi, percakapan berbasis AI, suara masuk dengan tombol tekan-tahan, dan suara keluar.
- Tampilan laptop berupa ruang lab layar penuh dan tampilan HP dengan area kerja.
- Aplikasi online di Vercel dan bisa dijalankan di localhost.

**Tidak dikerjakan:**

- Login, akun, database, dan dashboard guru.
- Kuis, skor, dan riwayat progres.
- Laporan praktikum otomatis.

## 6. Cara Kerja Praktikum

Meja lab bersifat bebas. Tidak ada urutan langkah yang harus diikuti, dan siswa boleh mencoba apa saja yang masuk akal di lab sungguhan.

Aturan yang kami pegang:

1. Semua dilakukan dengan menyeret benda. Di HP cukup ketuk benda, lalu ketuk tujuannya. Tidak ada kolom isian atau slider.
2. Nilai dipilih lewat benda. Misalnya massa dipilih dengan sendok 1 g atau 4 g, konsentrasi dipilih dari botol yang berbeda.
3. Hasil tidak langsung muncul. Warna berubah pelan-pelan, zat larut sambil diaduk, suhu naik saat dipanaskan.
4. Data hanya tercatat kalau siswa memakai alat ukur, seperti kartu pH, neraca, termometer, stopwatch, sensor, atau mistar.
5. Aksi yang tidak mungkin ditolak dengan alasan singkat, misalnya "Satu tabung hanya untuk satu larutan."
6. Setiap hasil disertai penjelasan berisi hasil, alasan, dan rumus.

## 7. Labi, Asisten Lab

### 7.1 Peran Labi

| Saat                 | Yang dilakukan Labi                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Awal praktikum       | Menyapa dan memandu langkah awal sampai data pertama tercatat di tabel                                               |
| Setelah data pertama | Berhenti memberi instruksi. Siswa bebas bereksperimen, dan Labi hanya memberi saran kalau diminta                    |
| Saat ditanya         | Menjawab sesuai isi meja dan tabel, lebih sering memancing dengan pertanyaan balik daripada langsung memberi jawaban |
| Momen penting        | Bereaksi dengan ekspresi dan penjelasan singkat, misalnya saat warna berubah atau data tercatat                      |
| Aksi ditolak         | Menunjukkan ekspresi bingung disertai alasan penolakan                                                               |

Masa panduan hanya berlaku sekali setiap halaman praktikum dibuka, dan tidak muncul lagi setelah reset.

### 7.2 Berbicara dengan Labi

- Siswa bisa mengetik pertanyaan atau menahan tombol "Tahan untuk bicara". Kalimat baru dikirim setelah tombol dilepas, jadi jeda di tengah kalimat tidak memotong pertanyaan.
- Browser meminta izin mikrofon saat tombol pertama kali ditekan. Kalau ditolak, siswa tetap bisa mengetik.
- Jawaban Labi tampil sebagai teks dan dibacakan dengan suara. Suara bisa dimatikan.

### 7.3 Batasan Labi

- Angka hasil selalu berasal dari simulasi. Labi tidak menghitung dan tidak mengarang angka.
- Jawaban singkat dalam bahasa Indonesia, sesuai untuk siswa SMA, dan hanya membahas praktikum yang sedang dibuka.
- Data yang dikirim ke AI hanya konteks praktikum dan pertanyaan siswa. Tidak ada nama, akun, atau data pribadi.
- Suara siswa diubah menjadi teks oleh ElevenLabs dan tidak disimpan oleh aplikasi.
- Ada batas pemakaian per pengunjung, per menit untuk semua pengunjung (bawaan 15), dan per hari (bawaan 400), di bawah batas project Gemini.
- Setiap jawaban diberi label AI, dengan catatan bahwa AI bisa keliru.
- Kalau layanan AI menolak atau gagal, praktikum tetap berjalan dan Labi menampilkan pesan yang sopan.

## 8. Halaman

| Alamat                    | Isi                                  |
| ------------------------- | ------------------------------------ |
| `/`                       | Beranda                              |
| `/lab`                    | Pilih laboratorium                   |
| `/lab/:subject`           | Katalog eksperimen                   |
| `/lab/:subject/:id`       | Detail eksperimen                    |
| `/lab/:subject/:id/mulai` | Praktikum bersama Labi               |
| `/tentang-ai`             | Penjelasan penggunaan AI di aplikasi |

Id eksperimen: `uji-asam-basa`, `konsentrasi-larutan`, `laju-reaksi`, `hukum-newton`, `ayunan-sederhana`, dan `hukum-hooke`.

### Halaman praktikum

**Laptop dan tablet.** Meja lab memenuhi layar. Di kiri atas ada kartu judul dengan tombol kembali, kecepatan, dan reset. Di kanan ada panel melayang dengan tab Penjelasan, Tabel, dan Tanya Labi. Rak alat melayang di bawah sebagai tempat mengembalikan benda. Labi tampil di meja lab dengan balon bicaranya.

**HP.** Meja lab dibagi menjadi beberapa area kerja yang dipilih lewat tab, supaya alat tetap cukup besar untuk disentuh. Benda yang tidak terlihat di area aktif muncul di rak alat bawah. Penjelasan, Tabel, dan Labi ada di panel bawah yang bisa ditarik. Saat HP tegak, muncul saran untuk memutar HP.

## 9. Eksperimen

### 9.1 Uji Asam dan Basa

|                |                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Alat dan bahan | 3 tabung reaksi, pipet tetes, 5 botol larutan, botol indikator universal                                                                    |
| Tempat menaruh | Rak tabung, kartu skala pH, wastafel                                                                                                        |
| Data tercatat  | Saat tabung berindikator dicocokkan ke kartu pH                                                                                             |
| Nilai          | Cuka pH 3, air jeruk pH 4, air suling pH 7, air sabun pH 10, NaOH encer pH 13                                                               |
| Ditolak        | Larutan kedua masuk ke tabung yang sudah berisi, pipet kosong, pipet masih berisi larutan lain, tabung tanpa indikator, warna masih berubah |
| Kolom tabel    | Larutan, warna, pH, sifat                                                                                                                   |

### 9.2 Konsentrasi Larutan

|                |                                                                                                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alat dan bahan | Wadah CuSO₄, sendok 1 g dan 4 g, kaca arloji, botol semprot air suling, gelas ukur 250 mL, gelas kimia, batang pengaduk                                                                         |
| Tempat menaruh | Neraca digital, meja kerja                                                                                                                                                                      |
| Data tercatat  | Saat zat larut sempurna setelah diaduk. Pengenceran menghasilkan data baru                                                                                                                      |
| Rumus          | Mr CuSO₄ = 160, M = (massa ÷ Mr) ÷ volume (L). Contoh: 16 g dalam 100 mL = 1 M                                                                                                                  |
| Ditolak        | Kaca arloji tidak di neraca saat diisi, massa lebih dari 16 g, volume lebih dari 250 mL, air langsung dari botol ke gelas kimia, sendok langsung ke gelas kimia, mengaduk tanpa batang pengaduk |
| Kolom tabel    | Massa, volume, mol, konsentrasi, warna                                                                                                                                                          |

### 9.3 Laju Reaksi

|                |                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alat dan bahan | Labu Erlenmeyer, 4 botol Na₂S₂O₃ (0,05 / 0,1 / 0,15 / 0,2 M), botol HCl, termometer, stopwatch                                                      |
| Benda tetap    | Penangas air dengan sakelar, kertas bertanda silang                                                                                                 |
| Data tercatat  | Saat tanda silang sudah tidak terlihat                                                                                                              |
| Rumus          | t = 60 × (0,2 ÷ C) × 2^(−(T − 25) ÷ 10). Contoh: 0,2 M pada 25 °C = 60 detik                                                                        |
| Catatan        | Suhu naik 0,5 °C per detik sampai maksimal 55 °C. Suhu dikunci saat HCl dituang. Termometer ikut berpindah bersama labu                             |
| Ditolak        | HCl dituang saat labu kosong, tidak di kertas silang, termometer belum terpasang, atau stopwatch belum berjalan. Labu dipindah saat reaksi berjalan |
| Kolom tabel    | Suhu, konsentrasi, waktu, laju relatif (1/t)                                                                                                        |

### 9.4 Hukum Newton

|                |                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Alat dan bahan | Troli 0,5 kg, beban 0,5 kg dan 1 kg (total maksimal 3 kg), kipas pendorong 2 sampai 10 N, sensor gerak |
| Data tercatat  | Saat troli melewati sensor di titik 1 m                                                                |
| Rumus          | a = F ÷ m, dengan a dari pengukuran 2s ÷ t²                                                            |

### 9.5 Ayunan Sederhana

|                |                                                                                    |
| -------------- | ---------------------------------------------------------------------------------- |
| Alat dan bahan | Statif, tali 20 sampai 100 cm, bandul 50, 100, dan 200 g, busur derajat, stopwatch |
| Data tercatat  | Setelah stopwatch menghitung 10 ayunan                                             |
| Rumus          | T = 2π √(L ÷ g), g = 9,8 m/s². Simpangan maksimal 15°                              |
| Kolom tabel    | Panjang tali, massa bandul, waktu 10 ayunan, periode, T²                           |

### 9.6 Hukum Hooke

|                |                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Alat dan bahan | Statif, pegas A (k = 20 N/m) dan pegas B (k = 40 N/m), gantungan, beban 50 g (maksimal 250 g), mistar |
| Data tercatat  | Saat pegas sudah diam dan mistar terpasang                                                            |
| Rumus          | F = m × g, Δx = F ÷ k                                                                                 |

## 10. Rancangan Teknis

### 10.1 Teknologi

React 19, TypeScript, Vite, Tailwind CSS 4, React Router, dnd-kit, Motion, dan Vitest. Endpoint Labi berupa serverless function di Vercel, dan di localhost dijalankan lewat plugin Vite di `dev/api-routes.ts`.

Percakapan Labi memakai Gemini API tingkat gratis dengan model `gemini-3.5-flash-lite` lewat endpoint yang kompatibel dengan OpenAI. Suara masuk memakai ElevenLabs Speech to Text realtime, dan suara keluar memakai ElevenLabs Text to Speech. Pembatas pemakaian bisa memakai Upstash Redis agar hitungannya sama di semua server.

### 10.2 Alur data

```
Siswa menyeret benda
  -> mesin simulasi memeriksa aturan
  -> mesin memperbarui keadaan meja, tabel, dan daftar kejadian
  -> tampilan menggambar ulang meja dan tabel
  -> Labi bereaksi sesuai kejadian

Siswa bertanya ke Labi (teks atau suara)
  -> suara diubah menjadi teks lewat token sekali pakai dari /api/labi/stt-token
  -> aplikasi mengirim konteks praktikum dan pertanyaan ke /api/labi/turn
  -> server memeriksa batas pemakaian, meminta jawaban ke Gemini, lalu membuat suaranya
  -> jawaban tampil di panel dan dibacakan
  -> kalau gagal, Labi memakai mode sederhana
```

### 10.3 Struktur folder

| Folder             | Isi                                                              |
| ------------------ | ---------------------------------------------------------------- |
| `src/data/`        | Data tiap eksperimen: benda, tempat, aturan, rumus, kalimat Labi |
| `src/lib/`         | Mesin simulasi dan logika Labi di sisi browser                   |
| `src/hooks/`       | Penghubung mesin dan Labi ke React                               |
| `src/simulations/` | Posisi benda di meja tiap eksperimen, termasuk area kerja HP     |
| `src/components/`  | Meja lab, aset alat, panel, katalog, detail, dan Labi            |
| `src/pages/`       | Halaman aplikasi                                                 |
| `api/`             | Endpoint Labi: percakapan, token suara, pembatas pemakaian       |
| `dev/`             | Plugin agar `api/` berjalan di server pengembangan               |
| `public/img/lab/`  | Latar meja lab tiap eksperimen                                   |

## 11. Desain

| Bagian         | Ketentuan                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Gaya alat      | Ilustrasi datar dengan garis tepi tebal, kaca terang dengan pantulan putih, cairan berwarna sesuai keadaan |
| Warna utama    | Ungu #7051DC, ungu muda #F0EBFF, latar #FAFAF7, teks #252438                                               |
| Warna meja lab | Dinding #F7FEFF, lantai #CBF3F7, kayu #F0C25F dan #D4A94C                                                  |
| Huruf          | Plus Jakarta Sans untuk judul, Inter untuk teks                                                            |
| Panggung       | 1440 × 1024, diskalakan seragam sehingga tidak pernah gepeng                                               |

## 12. Pembagian Tugas

| Anggota                  | Bagian                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Muhammad Raditya Alfajri | Setup repo dan CI, mesin simulasi, data kimia, halaman praktikum dan adegan kimia, integrasi Gemini, dokumentasi |
| Muhammad Zidna Fadla     | Data dan adegan fisika, tata letak lab layar penuh, Labi (AI, suara, maskot), tampilan HP                        |
| Raihan Khairullah        | Katalog dan Detail eksperimen                                                                                    |
| Raja Aunur Rahman        | Beranda dan Pilih Laboratorium                                                                                   |

## 13. Aturan Tim

1. Repo dibuat baru setelah kick-off. Tidak ada kode dari prototipe yang dipakai.
2. Setiap anggota commit dari akun GitHub yang terdaftar.
3. Pesan commit diawali `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, atau `chore:`.
4. Pull request digabung dengan merge commit. Tidak boleh squash, rebase, force push, atau menghapus commit.
5. Format, lint, test, dan build harus lolos sebelum merge.
6. Kunci API hanya di `.env` dan pengaturan Vercel, tidak pernah ditulis di kode.
7. Setiap anggota harus bisa menjelaskan kode yang ia tulis.

## 14. Kebutuhan Lain

| Aspek       | Target                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| Kecepatan   | Halaman terbuka kurang dari 3 detik, animasi lancar, jawaban Labi mulai terdengar dalam beberapa detik       |
| Tampilan    | Rapi dari lebar 360 px sampai 1440 px                                                                        |
| Keterbacaan | Teks minimal 14 px, kontras cukup, warna selalu disertai angka atau label                                    |
| Keamanan    | Kunci API hanya di server, token suara sekali pakai, input dibatasi, izin mikrofon hanya untuk situs sendiri |
| Privasi     | Tanpa akun dan tanpa data pribadi, percakapan dan suara tidak disimpan                                       |
| Keandalan   | Unit test untuk mesin, keenam eksperimen, dan Labi; CI harus lolos sebelum merge                             |

## 15. Risiko

| Risiko                            | Antisipasi                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| Kuota Gemini habis saat penilaian | Batas per menit dan per hari di bawah batas project, mode sederhana saat ditolak          |
| Kredit ElevenLabs habis           | Pemakaian suara dibatasi, dan Labi tetap bisa dipakai lewat teks                          |
| Jawaban AI keliru                 | Angka selalu dari simulasi, instruksi yang ketat, dan label di setiap jawaban             |
| Koneksi buruk saat demo           | Praktikum berjalan penuh tanpa AI                                                         |
| Nilai materi kurang tepat         | Nilai yang perlu dicek ditandai `TODO(cek guru)` di kode dan diperiksa sebelum submission |

## 16. Status

| Bagian                           | Status                            |
| -------------------------------- | --------------------------------- |
| Enam eksperimen di laptop dan HP | Selesai                           |
| Labi dengan Gemini dan suara     | Selesai                           |
| README dan PRD                   | Selesai                           |
| Halaman Tentang AI               | Dalam pengerjaan                  |
| Uji coba dengan siswa            | Dalam pengerjaan                  |
| Video demo dan submission        | Jumat dan Sabtu, 13 – 14 November |
