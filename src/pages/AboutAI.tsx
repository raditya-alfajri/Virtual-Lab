import {
  ArrowRight,
  AudioLines,
  Bot,
  Calculator,
  Check,
  Gauge,
  LifeBuoy,
  Mic,
  ShieldCheck,
  Sparkles,
  Volume2,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import { ACCENT } from '../components/catalog/experimentMeta'
import { SectionCard } from '../components/detail/SectionCard'

const accent = ACCENT.kimia

const SERVICES: {
  icon: LucideIcon
  role: string
  name: string
  model: string
  does: string
}[] = [
  {
    icon: Bot,
    role: 'Otak Labi',
    name: 'Gemini API (Google AI Studio)',
    model: 'gemini-3.5-flash-lite',
    does: 'Menyusun jawaban dan penjelasan singkat Labi sesuai praktikum yang sedang kamu kerjakan.',
  },
  {
    icon: Mic,
    role: 'Telinga Labi',
    name: 'ElevenLabs Speech to Text',
    model: 'scribe_v2_realtime',
    does: 'Mengubah suaramu menjadi teks selama tombol bicara ditahan.',
  },
  {
    icon: Volume2,
    role: 'Suara Labi',
    name: 'ElevenLabs Text to Speech',
    model: 'eleven_flash_v2_5',
    does: 'Mengubah jawaban Labi menjadi suara yang bisa kamu dengar.',
  },
]

const TO_GEMINI = [
  'Nama, topik, tujuan, dan konsep eksperimen yang sedang dibuka',
  'Posisi setiap alat di meja dan angka yang ditunjukkan alat ukur',
  'Pertanyaan tebakan dan jawaban tebakanmu',
  'Isi tabel pengamatanmu',
  'Kejadian terakhir di meja lab dan penjelasan hasil terakhir di layar',
  'Langkah berikutnya menurut panduan, dan apakah masa panduan sudah selesai',
  'Riwayat obrolanmu dengan Labi, paling banyak 12 giliran terakhir',
  'Pertanyaanmu, baik diketik maupun diucapkan',
]

const TO_ELEVENLABS = [
  'Suaramu, ke ElevenLabs Speech to Text selama tombol bicara ditahan, untuk diubah menjadi teks',
  'Teks jawaban Labi, ke ElevenLabs Text to Speech, untuk diubah menjadi suara',
]

const NOT_SENT = [
  'Nama, akun, email, atau data pribadimu, karena aplikasi ini tidak memakai login',
  'Suara dari mikrofonmu saat tombol bicara tidak sedang ditahan',
  'Hal lain di HP atau laptopmu di luar halaman praktikum',
]

const RULES = [
  'Labi menjawab singkat dalam bahasa Indonesia dan hanya membahas praktikum yang sedang kamu buka.',
  'Labi memandu langkah di awal sampai data pertamamu tercatat. Setelah itu kamu bebas bereksperimen, dan Labi hanya memberi saran kalau kamu minta.',
  'Setiap jawaban yang dibuat AI diberi label AI, di chat maupun di balon Labi. Kalimat yang sudah kami siapkan sendiri, seperti sapaan, alasan aksi ditolak, dan kalimat mode sederhana, tidak diberi label karena bukan buatan AI.',
  'Labi itu AI, jadi bisa keliru. Kalau ragu, cocokkan dengan tabel dan panel Penjelasan.',
]

function Checklist({ entries, sent }: { entries: string[]; sent: boolean }) {
  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li key={entry} className="flex items-start gap-3">
          <span
            className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${sent ? 'bg-primary-tint text-primary' : 'bg-line text-ink-muted'}`}
          >
            {sent ? <Check className="size-3" /> : <X className="size-3" />}
          </span>
          {entry}
        </li>
      ))}
    </ul>
  )
}

export default function AboutAI() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <header className="max-w-3xl space-y-4">
        <span
          className={`flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-medium uppercase ${accent.tint} ${accent.text}`}
        >
          <Sparkles className="size-4" />
          Transparansi AI
        </span>
        <h1 className="font-heading text-3xl font-extrabold md:text-4xl">
          Bagaimana <span className="text-primary">Labi</span> bekerja?
        </h1>
        <p className="leading-relaxed text-ink-muted">
          Labi adalah asisten lab berbasis AI yang menemanimu praktikum. Di sini
          kamu bisa tahu layanan apa yang dipakai Labi, data apa yang dikirim,
          dan aturan yang kami pasang supaya Labi aman dan bisa dipercaya.
        </p>
      </header>

      <div className="mt-8 space-y-5">
        <SectionCard icon={Bot} title="Layanan AI yang dipakai" accent={accent}>
          <ul className="grid gap-3 md:grid-cols-3">
            {SERVICES.map(({ icon: Icon, role, name, model, does }) => (
              <li
                key={name}
                className="flex flex-col gap-2 rounded-2xl border border-line bg-bg p-4"
              >
                <span className="flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase">
                  <Icon className="size-4" />
                  {role}
                </span>
                <p className="font-semibold">{name}</p>
                <p className="w-fit rounded-md bg-primary-tint px-2 py-0.5 font-mono text-xs text-primary">
                  {model}
                </p>
                <p className="text-sm leading-relaxed text-ink-muted">{does}</p>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          icon={ShieldCheck}
          title="Data yang dikirim dan yang tidak"
          accent={accent}
        >
          <p className="mb-4 rounded-2xl border border-primary/30 bg-primary-tint p-4 font-semibold">
            Tidak ada nama, akun, atau data pribadi yang dikirim ke layanan mana
            pun. Yang dikirim hanya keadaan praktikummu.
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="mb-2 font-semibold">
                Ke Gemini, setiap kali Labi menjawab
              </p>
              <Checklist entries={TO_GEMINI} sent />
            </div>
            <div className="space-y-5">
              <div>
                <p className="mb-2 font-semibold">Ke ElevenLabs</p>
                <Checklist entries={TO_ELEVENLABS} sent />
              </div>
              <div>
                <p className="mb-2 font-semibold">Yang tidak dikirim</p>
                <Checklist entries={NOT_SENT} sent={false} />
              </div>
            </div>
          </div>
          <p className="mt-4 rounded-2xl bg-bg p-4 text-sm leading-relaxed text-ink-muted">
            Gemini tingkat gratis dapat memakai isi pertanyaan untuk
            meningkatkan layanan Google. Karena itu, jangan menulis data pribadi
            seperti nama lengkap, alamat, atau nomor HP saat bertanya ke Labi.
          </p>
        </SectionCard>

        <SectionCard icon={AudioLines} title="Suaramu" accent={accent}>
          <ul className="space-y-2 leading-relaxed text-ink-muted">
            <li>
              Mikrofon hanya menyala selama kamu menahan tombol{' '}
              <span className="font-semibold text-ink">Tahan untuk bicara</span>
              , dan browser selalu meminta izinmu terlebih dahulu.
            </li>
            <li>
              Suaramu diubah menjadi teks oleh ElevenLabs dan tidak disimpan
              oleh aplikasi ini.
            </li>
            <li>
              Tidak mau memakai suara? Kamu tetap bisa mengetik pertanyaan kapan
              saja.
            </li>
          </ul>
        </SectionCard>

        <div className="grid gap-5 md:grid-cols-2">
          <SectionCard
            icon={Calculator}
            title="Angka hasil dari simulasi"
            accent={accent}
          >
            <p className="leading-relaxed text-ink-muted">
              Angka di tabel pengamatan dan panel Penjelasan, seperti pH,
              konsentrasi, waktu reaksi, percepatan, periode ayunan, dan
              konstanta pegas, selalu dihitung oleh mesin simulasi. Labi diminta
              merujuk angka dari simulasi dan tidak menghitung sendiri. Tapi
              karena jawabannya dibuat oleh AI, cek lagi ke tabel kalau Labi
              menyebut angka saat bicara.
            </p>
          </SectionCard>

          <SectionCard icon={Gauge} title="Batas pemakaian" accent={accent}>
            <p className="leading-relaxed text-ink-muted">
              Labi memakai kuota gratis yang dibagi dengan semua pengunjung.
              Karena itu ada batas pertanyaan per pengunjung, per menit, dan per
              hari. Kalau batasnya tercapai, Labi akan bilang sedang perlu
              istirahat sebentar, dan kamu bisa mencoba lagi nanti.
            </p>
          </SectionCard>
        </div>

        <SectionCard
          icon={LifeBuoy}
          title="Kalau AI sedang tidak tersedia"
          accent={accent}
        >
          <p className="leading-relaxed text-ink-muted">
            Praktikum tetap berjalan seperti biasa. Labi beralih ke{' '}
            <span className="font-semibold text-ink">mode sederhana</span>: Labi
            memakai kalimat yang sudah kami siapkan untuk setiap eksperimen dan
            menampilkan pesan yang sopan. Hasil, alasan, dan rumus tetap muncul
            di panel Penjelasan, dan datamu tetap tercatat di tabel.
          </p>
        </SectionCard>

        <SectionCard icon={Sparkles} title="Aturan main Labi" accent={accent}>
          <ul className="space-y-3">
            {RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary-tint text-primary">
                  <Check className="size-3" />
                </span>
                {rule}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          icon={Wrench}
          title="Selama pembuatan aplikasi"
          accent={accent}
        >
          <p className="leading-relaxed text-ink-muted">
            Tim kami memakai Claude (Anthropic) dan Claude Code sebagai asisten
            untuk merancang, menulis, dan meninjau kode, serta membantu membuat
            ilustrasi aset awal. Semua hasilnya kami tinjau, uji, dan sesuaikan
            sendiri.
          </p>
        </SectionCard>
      </div>

      <Link
        to="/lab"
        className="mt-8 flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-4 font-semibold text-white sm:w-fit sm:gap-6"
      >
        Mulai praktikum bersama Labi
        <ArrowRight className="size-5" />
      </Link>
    </div>
  )
}
