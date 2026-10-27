# PRD — Virtual Lab Fun Education (MVP)

Virtual Lab adalah web app lab virtual untuk siswa SMA. MVP memuat 6 eksperimen (3 kimia, 3 fisika) berbentuk **sandbox bebas bergaya PhET**: siswa menyeret alat dan bahan, menjalankan proses praktikum sendiri, mengukur dengan alat ukur, dan hasilnya tercatat otomatis. Dirilis 13 November 2026.

## 1. Info dokumen

| Item | Isi |
| --- | --- |
| Nama produk | Virtual Lab |
| Versi dokumen | v0.3 |
| Status | Draft |
| Pemilik produk | PLUGIN |
| Tim | 4 orang: 2 frontend, 2 backend |
| Tanggal mulai | 26 Okt 2026 |
| Target rilis MVP | 13 Nov 2026 |
| Perubahan v0.3 | Lab diubah dari praktikum berlangkah menjadi sandbox bebas lewat drag-and-drop dengan proses bertahap. Dihapus dari MVP: panduan langkah wajib, slider/kontrol variabel, kuis, halaman hasil, skor, durasi, tingkat kesulitan, mode. Ditambah: alat ukur sebagai sumber data tabel, penjelasan tiga lapis, aturan penolakan yang mendidik |

## 2. Ringkasan produk & latar belakang

**Ringkasan:** Virtual Lab memungkinkan siswa melakukan praktikum kimia dan fisika langsung dari browser, tanpa alat, tanpa risiko, tanpa instalasi, dan bisa diulang kapan saja.

**Masalah yang diselesaikan:**

- Banyak sekolah minim fasilitas lab, dan praktikum sering hanya dibaca dari buku sehingga siswa kurang paham dan bosan.
- Siswa dengan gaya belajar visual dan praktik butuh cara belajar lewat mencoba.
- Praktikum nyata berisiko (bahan kimia) dan terbatas waktu, sehingga siswa jarang bisa mengulang percobaan.
- Guru butuh media yang membuat pelajaran lebih menarik.

**Solusi:** lab virtual per bidang (Kimia dan Fisika) dengan katalog yang bisa dicari dan difilter, halaman detail berisi konteks dan tujuan eksperimen, dan halaman lab berupa **meja praktikum bebas**. Siswa tidak mengikuti langkah yang dipaksakan; mereka bereksplorasi seperti di lab sungguhan, dan setiap fenomena terjadi lewat proses yang terlihat (menuang, menimbang, mengaduk, memanaskan, melepas troli, mengayunkan bandul).

## 3. Prinsip pengalaman lab

1. **Bebas total.** Tidak ada urutan langkah yang benar atau salah. Siswa boleh mencoba apa saja yang masuk akal secara fisik.
2. **Semua lewat drag-and-drop aset.** Tidak ada kolom isian, dropdown, atau slider. Nilai variabel dipilih dengan memilih benda, misalnya beban 50 g, tali 60 cm, botol konsentrasi 0,1 M. Tombol hanya untuk Reset dan pengatur kecepatan waktu.
3. **Hasil tidak muncul tiba-tiba.** Fenomena berjalan bertahap dan terlihat: warna berubah perlahan, zat larut sambil diaduk, suhu naik saat dipanaskan, troli melaju, bandul berayun.
4. **Data berasal dari pengukuran.** Baris tabel pengamatan hanya tercatat saat siswa memakai alat ukur yang sesuai (kartu skala pH, neraca, gelas ukur, termometer, stopwatch, sensor, mistar). Baris terisi otomatis dan tidak dicatat dua kali.
5. **Penolakan yang mendidik.** Aksi yang mustahil secara fisik ditolak dengan pesan singkat, misalnya "Satu tabung hanya untuk satu larutan" atau "Nyalakan pemanas dulu agar suhu naik".
6. **Setiap hasil dijelaskan.** Penjelasan singkat untuk siswa SMA muncul setelah ada hasil pengukuran.
7. **Bisa di HP.** Semua aksi bisa dilakukan dengan sentuhan (drag atau tap benda lalu tap tujuan).

## 4. Tujuan & metrik keberhasilan

**Tujuan produk:**

- Siswa bisa menjalankan satu eksperimen dan menghasilkan data pengamatan tanpa bantuan.
- Siswa memahami konsep lewat mencoba, mengamati, dan menyimpulkan, bukan hafalan.
- Eksperimen baru bisa ditambah lewat file data tanpa mengubah mesin lab.

**Metrik keberhasilan MVP:**

| Metrik | Target | Cara mengukur |
| --- | --- | --- |
| Eksperimen yang selesai dibuat | 6 (3 kimia, 3 fisika) | Checklist fitur per eksperimen |
| Penguji yang menghasilkan ≥ 3 baris data di satu eksperimen tanpa bantuan | ≥ 4 dari 5 orang | Observasi uji coba |
| Penguji yang bisa menyebutkan kesimpulan eksperimen setelah mencoba | ≥ 4 dari 5 orang | Wawancara singkat setelah uji coba |
| Penguji yang menemukan eksperimen lewat cari/filter | ≥ 4 dari 5 orang dalam ≤ 30 detik | Observasi uji coba |
| Kepuasan penguji ("seru dipakai") | ≥ 4 dari 5 | Form feedback singkat |

## 5. Target pengguna & persona

**Target utama:** siswa SMA kelas 10–11 dengan acuan Kurikulum Merdeka, mengakses lewat HP atau laptop.

| Persona | Profil | Kebutuhan utama | Kendala saat ini |
| --- | --- | --- | --- |
| Raka, 16 th (siswa) | Kelas 11, lab sekolah terbatas, lebih sering belajar lewat HP | Memahami asam-basa serta gerak dan gaya dengan cara seru | Praktikum hanya dibaca dari buku |
| Nadia, 15 th (siswa) | Kelas 10, suka visual dan game, cepat bosan dengan teks panjang | Belajar lewat mencoba dan melihat hasil langsung | Rumus fisika terasa abstrak |
| Bu Sari, 34 th (guru, sekunder) | Guru kimia/fisika SMA | Media praktikum alternatif untuk kelas atau tugas rumah | Alat dan waktu praktikum terbatas |

## 6. Ruang lingkup MVP

**Termasuk:**

- Beranda dengan tombol "Try Lab" dan pengenalan dua laboratorium.
- Halaman pilih laboratorium beserta jumlah eksperimen, deskripsi, dan topik.
- Katalog eksperimen per laboratorium: pencarian, filter topik, kartu eksperimen (topik, judul, ringkasan).
- Halaman detail eksperimen: pratinjau, konteks eksperimen, tujuan, daftar alat & bahan, tips, rekomendasi eksperimen lain.
- Halaman lab sandbox: meja kerja, rak alat & bahan, zona tempat benda diletakkan, proses bertahap, alat ukur, tabel pengamatan otomatis, panel penjelasan, Reset, pengatur kecepatan waktu.
- Responsif dengan acuan desktop 1440 px dan mobile 412 px.

**Tidak termasuk MVP:**

- Panduan langkah wajib, slider, dan kolom isian di halaman lab.
- Kuis, halaman hasil, skor, dan progres tersimpan.
- Durasi, tingkat kesulitan, dan mode di kartu atau detail eksperimen.
- Login, akun, database, dan dashboard guru.
- Eksperimen di luar 6 eksperimen MVP, termasuk Titrasi dan Hukum Ohm.
- Mode offline dan multibahasa.

**Versi berikutnya (setelah MVP, atau setelah M3 jika waktu cukup):**

- Asisten Lab berbasis AI yang menjawab pertanyaan seputar eksperimen yang sedang dibuka (butuh fungsi server dan batas pemakaian).
- Supabase untuk login, progres, dan dashboard guru.
- Grafik otomatis dari tabel pengamatan.

## 7. Daftar eksperimen MVP

| Pelajaran | Eksperimen | Topik | Tujuan pembelajaran | Prioritas |
| --- | --- | --- | --- | --- |
| Kimia | K1. Uji Asam & Basa | Asam & basa | Membedakan larutan asam, basa, dan netral lewat nilai pH | P1 |
| Kimia | K2. Konsentrasi Larutan | Larutan | Menghitung dan membandingkan molaritas, termasuk pengenceran | P1 |
| Kimia | K3. Laju Reaksi | Reaksi | Menyelidiki pengaruh suhu dan konsentrasi terhadap laju reaksi | P1 |
| Fisika | F1. Hukum Newton | Gerak & gaya | Menemukan hubungan gaya, massa, dan percepatan | P1 |
| Fisika | F2. Ayunan Sederhana | Getaran | Menyelidiki pengaruh panjang tali dan massa terhadap periode | P1 |
| Fisika | F3. Hukum Hooke | Gerak & gaya | Menentukan konstanta pegas dari gaya dan pertambahan panjang | P1 |

Setiap eksperimen dijelaskan dengan pola yang sama: **benda** (yang bisa diseret), **zona** (tempat benda diletakkan), **proses** (apa yang terjadi bertahap), **pengukuran** (alat ukur dan kapan data tercatat), **aturan** (rumus dan nilai), **penolakan**, dan **tabel pengamatan**. Proses di bawah adalah contoh alur alami; siswa tidak wajib mengikutinya berurutan.

### K1. Uji Asam & Basa

- **Benda:** 3 tabung reaksi, pipet tetes, 5 botol larutan (cuka, air jeruk, air suling, air sabun, NaOH encer), botol indikator universal, kartu skala warna pH.
- **Zona:** rak tabung (3 slot), wastafel.
- **Proses:** taruh tabung di rak → seret pipet ke botol larutan untuk mengisi → seret pipet ke tabung untuk meneteskan → seret botol indikator ke tabung → warna cairan berubah bertahap (≤ 1 detik) → seret tabung ke kartu skala pH untuk membaca nilainya → seret tabung ke wastafel untuk mengosongkan.
- **Pengukuran:** data tercatat saat tabung berindikator dicocokkan ke kartu skala pH.
- **Aturan:** cuka pH ≈ 3, air jeruk ≈ 4, air suling 7, air sabun ≈ 10, NaOH encer ≈ 13. pH < 7 asam, 7 netral, > 7 basa. Warna indikator selalu disertai label angka pH.
- **Penolakan:** satu tabung hanya untuk satu larutan; indikator tanpa larutan tidak menghasilkan bacaan.
- **Tabel pengamatan:** larutan, warna indikator, pH, sifat.

### K2. Konsentrasi Larutan

- **Benda:** wadah CuSO₄, sendok kecil (1 g) dan sendok besar (4 g), kaca arloji, botol air suling, gelas ukur 250 mL, gelas kimia, batang pengaduk.
- **Zona:** neraca digital, meja kerja.
- **Proses:** taruh kaca arloji di neraca (angka neraca tampil) → ambil CuSO₄ dengan sendok dan tuang ke kaca arloji (massa bertambah per sendok, 1–16 g) → isi gelas ukur dari botol air (50 mL per isian, 50–250 mL) → tuang air ke gelas kimia → tuang CuSO₄ ke gelas kimia → aduk dengan batang pengaduk (gerakan bolak-balik menaikkan progres larut) → warna biru merata saat larut sempurna. Menambah air setelahnya mengencerkan larutan dan perlu diaduk lagi.
- **Pengukuran:** massa dibaca dari neraca, volume dari gelas ukur; data tercatat saat zat larut sempurna.
- **Aturan:** CuSO₄ Mr = 160 g/mol. Mol = massa ÷ Mr; M = mol ÷ volume (L). Biru makin pekat seiring M naik.

  ```
  M = (m ÷ Mr) ÷ V
  ```

- **Penolakan:** massa di atas 16 g atau volume di atas 250 mL ditolak; mengaduk gelas kosong tidak berpengaruh.
- **Tabel pengamatan:** massa (g), volume (mL), mol, konsentrasi (M), warna.

### K3. Laju Reaksi

- **Benda:** labu Erlenmeyer, kertas bertanda silang, 4 botol Na₂S₂O₃ (0,05 / 0,1 / 0,15 / 0,2 M), botol HCl, termometer, stopwatch.
- **Zona:** penangas air dengan sakelar pemanas, meja kerja.
- **Proses:** taruh labu di atas kertas silang → tuang Na₂S₂O₃ konsentrasi pilihan → pindahkan labu ke penangas → nyalakan pemanas, suhu naik bertahap (terlihat di termometer), matikan saat mencapai suhu yang diinginkan (25–55 °C) → kembalikan labu ke kertas silang → tuang HCl, larutan mulai keruh → jalankan stopwatch → tanda silang memudar sampai hilang.
- **Pengukuran:** data tercatat saat tanda silang hilang dan stopwatch sedang berjalan.
- **Aturan:** Na₂S₂O₃ + 2HCl → 2NaCl + S + SO₂ + H₂O; endapan belerang membuat larutan keruh. Waktu dasar 60 detik pada 25 °C dan 0,2 M; waktu berbanding terbalik dengan konsentrasi dan menjadi setengahnya setiap suhu naik 10 °C.

  ```
  t = t₀ × (C₀ ÷ C) × 2^(−(T − T₀) ÷ 10)
  ```

- **Penolakan:** suhu tidak naik jika pemanas mati; suhu dibatasi 25–55 °C; HCl tanpa Na₂S₂O₃ tidak bereaksi.
- **Tabel pengamatan:** suhu (°C), konsentrasi (M), waktu (s), laju relatif (1/t).
- **Catatan:** waktu reaksi bisa sampai 4 menit, jadi pengatur kecepatan waktu (1× / 5×) wajib ada.

### F1. Hukum Newton

- **Benda:** troli (0,5 kg), beban 0,5 kg dan 1 kg (bisa ditumpuk, total maksimum 3 kg), kipas pendorong 2 / 4 / 6 / 8 / 10 N, sensor gerak.
- **Zona:** lintasan datar dengan titik start, atas troli, belakang troli, titik 1 m pada lintasan.
- **Proses:** taruh beban di atas troli → pasang kipas di belakang troli → pasang sensor di titik 1 m → seret troli ke titik start → lepas, troli melaju makin cepat → troli melewati sensor.
- **Pengukuran:** sensor mencatat waktu tempuh 1 m; percepatan dihitung dari waktu tempuh.
- **Aturan:** gesekan diabaikan; a = F ÷ m; dari pengukuran a = 2s ÷ t² dengan s = 1 m. Kecepatan setelah 2 detik v = a × 2.
- **Penolakan:** total massa di atas 3 kg; dua kipas sekaligus; troli tidak bergerak tanpa kipas.
- **Tabel pengamatan:** gaya F (N), massa m (kg), waktu tempuh (s), percepatan a (m/s²), kecepatan setelah 2 s (m/s).

### F2. Ayunan Sederhana

- **Benda:** tali 20 / 40 / 60 / 80 / 100 cm, bandul 50 / 100 / 200 g, busur derajat, stopwatch.
- **Zona:** penjepit statif, ujung tali.
- **Proses:** gantung tali di statif → pasang bandul di ujung tali → tarik bandul ke samping (busur menunjukkan sudut) → lepas, bandul berayun → seret stopwatch ke statif, stopwatch menghitung 10 ayunan.
- **Pengukuran:** data tercatat setelah 10 ayunan selesai dihitung.
- **Aturan:** g = 9,8 m/s²; periode tidak bergantung pada massa.

  ```
  T = 2π × √(L ÷ g)
  ```

- **Penolakan:** simpangan di atas 15° ditolak dengan penjelasan bahwa rumus hanya berlaku untuk simpangan kecil; mengganti tali saat bandul berayun tidak bisa.
- **Tabel pengamatan:** panjang tali (m), massa (g), waktu 10 ayunan (s), periode T (s), T² (s²).

### F3. Hukum Hooke

- **Benda:** pegas A (k = 20 N/m), pegas B (k = 40 N/m), gantungan beban, beban 50 g (bisa ditumpuk sampai 250 g), mistar.
- **Zona:** penjepit statif, ujung pegas, sisi pegas (tempat mistar).
- **Proses:** gantung pegas di statif → pasang mistar di samping pegas (panjang awal terbaca) → gantung beban satu per satu → pegas memanjang dan berosilasi lalu diam.
- **Pengukuran:** data tercatat saat pegas diam dan mistar terpasang.
- **Aturan:** F = m × g (g = 9,8 m/s²); F = k × Δx, sehingga Δx = F ÷ k. Beban tetap dalam batas elastis.
- **Penolakan:** beban di atas 250 g; mengganti pegas saat masih ada beban.
- **Tabel pengamatan:** massa (g), gaya F (N), pertambahan panjang Δx (m), konstanta k (N/m).

## 8. Alur pengguna & user stories

**Alur utama:** Beranda → Pilih laboratorium → Katalog (cari + filter) → Detail eksperimen → Halaman lab.

| ID | User story | Kriteria diterima |
| --- | --- | --- |
| US-01 | Sebagai siswa, saya ingin memilih laboratorium agar langsung menemukan eksperimen yang saya butuhkan | Kartu Kimia dan Fisika tampil dengan jumlah eksperimen dari data; tombol "Jelajahi" membuka katalog |
| US-02 | Sebagai siswa, saya ingin mencari dan memfilter eksperimen per topik | Pencarian menyaring kartu berdasarkan judul dan ringkasan; chip topik menyaring daftar; jumlah hasil ikut berubah |
| US-03 | Sebagai siswa, saya ingin melihat konteks dan tujuan eksperimen sebelum mulai | Detail menampilkan pratinjau, konteks, tujuan, alat & bahan, tips; tombol "Mulai eksperimen" membuka lab |
| US-04 | Sebagai siswa, saya ingin bebas memakai alat tanpa urutan yang dipaksakan | Tidak ada langkah wajib; aksi yang masuk akal secara fisik diterima dalam urutan apa pun |
| US-05 | Sebagai siswa, saya ingin melihat proses praktikum, bukan hasil instan | Setiap fenomena dianimasikan bertahap (menetes, larut, panas, bergerak, berayun) |
| US-06 | Sebagai siswa, saya ingin mengukur dengan alat ukur seperti di lab nyata | Data hanya tercatat lewat alat ukur yang sesuai |
| US-07 | Sebagai siswa, saya ingin hasil pengukuran tercatat otomatis | Setiap pengukuran baru menambah satu baris; hasil yang sama tidak dicatat dua kali; baris bisa dihapus |
| US-08 | Sebagai siswa, saya ingin tahu kenapa aksi saya ditolak | Penolakan menampilkan pesan singkat yang menjelaskan alasannya |
| US-09 | Sebagai siswa, saya ingin memahami arti hasil | Panel penjelasan menampilkan arti hasil terakhir dan konsep di baliknya |
| US-10 | Sebagai siswa, saya ingin mengulang dari awal | Reset mengembalikan meja kerja dan tabel ke kondisi awal |
| US-11 | Sebagai siswa, saya ingin praktikum di HP | Semua aksi bisa dilakukan dengan sentuhan; tata letak rapi di 360–412 px |
| US-12 | Sebagai siswa, saya ingin membuka eksperimen lain dari detail | Bagian "Eksperimen lainnya" menampilkan 2 kartu dari laboratorium yang sama |

## 9. Kebutuhan fungsional per halaman

| Halaman | Fitur | Deskripsi | Prioritas |
| --- | --- | --- | --- |
| Global | Navigasi & footer | Logo "virtual lab.", menu Beranda dan Laboratorium, tombol "Butuh bantuan?", footer | P1 |
| Beranda | Hero + Kenali laboratoriummu | Judul, deskripsi, tombol "Try Lab", dua kartu bidang | P1 |
| Pilih laboratorium | Kartu laboratorium | Ikon, nama, jumlah eksperimen, deskripsi, topik, tombol "Jelajahi" | P1 |
| Katalog | Cari, filter, kartu | Kolom cari, chip topik, kartu (ikon, topik, judul, ringkasan) | P1 |
| Detail | Informasi eksperimen | Pratinjau, konteks, tujuan, alat & bahan (dari daftar benda), tips, "Eksperimen lainnya" | P1 |
| Lab | Meja kerja & zona | Area tempat benda diletakkan dan proses dianimasikan | P1 |
| Lab | Rak alat & bahan | Benda bisa diseret di desktop; di HP: tap benda lalu tap tujuan | P1 |
| Lab | Alat ukur | Bacaan tampil di alat (neraca, termometer, stopwatch, mistar, kartu pH) | P1 |
| Lab | Tabel pengamatan | Terisi otomatis dari pengukuran, tanpa duplikat, bisa hapus baris | P1 |
| Lab | Panel penjelasan | Arti hasil terakhir dan konsep singkat | P1 |
| Lab | Pesan penolakan | Muncul singkat di dekat zona saat aksi ditolak | P1 |
| Lab | Reset & kecepatan waktu | Reset meja kerja; kecepatan 1× / 5× untuk proses yang lama | P1 |
| Lab | Layar penuh & efek suara | Mode layar penuh; bunyi tetes, klik, sukses yang bisa dimatikan | P2 |
| Bantuan | Butuh bantuan? | Cara memakai lab (drag, tap, alat ukur) dan FAQ | P2 |

## 10. Kebutuhan non-fungsional

| Aspek | Kebutuhan | Target |
| --- | --- | --- |
| Performa | Lab cepat dimuat, animasi lancar | Muat < 3 detik di 4G; animasi ≥ 30 fps di HP kelas menengah |
| Ukuran | Aset ringan (SVG/WebP) | ≤ 300 KB per gambar; total halaman lab < 2 MB |
| Responsif | HP, tablet, laptop | Acuan 1440 px dan 412 px; rapi mulai 360 px |
| Interaksi sentuh | Semua aksi tanpa drag juga bisa | Diuji di Chrome Android dan Safari iOS |
| Aksesibilitas | Informasi tidak hanya lewat warna | Teks isi ≥ 14 px; kontras ≥ 4,5:1; warna indikator selalu berlabel |
| Akurasi materi | Rumus dan nilai sesuai buku acuan | Dicek dengan buku paket atau guru sebelum 11 Nov |
| Keandalan logika | Mesin dan aturan eksperimen teruji | Unit test untuk mesin dan setiap aturan; CI hijau sebelum merge |
| Privasi & keamanan | Tidak mengumpulkan data pribadi | Tanpa akun, tanpa database; header keamanan di Vercel |

## 11. Desain & UI

| Elemen | Keputusan |
| --- | --- |
| Gaya visual | Bersih dan lembut: latar krem, kartu putih border tipis, sudut 12–24 px, ilustrasi pastel |
| Palet | Primer #7051DC · Tint #F0EBFF · Fisika #227C78 / #E6F3EF · Latar #FAFAF7 · Teks #252438 · Teks sekunder #777583 · Border #E8E6ED |
| Font | Plus Jakarta Sans (judul), Inter (teks) |
| Ikon | Lucide |
| Lab | Gaya PhET: meja kerja luas, rak benda di samping atau bawah, alat ukur menampilkan angka langsung di alat |
| Animasi | Tetesan, perubahan warna bertahap, pelarutan, kenaikan suhu, gerak troli, ayunan, osilasi pegas |
| Breakpoint | Desktop 1440 px · Mobile 412 px |
| Figma | https://www.figma.com/design/8B1RYTnlZIkEh9d2gtQ0Yf/Untitled |

**Daftar aset:**

- Kimia: tabung reaksi, rak tabung, pipet tetes, botol larutan (5), botol indikator, kartu skala pH, wastafel
- Kimia: wadah CuSO₄, sendok (2 ukuran), kaca arloji, neraca digital, gelas ukur, gelas kimia, botol air, batang pengaduk
- Kimia: labu Erlenmeyer, kertas tanda silang, botol Na₂S₂O₃ (4), botol HCl, penangas air dengan sakelar, termometer, stopwatch
- Fisika: lintasan, troli, beban 0,5 kg dan 1 kg, kipas pendorong (5), sensor gerak
- Fisika: statif, tali (5 panjang), bandul (3), busur derajat, stopwatch, pegas A dan B, gantungan, beban 50 g, mistar
- Umum: ilustrasi Lab Kimia dan Fisika, gambar pratinjau 6 eksperimen

Sementara aset belum siap, FE memakai bentuk sederhana berlabel; logika tidak bergantung pada aset.

## 12. Teknologi & arsitektur

| Lapisan | Pilihan |
| --- | --- |
| Framework | React + Vite + TypeScript |
| Routing | React Router |
| Styling | Tailwind CSS v4 (token di `src/index.css`) |
| Animasi | Motion |
| Drag-and-drop | dnd-kit (mouse dan sentuh) |
| Simulasi | SVG + perhitungan sendiri, tanpa physics engine |
| State | React state lewat hook `useExperiment` |
| Test | Vitest |
| Penyimpanan | Tidak ada di MVP; Supabase di versi berikutnya |
| Deploy | GitHub + Vercel |

**Model sandbox:**

- Setiap eksperimen adalah satu file data berisi info katalog/detail, **benda** beserta sifat ilmiahnya, **zona**, **interaksi** (efek saat benda dijatuhkan ke benda/zona lain), **proses berbasis waktu**, **alat ukur**, aturan penolakan, penjelasan, dan kolom tabel.
- Mesin lab adalah fungsi murni: menerima aksi (taruh, ambil, kosongkan, tick waktu, hapus baris, reset) dan mengembalikan state baru beserta tampilan per zona, baris tabel, penjelasan, dan pesan penolakan.
- Waktu berjalan lewat aksi tick yang dipanggil FE dari animasi; mesin tidak memakai timer sendiri sehingga mudah diuji.
- Semua nilai ilmiah dihitung di data eksperimen, tidak di komponen tampilan.
- Detail tipe data mengikuti kode di `src/data/types.ts` dan README.

**Aturan penamaan:** nama di kode bahasa Inggris; teks untuk siswa bahasa Indonesia; nilai subject `kimia` / `fisika` dan id eksperimen tetap bahasa Indonesia karena muncul di URL.

**Rute:** `/` · `/lab` · `/lab/:subject` · `/lab/:subject/:id` · `/lab/:subject/:id/mulai` · `/dev/engine` (hanya development)

**Struktur folder:**

```
src/
  pages/        Home, LabList, ExperimentCatalog, ExperimentDetail, LabPage, DevEngine
  components/   komponen umum dan komponen lab
  simulations/  tampilan visual tiap eksperimen
  data/         types.ts, index.ts, kimia/, fisika/
  lib/          engine.ts, experiments.ts, test
  hooks/        useExperiment.ts
public/img/     gambar yang dirujuk dari data
```

## 13. Timeline & milestone

| Hari | Tanggal | Fokus | Milestone |
| --- | --- | --- | --- |
| 1–2 | 26–27 Okt | Setup, mesin sandbox awal, fungsi data, PRD v0.3 | **M1:** web online (selesai) |
| 3 | 28 Okt | Finalisasi PRD v0.3, desain halaman lab gaya sandbox di Figma, rancangan mesin berproses | Rancangan disetujui tim |
| 4–5 | 29–30 Okt | Mesin berproses + test; halaman Beranda, Pilih lab, Katalog | |
| 6–8 | 2–4 Nov | K1 lengkap dengan proses dan alat ukur; Detail eksperimen; kerangka lab dengan drag-and-drop | **M2:** K1 utuh |
| 9 | 5 Nov | K2 dan F1 | |
| 10 | 6 Nov | F2 dan K3 | |
| 11–12 | 9–10 Nov | F3, panel penjelasan, Bantuan | **M3:** 6 eksperimen |
| 13 | 11 Nov | Polish animasi, sentuhan di HP, cek akurasi materi | |
| 14 | 12 Nov | Responsif, gambar pratinjau, performa | |
| 15 | 13 Nov | Uji coba 3–5 orang, perbaikan bug, deploy final | **M4:** MVP rilis |

## 14. Risiko, asumsi & pertanyaan terbuka

**Risiko:**

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Proses berbasis waktu menambah kerumitan | Jadwal molor | Mesin umum dulu dan diuji; K1 sebagai pola; dahulukan K1, K2, F1, F2; K3 dan F3 berlabel "Segera hadir" jika molor |
| Drag-and-drop di HP | Pengalaman buruk di perangkat utama | Mode tap benda lalu tap tujuan; tes di HP sejak awal |
| Siswa bingung tanpa panduan langkah | Tidak menghasilkan data | Detail berisi tujuan dan tips; pesan penolakan yang menjelaskan; panel Bantuan |
| Proses terlalu lama | Siswa bosan | Pengatur kecepatan waktu; jumlah aksi per percobaan dijaga wajar |
| Materi kurang akurat | Salah konsep | Nilai hanya dari bagian 7; cek dengan buku paket atau guru |
| Aset visual lambat | Tampilan lab tertunda | Bentuk sederhana berlabel dulu |
| Perubahan kontrak kode di tengah jalan | Tim saling menunggu | Kontrak lewat pull request dengan bagian "Dampak ke tim" |

**Asumsi:**

- Tim 4 orang (2 FE, 2 BE), sekitar 6–8 jam per hari kerja.
- Pengguna memakai browser modern dengan internet.
- Target SMA kelas 10–11.

**Pertanyaan terbuka:**

- ☐ Pengatur kecepatan waktu cukup 1× dan 5×, atau perlu 10× untuk K3?
- ☐ Tombol play di pratinjau detail: langsung membuka lab atau memutar demo singkat?
- ☐ Perlu grafik dari tabel (F1, F3) di MVP, atau cukup tabel?
- ☐ Chip topik "Listrik" di Figma: dihapus atau disimpan untuk versi berikutnya?
- ☐ Siapa 3–5 penguji untuk uji coba hari 15?
