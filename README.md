# Portoferry

Website portofolio dan layanan Ferry Kurniawan untuk **Web Development**, **IT Consulting**, dan **Video Editing**. Karya Graphic Design dan AI Consulting ditampilkan di katalog proyek. Konten dapat diperbarui dari panel admin setelah Supabase disambungkan.

> **Aktivasi layanan:** kode siap dihubungkan ke Supabase dan Vercel, tetapi koneksi akun, deployment publik, dan DNS belum diaktifkan. Ikuti [panduan deployment](docs/DEPLOYMENT.md) dan pilih production branch yang benar-benar tersedia di repository.

## Fitur

- Landing page dengan empat slide hero: perkenalan, Web Development, Video Editing, dan IT Consulting. Teks berganti halus setiap 3 detik tanpa tombol play/pause, memakai satu foto yang sama, dan mengikuti preferensi reduced motion. Hover tidak menghentikan rotasi; memilih panah atau nomor slide menghentikannya agar pengunjung bisa membaca.
- Halaman khusus untuk setiap layanan utama, dengan lingkup kerja, FAQ, karya terkait, dan brief sesuai layanan.
- Feed karya terbaru bergaya postingan sosial di beranda: maksimal tiga proyek `published` dari kategori utama. Proyek `featured` diprioritaskan, lalu slot yang tersisa diisi proyek terbit lainnya tanpa wajib ditandai unggulan.
- Katalog proyek dan halaman detail untuk lima kategori: Web Development, IT Consulting, Video Editing, Graphic Design, dan AI Consulting.
- Panel admin live untuk tambah, edit, hapus, draft, publish, unggulan, urutan, tag, dan upload gambar proyek.
- Pengaturan status ketersediaan, WhatsApp, email, dan Instagram dari panel admin.
- Form kontak yang menyiapkan brief untuk disalin/diunduh; jika kontak diisi, form membuka WhatsApp atau email agar pengunjung mengirim sendiri.
- Mode demo di `/admin/demo` untuk mencoba CRUD di browser lokal tanpa menyentuh situs publik.

## Stack dan prasyarat

- Next.js `16.3.5` dan React `19.3.0` dengan TypeScript strict.
- Supabase Auth, Postgres, Row Level Security (RLS), dan Storage.
- Node.js `22+` dan pnpm `10.26.0`.
- Manrope dan Instrument Serif dari Fontsource; ikon dari Lucide React.

## Mulai lokal

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Buka `http://localhost:3000`. Jika dua env Supabase masih kosong, situs memakai data contoh yang dikirim bersama aplikasi, `/admin` menampilkan petunjuk setup, dan `/admin/demo` menyimpan perubahan hanya di `localStorage` browser tersebut. Data demo tidak menjadi data publik.

Untuk mode live, isi env sesuai [DEPLOYMENT.md](docs/DEPLOYMENT.md). Jangan commit `.env.local` atau service-role key.

## Environment variables

| Variable | Wajib untuk live? | Kegunaan |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | URL project Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Ya | Publishable key untuk client/server Supabase. |
| `NEXT_PUBLIC_SITE_URL` | Disarankan | URL canonical, metadata, robots, dan sitemap; default aplikasi `https://portoferry.my.id`. |

File `.env.example` adalah template. Nilai berawalan `NEXT_PUBLIC_` memang dipakai aplikasi web; tetap jangan memasukkan password, service-role key, atau kredensial lain ke repository.

## Route penting

| Route | Fungsi |
| --- | --- |
| `/` | Landing page, layanan, feed karya, proses, FAQ, dan kontak. |
| `/layanan/web-development` | Lingkup pembuatan website, proses, dan contoh karya web. |
| `/layanan/video-editing` | Jenis editing, bahan yang perlu disiapkan, dan karya terkait. |
| `/layanan/it-consulting` | Pemetaan kebutuhan IT, rekomendasi sistem, dan pendampingan. |
| `/proyek` | Katalog semua proyek yang sudah dipublish. |
| `/proyek/[slug]` | Cerita/detail satu proyek. |
| `/admin` | Login dan panel admin live jika Supabase terkonfigurasi. |
| `/admin/demo` | CRUD lokal terisolasi saat Supabase belum dikonfigurasi; bukan panel produksi. |
| `/robots.txt`, `/sitemap.xml` | Metadata crawl untuk URL situs publik. `/admin` dilarang di robots. |

## Dokumentasi

- [Deployment](docs/DEPLOYMENT.md) — Supabase, Auth/RLS, Vercel, domain `portoferry.my.id`, dan verifikasi.
- [Content](docs/CONTENT.md) — cara mengisi proyek, pengaturan kontak, status publish, dan aturan editorial.
- [Assets](docs/ASSETS.md) — inventaris gambar, provenance, lisensi, dan panduan asset publik.

## Perintah pemeriksaan

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Sebelum tes browser pertama, jalankan `pnpm exec playwright install chromium`. Di Linux yang belum memiliki library browser, gunakan `pnpm exec playwright install --with-deps chromium` dengan izin instalasi paket yang sesuai. E2E memakai build produksi; set `TEST_BASE_URL` untuk menguji server yang sudah berjalan.

Managed Preview Hoplite menggunakan `.hoplite/run.sh`: build lalu `next start`. Ini menghindari kegagalan handshake WebSocket HMR yang ditemukan pada runtime development sandbox. Setelah mengubah kode, restart Preview agar build diperbarui. `pnpm dev` tetap tersedia untuk development lokal biasa.

Perintah di atas adalah pemeriksaan yang tersedia di repository. Status production, domain, Auth, dan integrasi Vercel tetap harus diverifikasi setelah kredensial dan deployment nyata dikonfigurasi.

CI GitHub Actions belum aktif: kredensial integrasi repository tidak memiliki izin `workflows`. [Template CI](docs/ci-workflow.example.yml) disediakan sebagai dokumentasi nonaktif; pemilik repository yang berwenang dapat mengaktifkannya di `.github/workflows/ci.yml`. Auto-deploy Vercel lewat integrasi Git tidak memerlukan workflow ini.

## Catatan keamanan

Server action memeriksa sesi dan allowlist `admin_users`; RLS Supabase menjadi lapisan kedua. Pengunjung hanya dapat membaca proyek yang `published`, sedangkan metadata draft dan perubahan admin memerlukan user Auth yang diizinkan. Migration tidak memerlukan service-role key di frontend.

Ini adalah batasan yang terlihat dari source code dan migration, bukan audit keamanan atau hasil verifikasi pada project cloud production.

Tinjau batas privasi gambar di [ASSETS.md](docs/ASSETS.md). Bucket gambar proyek bersifat publik melalui URL; jangan unggah footage privat, dokumen klien, atau data sensitif.

## Writing dan arah visual

Copy disusun dengan prinsip [No AI Slop](https://github.com/petergyang/no-ai-slop) dan evaluasi skill tersebut: konkret, langsung, dan tidak mengarang bukti kerja. Skill itu dipakai untuk **writing**, bukan sebagai aturan desain web. Arah visual mengadaptasi referensi Ferry menjadi layout gelap dengan aksen biru es, tipografi sans editorial, dan Instrument Serif untuk aksen.
