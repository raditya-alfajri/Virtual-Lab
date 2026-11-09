# PRD Virtual Lab

Versi 4.0, 7 November 2026. Disusun oleh tim Virtual Lab untuk Logicodix 2026.

## 1. Gambaran Singkat

Virtual Lab adalah web praktikum kimia untuk siswa SMA. Di dalamnya ada meja lab yang bisa dipakai bebas: siswa menyeret alat dan bahan, melihat reaksinya terjadi pelan-pelan, lalu mengukur hasilnya dengan alat ukur. Data yang didapat langsung masuk ke tabel pengamatan.

Selama praktikum, siswa ditemani Labi, robot asisten lab. Labi mengajak siswa menebak hasil sebelum mencoba, menjawab pertanyaan saat praktikum berjalan, dan membantu menyimpulkan setelah data terkumpul. Di momen-momen tertentu Labi juga berbicara untuk menjelaskan apa yang baru saja terjadi.

| Item                 | Keterangan                                                |
| -------------------- | --------------------------------------------------------- |
| Lomba                | Logicodix 2026 Hackathon                                  |
| Subtema              | Smart & Fun Education                                     |
| Kategori             | Web                                                       |
| Tim                  | 4 orang                                                   |
| Masa pengerjaan      | 7 – 14 November 2026 (code freeze 14 November, 23.59 WIB) |
| Target aplikasi jadi | Selasa, 10 November 2026                                  |
| Batas internal       | Jumat, 13 November 2026                                   |

## 2. Latar Belakang

Praktikum kimia di banyak SMA masih terkendala. Alat dan bahan terbatas, waktunya sempit, dan beberapa bahan berbahaya kalau tidak diawasi. Akibatnya praktikum sering diganti dengan membaca langkah di buku atau menonton video, sehingga siswa tidak benar-benar mencoba.

Saat praktikum berlangsung pun, satu guru biasanya mendampingi satu kelas penuh. Siswa yang bingung jarang sempat bertanya, dan banyak yang hanya mengikuti prosedur tanpa tahu kenapa hasilnya seperti itu.

Kami ingin siswa bisa praktikum kapan saja dari HP atau laptop, mengulang percobaan sebanyak yang mereka mau, dan tetap punya teman belajar yang bisa ditanya.

## 3. Tujuan

1. Siswa bisa melakukan praktikum sendiri dan mendapatkan data dari percobaannya.
2. Siswa memahami alasan di balik hasil percobaan, bukan hanya hafal hasilnya.
3. Praktikum terasa menyenangkan dan mudah diakses dari HP.

Ukuran yang kami pakai saat uji coba dengan 3–5 siswa:

| Yang diukur                                                  | Target           |
| ------------------------------------------------------------ | ---------------- |
| Siswa yang berhasil mendapatkan minimal 3 data tanpa dibantu | 4 dari 5         |
| Siswa yang bisa menyebutkan kesimpulan setelah praktikum     | 4 dari 5         |
| Siswa yang merasa Labi membantu                              | 4 dari 5         |
| Siswa yang menemukan eksperimen dalam 30 detik               | 4 dari 5         |
| Nilai rata-rata "seru dipakai"                               | minimal 4 dari 5 |

## 4. Pengguna

**Raka, 16 tahun, kelas 11.** Sekolahnya jarang praktikum dan ia lebih sering belajar lewat HP. Ia ingin paham materi asam-basa tanpa harus menghafal.

**Nadia, 15 tahun, kelas 10.** Ia cepat bosan dengan bacaan panjang dan lebih mudah mengerti kalau mencoba sendiri. Ia butuh tempat bertanya saat bingung.

**Bu Sari, guru kimia.** Ia mencari media praktikum yang bisa dipakai di kelas atau diberikan sebagai tugas rumah.

## 5. Ruang Lingkup

**Dikerjakan minggu ini:**

- Beranda, pilih laboratorium, katalog eksperimen (pencarian dan filter topik), dan halaman detail eksperimen.
- Halaman praktikum untuk tiga eksperimen: Uji Asam & Basa, Konsentrasi Larutan, dan Laju Reaksi.
- Tabel pengamatan yang terisi otomatis, panel penjelasan, tombol reset, dan pengatur kecepatan waktu (1× dan 5×).
- Labi: maskot dengan ekspresi, panel tanya-jawab berbasis AI, dan suara di momen penting.
- Halaman Tentang AI.
- Tampilan untuk laptop dan HP.
- Aplikasi online di Vercel dan bisa dijalankan di localhost.

**Dikerjakan kalau masih ada waktu:**

- Eksperimen Hukum Newton.
- Laporan praktikum yang disusun otomatis dari tabel dan jawaban siswa.

**Tidak dikerjakan:**

- Login, akun, database, dan dashboard guru.
- Kuis, skor, dan riwayat progres.
- Eksperimen fisika selain Hukum Newton. Eksperimen ini tetap muncul di katalog dengan label "Segera hadir".

## 6. Cara Kerja Praktikum

Meja lab bersifat bebas. Tidak ada urutan langkah yang harus diikuti, dan siswa boleh mencoba apa saja yang masuk akal di lab sungguhan.

Beberapa aturan yang kami pegang:

1. Semua dilakukan dengan menyeret benda (di HP: ketuk benda, lalu ketuk tujuannya). Tidak ada kolom isian atau slider.
2. Nilai dipilih lewat benda. Misalnya massa dipilih dengan sendok 1 g atau 4 g, konsentrasi dipilih dari botol yang berbeda.
3. Hasil tidak langsung muncul. Warna berubah pelan-pelan, zat larut sambil diaduk, suhu naik saat dipanaskan.
4. Data hanya tercatat kalau siswa memakai alat ukur, seperti kartu pH, neraca, termometer, atau stopwatch.
5. Kalau siswa melakukan sesuatu yang tidak mungkin, aksinya ditolak dengan alasan singkat. Contohnya: "Satu tabung hanya untuk satu larutan."
6. Setiap hasil disertai penjelasan.

## 7. Labi, Asisten Lab

### 7.1 Tiga tahap belajar

| Tahap     | Waktu                 | Yang dilakukan Labi                                                                                                                                         |
| --------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tebak     | Saat praktikum dibuka | Menanyakan dugaan siswa, misalnya "Menurutmu cuka asam, basa, atau netral? Kenapa?" Jawaban siswa disimpan dan ditampilkan sebagai pengingat.               |
| Amati     | Selama praktikum      | Menjawab pertanyaan siswa sesuai isi meja dan tabel. Labi lebih sering memancing dengan pertanyaan balik daripada langsung memberi jawaban.                 |
| Simpulkan | Setelah ada data      | Membandingkan dugaan dengan hasil, lalu meminta siswa menjelaskan dengan kata-katanya sendiri. Labi memberi tanggapan dan meluruskan kalau ada yang keliru. |

### 7.2 Batasan Labi

- Angka hasil (pH, konsentrasi, waktu) selalu berasal dari simulasi. Labi tidak menghitung dan tidak mengarang angka.
- Jawaban dalam bahasa Indonesia, singkat, dan sesuai untuk siswa SMA.
- Labi hanya membahas praktikum yang sedang dibuka dan materi terkait.
- Data yang dikirim ke AI hanya: nama dan tujuan eksperimen, isi tabel, dugaan dan jawaban siswa, serta pertanyaan siswa. Tidak ada nama, akun, atau data pribadi lain.
- Maksimal 10 pertanyaan per sesi, dengan panjang pertanyaan maksimal 300 karakter.
- Percakapan tidak disimpan di server.
- Setiap jawaban AI diberi label, dan di bawah panel ada catatan: "Jawaban AI bisa keliru. Angka hasil berasal dari simulasi."

Kalau layanan AI sedang tidak bisa dipakai, praktikum tetap berjalan normal. Labi beralih ke mode sederhana: membandingkan dugaan dengan hasil di tabel dan menampilkan penjelasan yang sudah disiapkan untuk eksperimen tersebut.

### 7.3 Ekspresi dan suara

Labi tidak berbicara di setiap aksi. Sebagian besar waktu Labi hanya berekspresi, dan baru berbicara di momen yang penting.

| Kejadian                                                    | Reaksi Labi                                                                   | Bersuara              |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------- |
| Ada perubahan penting (warna berubah, zat larut, suhu naik) | Kagum, lalu menjelaskan kenapa itu terjadi dan menyarankan langkah berikutnya | Ya                    |
| Proses sedang berjalan dan siswa perlu menunggu             | Menunggu, lalu memberi tahu apa yang perlu diperhatikan                       | Ya, sekali per proses |
| Data tercatat di tabel                                      | Senang, lalu menjelaskan arti hasilnya                                        | Ya                    |
| Aksi berhasil                                               | Kagum sebentar                                                                | Tidak                 |
| Aksi ditolak                                                | Bingung, disertai teks alasan                                                 | Tidak                 |

Aturan suara:

- Hanya satu suara dalam satu waktu. Kalau Labi sedang berbicara, kalimat baru dilewati.
- Ada jeda beberapa detik di antara suara.
- Teks kalimat selalu tampil di balon bicara Labi.
- Ada tombol untuk mematikan suara.
- Kalimat tetap direkam sekali dengan ElevenLabs dan disimpan sebagai file audio. Kalau file tidak tersedia, aplikasi memakai suara bawaan browser.
- Aplikasi tidak merekam suara siswa.

Kalimat Labi selalu terdiri dari tiga bagian: apa yang terjadi, kenapa itu terjadi, dan saran langkah berikutnya. Panjangnya sekitar 25–35 kata.

**Uji Asam & Basa**

| Momen                                      | Kalimat                                                                                                                                                    |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Warna berubah setelah indikator diteteskan | "Warnanya berubah! Indikator universal adalah campuran pewarna yang warnanya mengikuti tingkat keasaman larutan. Coba cocokkan tabungnya dengan kartu pH." |
| Hasil cuka                                 | "pH 3, cuka bersifat asam karena mengandung banyak ion H⁺ dari asam asetat. Coba uji larutan lain dan bandingkan warnanya."                                |
| Hasil air jeruk                            | "pH 4, air jeruk bersifat asam karena mengandung asam sitrat. Menurutmu, mana yang lebih asam, cuka atau air jeruk?"                                       |
| Hasil air suling                           | "pH 7, air suling bersifat netral karena jumlah ion H⁺ dan OH⁻-nya seimbang. Coba sekarang larutan yang menurutmu basa."                                   |
| Hasil air sabun                            | "pH 10, air sabun bersifat basa karena lebih banyak mengandung ion OH⁻. Itu sebabnya sabun terasa licin di tangan."                                        |
| Hasil NaOH encer                           | "pH 13, NaOH bersifat basa kuat karena melepaskan banyak ion OH⁻ di air. Lihat tabelmu, larutan mana yang paling asam dan paling basa?"                    |

**Konsentrasi Larutan**

| Momen          | Kalimat                                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mulai mengaduk | "Kristal CuSO₄ mulai larut. Mengaduk membantu partikelnya menyebar merata ke seluruh air. Terus aduk sampai larut sempurna."                               |
| Larut sempurna | "Larut sempurna! Warna biru berasal dari ion tembaga di dalam larutan. Makin banyak zat terlarut, makin pekat birunya. Lihat konsentrasinya di tabel."     |
| Pengenceran    | "Airnya bertambah, jadi zat terlarut tersebar di volume yang lebih besar dan konsentrasinya turun. Aduk lagi, lalu bandingkan warnanya dengan sebelumnya." |

**Laju Reaksi**

| Momen               | Kalimat                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pemanas menyala     | "Pemanas menyala. Panas dari air penangas berpindah ke larutan, jadi partikelnya bergerak makin cepat. Matikan pemanas saat suhunya sesuai tujuanmu."        |
| Reaksi dimulai      | "Reaksi dimulai! Na₂S₂O₃ bereaksi dengan HCl membentuk endapan belerang yang membuat larutan keruh. Perhatikan tanda silang di bawah labu."                  |
| Tanda silang hilang | "Tanda silangnya hilang karena endapan belerang sudah cukup banyak menutupi pandangan. Waktunya tercatat. Coba ulangi dengan suhu atau konsentrasi berbeda." |

Labi hanya menjelaskan kejadian yang baru terjadi. Kesimpulan besar, seperti hubungan suhu dengan kecepatan reaksi, tetap dicari sendiri oleh siswa di tahap Simpulkan.

## 8. Halaman

| Alamat                    | Isi                                  |
| ------------------------- | ------------------------------------ |
| `/`                       | Beranda                              |
| `/lab`                    | Pilih laboratorium                   |
| `/lab/:subject`           | Katalog eksperimen                   |
| `/lab/:subject/:id`       | Detail eksperimen                    |
| `/lab/:subject/:id/mulai` | Praktikum bersama Labi               |
| `/tentang-ai`             | Penjelasan penggunaan AI di aplikasi |

Id eksperimen: `uji-asam-basa`, `konsentrasi-larutan`, `laju-reaksi`, dan `hukum-newton` (opsional).

### Halaman praktikum

Di laptop, meja lab tampil di sisi kiri. Di sisi kanan ada panel dengan tiga tab: Labi, Tabel, dan Penjelasan. Judul eksperimen, pengatur kecepatan, dan tombol reset ada di bagian atas. Labi tampil di pojok meja lab dengan balon bicaranya.

Di HP, meja lab dibagi menjadi beberapa area kerja yang bisa dipilih lewat tab, supaya alat tetap cukup besar untuk disentuh. Benda yang tidak terlihat di area aktif muncul di rak alat bagian bawah. Panel Labi, Tabel, dan Penjelasan ada di panel bawah yang bisa ditarik ke atas. Saat HP dalam posisi tegak, muncul saran untuk memutar HP.

| Eksperimen          | Area kerja di HP               |
| ------------------- | ------------------------------ |
| Uji Asam & Basa     | Meja, Rak & kartu pH, Wastafel |
| Konsentrasi Larutan | Meja timbang, Meja kerja       |
| Laju Reaksi         | Meja, Penangas                 |

## 9. Eksperimen

### 9.1 Uji Asam & Basa

Siswa menguji lima larutan dengan indikator universal untuk mengetahui sifat asam, basa, atau netral.

|                    |                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Alat dan bahan     | 3 tabung reaksi, pipet tetes, 5 botol larutan, botol indikator universal                                                                   |
| Tempat menaruh     | Rak tabung, kartu skala pH, wastafel                                                                                                       |
| Alur umum          | Ambil larutan dengan pipet, teteskan ke tabung, tambahkan indikator, lalu cocokkan tabung dengan kartu pH. Tabung dikosongkan di wastafel. |
| Data tercatat      | Saat tabung berindikator dicocokkan ke kartu pH                                                                                            |
| Nilai              | Cuka pH 3, air jeruk pH 4, air suling pH 7, air sabun pH 10, NaOH encer pH 13                                                              |
| Ditolak            | Larutan kedua dimasukkan ke tabung yang sudah berisi larutan                                                                               |
| Kolom tabel        | Larutan, warna, pH, sifat                                                                                                                  |
| Pertanyaan tebakan | "Menurutmu cuka bersifat asam, basa, atau netral?"                                                                                         |

### 9.2 Konsentrasi Larutan

Siswa membuat larutan CuSO₄, menghitung konsentrasinya, lalu mencoba pengenceran.

|                    |                                                                                                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alat dan bahan     | Wadah CuSO₄, sendok kecil (1 g), sendok besar (4 g), kaca arloji, botol air suling, gelas ukur 250 mL, gelas kimia, batang pengaduk                                          |
| Tempat menaruh     | Neraca digital, meja kerja                                                                                                                                                   |
| Alur umum          | Timbang CuSO₄ di atas kaca arloji, ukur air dengan gelas ukur (50 mL sekali isi), campurkan di gelas kimia, lalu aduk sampai larut.                                          |
| Data tercatat      | Saat zat larut sempurna. Menambah air lalu mengaduk lagi akan menghasilkan data baru.                                                                                        |
| Rumus              | Mr CuSO₄ = 160, M = (massa ÷ Mr) ÷ volume dalam liter. Contoh: 16 g dalam 100 mL = 1 M.                                                                                      |
| Ditolak            | Kaca arloji tidak di atas neraca saat diisi, massa lebih dari 16 g, volume lebih dari 250 mL, air dituang langsung dari botol ke gelas kimia, mengaduk tanpa batang pengaduk |
| Kolom tabel        | Massa (g), volume (mL), mol, konsentrasi (M), warna                                                                                                                          |
| Pertanyaan tebakan | "Kalau airnya ditambah dua kali lipat, warnanya jadi lebih pekat atau lebih pucat?"                                                                                          |

### 9.3 Laju Reaksi

Siswa mencari tahu pengaruh suhu dan konsentrasi terhadap kecepatan reaksi Na₂S₂O₃ dan HCl.

|                    |                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alat dan bahan     | Labu Erlenmeyer, 4 botol Na₂S₂O₃ (0,05 / 0,1 / 0,15 / 0,2 M), botol HCl, termometer, stopwatch                                                                     |
| Benda tetap        | Penangas air dengan sakelar, kertas bertanda silang                                                                                                                |
| Alur umum          | Isi labu dengan Na₂S₂O₃, pasang termometer, panaskan di penangas sampai suhu yang diinginkan, pindahkan labu ke kertas silang, jalankan stopwatch, lalu tuang HCl. |
| Data tercatat      | Saat tanda silang sudah tidak terlihat                                                                                                                             |
| Rumus              | t = 60 × (0,2 ÷ C) × 2^(−(T − 25) ÷ 10). Contoh: 0,2 M pada 25 °C = 60 detik.                                                                                      |
| Catatan            | Suhu naik 0,5 °C per detik. Suhu yang dicatat adalah suhu saat HCl dituang, dibulatkan. Termometer ikut berpindah bersama labu.                                    |
| Ditolak            | HCl dituang saat labu tidak di atas kertas silang, termometer belum dipasang, atau stopwatch belum berjalan. Suhu tidak bisa lebih dari 55 °C.                     |
| Kolom tabel        | Suhu (°C), konsentrasi (M), waktu (s), laju relatif (1/t)                                                                                                          |
| Pertanyaan tebakan | "Kalau suhunya dinaikkan, reaksinya jadi lebih cepat atau lebih lambat?"                                                                                           |

### 9.4 Hukum Newton (opsional)

Troli 0,5 kg diberi beban 0,5 kg atau 1 kg (total maksimal 3 kg) dan didorong kipas 2–10 N. Sensor di titik 1 m mencatat waktu tempuh. Rumus: a = F ÷ m.

## 10. Rancangan Teknis

### 10.1 Teknologi

React, Vite, TypeScript, Tailwind CSS, React Router, dnd-kit, Motion, dan Vitest. Endpoint AI dan suara dibuat sebagai serverless function di Vercel.

Untuk AI, kami merencanakan Gemini API tingkat gratis dari Google AI Studio. Pilihan layanan diatur lewat variabel lingkungan, jadi bisa diganti tanpa mengubah kode. Untuk suara kami memakai ElevenLabs. Layanan dan model yang dipakai dicatat di README dan halaman Tentang AI.

### 10.2 Alur data

```
Siswa menyeret benda
  -> mesin simulasi memeriksa aturan
  -> mesin memperbarui keadaan meja, tabel, dan daftar kejadian
  -> tampilan menggambar ulang meja dan tabel
  -> Labi bereaksi sesuai kejadian (ekspresi atau suara)

Siswa bertanya ke Labi
  -> aplikasi mengirim konteks praktikum ke /api/assistant
  -> server memeriksa batas pemakaian lalu meneruskan ke layanan AI
  -> jawaban tampil di panel Labi
  -> kalau gagal, Labi memakai mode sederhana
```

Mesin simulasi mengeluarkan daftar kejadian setiap kali ada aksi atau proses, misalnya `color-changed`, `dissolved`, `heater-on`, `reaction-started`, `record-added`, `rejected`, dan `action-ok`. Labi hanya membaca daftar ini, sehingga reaksinya tidak perlu diatur ulang di setiap eksperimen.

### 10.3 Struktur folder

| Folder                      | Isi                                                                      |
| --------------------------- | ------------------------------------------------------------------------ |
| `src/data/`                 | Data tiap eksperimen: benda, tempat menaruh, aturan, rumus, kalimat Labi |
| `src/lib/`                  | Mesin simulasi dan fungsi pendukung                                      |
| `src/pages/`                | Halaman aplikasi                                                         |
| `src/components/lab/`       | Meja lab dan aset alat                                                   |
| `src/components/assistant/` | Panel tanya-jawab Labi                                                   |
| `src/components/mascot/`    | Karakter Labi dan ekspresinya                                            |
| `src/simulations/`          | Posisi benda di meja tiap eksperimen                                     |
| `api/`                      | Endpoint AI dan suara                                                    |
| `public/img/lab/`           | Latar meja lab                                                           |
| `public/audio/`             | Rekaman suara Labi                                                       |
| `docs/`                     | Dokumen proyek                                                           |

### 10.4 Variabel lingkungan

| Nama                           | Keterangan                            |
| ------------------------------ | ------------------------------------- |
| `AI_PROVIDER`                  | Layanan AI yang dipakai               |
| `AI_API_KEY`                   | Kunci API layanan AI                  |
| `AI_MODEL`                     | Model AI                              |
| `AI_MAX_QUESTIONS_PER_SESSION` | Batas pertanyaan per sesi (bawaan 10) |
| `ELEVENLABS_API_KEY`           | Kunci API ElevenLabs                  |
| `ELEVENLABS_VOICE_ID`          | Id suara Labi                         |

Kunci API hanya disimpan di file `.env` dan pengaturan Vercel, tidak pernah ditulis di kode.

## 11. Desain

| Bagian         | Ketentuan                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| Gaya alat      | Ilustrasi datar dengan garis tepi tebal #2B2D42, kaca terang dengan pantulan putih, cairan biru muda |
| Warna utama    | Ungu #7051DC, ungu muda #F0EBFF, latar #FAFAF7, teks #252438, teks sekunder #6A6876, garis #E8E6ED   |
| Warna meja lab | Dinding #F7FEFF, lantai #CBF3F7, kayu #F0C25F dan #D4A94C                                            |
| Huruf          | Plus Jakarta Sans untuk judul, Inter untuk teks                                                      |
| Ukuran frame   | Laptop 1440 × 1024                                                                                   |

Desain meja lab untuk ketiga eksperimen sudah dibuat di Figma. Nama setiap layer disamakan dengan id benda di data, dan latar dipisahkan dari benda yang bisa dipindah.

## 12. Pembagian Tugas

| Anggota             | Tugas                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------ |
| BE 1 (mesin)        | Setup repo dan CI, mesin simulasi, halaman praktikum, tampilan HP, deploy                  |
| BE 2 (kimia dan AI) | Data dan rumus ketiga eksperimen, kalimat Labi, endpoint AI, mode sederhana, rekaman suara |
| FE 1                | Navbar, footer, beranda, pilih laboratorium, katalog, detail, Tentang AI, README           |
| FE 2                | Aset alat, karakter dan ekspresi Labi, panel Labi untuk laptop dan HP                      |

## 13. Jadwal

| Hari           | BE 1                                       | BE 2                                                         | FE 1                                | FE 2                                        |
| -------------- | ------------------------------------------ | ------------------------------------------------------------ | ----------------------------------- | ------------------------------------------- |
| Sabtu, 7 Nov   | Repo, setup, CI, mulai mesin               | Teks eksperimen, rancangan instruksi AI                      | Navbar, footer, beranda             | Aset alat                                   |
| Minggu, 8 Nov  | Mesin selesai, praktikum Uji Asam & Basa   | Data Uji Asam & Basa dan Konsentrasi Larutan                 | Pilih laboratorium, katalog, detail | Karakter Labi, panel Labi                   |
| Senin, 9 Nov   | Praktikum dua eksperimen lain, tampilan HP | Data Laju Reaksi, endpoint AI, mode sederhana, rekaman suara | Halaman Tentang AI, README          | Menghubungkan Labi ke endpoint dan kejadian |
| Selasa, 10 Nov | Deploy, uji semua alur                     | Cek jawaban AI dan materi                                    | README lengkap                      | Merapikan tampilan, uji di HP               |

Rabu dan Kamis dipakai untuk uji coba dengan siswa, memperbaiki bug, dan fitur opsional kalau sempat. Jumat untuk merekam video, menyiapkan surat orisinalitas, dan mengecek semua tautan. Sabtu hanya cadangan, dan submission dilakukan paling lambat siang hari.

## 14. Aturan Tim

1. Repo dibuat baru setelah kick-off. Tidak ada kode dari prototipe yang dipakai.
2. Setiap anggota commit dari akun GitHub yang terdaftar, setiap hari, untuk perubahan yang nyata.
3. Pesan commit diawali `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, atau `chore:`.
4. Pull request digabung dengan merge commit. Tidak boleh squash, rebase, force push, atau menghapus commit.
5. Pekerjaan tidak boleh diunggah sekaligus dalam satu commit.
6. Format, lint, test, dan build harus lolos sebelum push.
7. Setiap anggota harus bisa menjelaskan kode yang ia tulis.
8. Satu orang memegang satu folder utama untuk menghindari bentrok.

## 15. Daftar Periksa Submission

**README**

- [ ] Nama tim dan anggota
- [ ] Kategori, nama aplikasi, masalah, solusi, dan target pengguna
- [ ] Fitur yang sudah berjalan
- [ ] Teknologi dan layanan yang dipakai
- [ ] Diagram arsitektur dan alur data
- [ ] Cara instalasi dan menjalankan, termasuk isi `.env.example`
- [ ] Penjelasan penggunaan AI dan bagian aplikasi yang memakainya
- [ ] Atribusi aset, suara, dan layanan pihak ketiga
- [ ] Tautan aplikasi online

**Aplikasi**

- [ ] Online dan bisa dibuka tanpa login atau biaya
- [ ] Kuota AI dan suara tetap aktif selama penilaian
- [ ] Bisa dijalankan di localhost

**Video (YouTube, 3–5 menit)**

- [ ] Tampilan awal dan identitas aplikasi
- [ ] Satu praktikum lengkap dari awal sampai data tercatat
- [ ] Contoh aksi yang ditolak dan tampilan di HP
- [ ] Labi beraksi: tebakan, tanya-jawab, dan kesimpulan
- [ ] Direkam dari versi final, hanya memotong waktu tunggu

**Lainnya**

- [ ] Repo publik sampai penilaian selesai
- [ ] Surat pernyataan orisinalitas bermeterai, ditandatangani ketua tim
- [ ] Commit hash final dicatat
- [ ] Submission lewat portal resmi sebelum batas waktu

## 16. Kebutuhan Lain

| Aspek       | Target                                                                                |
| ----------- | ------------------------------------------------------------------------------------- |
| Kecepatan   | Halaman terbuka kurang dari 3 detik, animasi lancar, jawaban Labi kurang dari 8 detik |
| Tampilan    | Rapi dari lebar 360 px sampai 1440 px                                                 |
| Keterbacaan | Teks minimal 14 px, kontras cukup, warna selalu disertai angka atau label             |
| Keamanan    | Kunci API hanya di server, input dibatasi, permintaan per alamat IP dibatasi          |
| Privasi     | Tanpa akun dan tanpa data pribadi, percakapan tidak disimpan                          |
| Keandalan   | Test untuk mesin dan eksperimen, CI harus lolos sebelum merge                         |

## 17. Risiko

| Risiko                            | Antisipasi                                                                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Waktu tidak cukup                 | Dikerjakan paralel sejak hari pertama. Kalau Senin malam Laju Reaksi belum jalan, eksperimen ini diberi label "Segera hadir". |
| Layanan AI gagal saat demo        | Mode sederhana dan batas pemakaian                                                                                            |
| Kuota AI atau kredit suara habis  | Batas pertanyaan, suara direkam sekali, cadangan suara browser                                                                |
| Jawaban AI keliru                 | Angka selalu dari simulasi, instruksi yang ketat, dan label di setiap jawaban                                                 |
| Kredit ElevenLabs bukan milik tim | Memastikan akun tetap aktif sampai pengumuman akhir                                                                           |
| Bentrok kode antaranggota         | Pembagian folder yang jelas                                                                                                   |

## 18. Yang Masih Perlu Diputuskan

- Kepastian layanan dan model AI setelah diuji.
- Kualitas suara bahasa Indonesia di ElevenLabs dan pilihan suara untuk Labi.
- Siswa yang akan menjadi penguji pada Rabu dan Kamis.
- Apakah fitur opsional dikerjakan.
