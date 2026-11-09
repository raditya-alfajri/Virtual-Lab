# Virtual Lab

Lab virtual kimia untuk siswa SMA dengan Asisten Lab berbasis AI.

## Tim

Nama tim:

- Muhammad Raditya Alfajri (Ketua Tim - BackEnd)
- Muhammad Zidna Fadla (BackEnd)
- Raihan Khairullah (FrontEnd)
- Raja Aunur Rahman (FrontEnd)

## Kategori

WebApp — Logicodix 2026, subtema Smart & Fun Education

## Masalah

Praktikum kimia di banyak SMA masih terkendala. Alat dan bahan terbatas, waktunya sempit, dan beberapa bahan berbahaya kalau tidak diawasi. Akibatnya praktikum sering diganti dengan membaca langkah di buku atau menonton video, sehingga siswa tidak benar-benar mencoba.

Saat praktikum berlangsung pun, satu guru biasanya mendampingi satu kelas penuh. Siswa yang bingung jarang sempat bertanya, dan banyak yang hanya mengikuti prosedur tanpa tahu kenapa hasilnya seperti itu.

## Solusi

Kami Membuat Platform Experiment Kimia & Fisika secara Virtual agar siswa bisa praktikum kapan saja dari HP atau laptop, mengulang percobaan sebanyak yang mereka mau, dan tetap punya teman belajar yang bisa ditanya.

## Target pengguna

- Siswa/Siswi SMA (main)
- Pelajar SD/SMP
- Anak-anak

## Fitur utama

Lab virtual Interaktif untuk siswa melakukan experiment Kimia dan Fisika

## Teknologi

React, Vite, TypeScript, Tailwind CSS, React Router, dnd-kit, Motion, dan Vitest. Endpoint AI dan suara dibuat sebagai serverless function di Vercel.

Untuk AI, kami merencanakan Gemini API tingkat gratis dari Google AI Studio. Pilihan layanan diatur lewat variabel lingkungan, jadi bisa diganti tanpa mengubah kode. Untuk suara kami memakai ElevenLabs. Layanan dan model yang dipakai dicatat di README dan halaman Tentang AI.

## Arsitektur dan alur data

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

## Menjalankan aplikasi

1. `npm install`
2. Salin `.env.example` menjadi `.env`, lalu isi nilainya
3. `npm run dev`

### Variabel lingkungan

| Nama                           | Keterangan                            |
| ------------------------------ | ------------------------------------- |
| `AI_PROVIDER`                  | Layanan AI yang dipakai               |
| `AI_API_KEY`                   | API key layanan AI                    |
| `AI_MODEL`                     | Model AI                              |
| `AI_MAX_QUESTIONS_PER_SESSION` | Batas pertanyaan per sesi             |
| `ELEVENLABS_API_KEY`           | API key ElevenLabs untuk suara maskot |
| `ELEVENLABS_VOICE_ID`          | Id suara ElevenLabs                   |

## Penggunaan AI

## Atribusi

## Tautan aplikasi
