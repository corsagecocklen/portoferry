# Content dan panel admin

Dokumen ini menjelaskan isi yang dapat dikelola Ferry dari `/admin` setelah Supabase live. Teks contoh di mode demo adalah label konsep; jangan mengubahnya menjadi klaim pekerjaan klien tanpa bukti.

## Arah editorial

Landing page memprioritaskan tiga layanan utama:

1. **Web Development** — landing page, company profile, dan web app.
2. **IT Consulting** — pemetaan kebutuhan, solusi sistem, dan pendampingan.
3. **Video Editing** — Reels/TikTok, video promosi, dan dokumentasi.

Fokus tiga layanan tersebut berlaku untuk hero dan daftar layanan, bukan Latest Feed. Latest Feed dan katalog menampilkan semua kategori proyek, termasuk Graphic Design dan AI Consulting.

Gunakan kalimat yang konkret: jelaskan masalah, ruang lingkup, hasil yang benar-benar ada, dan siapa yang mengerjakan. Hindari angka, logo klien, testimoni, deadline, atau klaim “bebas revisi” jika belum disepakati. Copy “landing page dalam 1 jam” harus tetap diberi konteks: hanya untuk landing page sederhana dengan brief, teks, foto, dan lingkup yang sudah siap; pekerjaan berfitur khusus perlu waktu lebih panjang.

Prinsip penulisan mengikuti [No AI Slop](https://github.com/petergyang/no-ai-slop) (MIT): lead dengan poinnya, pakai detail nyata, dan pertahankan suara Ferry. Referensi itu digunakan untuk **writing/evaluasi**, bukan aturan desain web.

## Alur halaman publik

| Area | Sumber konten | Kapan tampil |
| --- | --- | --- |
| Hero | `src/components/hero-carousel.tsx` | Empat slide dengan pergantian otomatis setiap 3 detik dan satu foto yang sama. Nomor slide dan panah tetap tersedia, tanpa tombol play/pause. |
| Halaman layanan | `src/lib/services.ts` | Web Development, Video Editing, dan IT Consulting masing-masing punya halaman, FAQ, serta brief yang sudah memilih layanan terkait. |
| Latest Feed di beranda | `projects` | Semua proyek `published` dari seluruh kategori, diurutkan menurut `created_at` dari yang terbaru, tanpa batas tiga kartu. |
| Katalog `/proyek` | `projects` | Semua proyek `published`, termasuk Graphic Design dan AI Consulting. |
| Detail `/proyek/[slug]` | `projects` | Satu proyek `published` dengan slug yang sesuai. |
| Status/kontak | `site_settings` | Dibaca publik; WhatsApp, email, dan Instagram boleh kosong. |

Pengunjung tidak melihat proyek draft. Setelah diterbitkan, proyek dari kategori mana pun masuk Latest Feed. Urutan feed mengikuti waktu penambahan proyek (`created_at`), bukan tahun pengerjaan atau urutan katalog (`sort_order`). Mengedit proyek tidak memindahkannya ke atas feed. Tidak ada fitur unggulan.

Kolom database lama `featured` tetap dibiarkan untuk kompatibilitas data yang sudah ada, tetapi aplikasi tidak lagi menggunakan atau menulis nilainya. Kolom tersebut tidak memengaruhi visibilitas maupun urutan proyek.

Hover pointer tidak menghentikan rotasi hero. Setelah panah atau nomor slide dipilih lewat klik, keyboard, atau sentuhan, pergantian otomatis berhenti sampai hero dimuat ulang; navigasi manual tetap tersedia. Tanpa pemilihan manual, hero berhenti sementara saat mendapat fokus keyboard, berada di luar layar, atau tab browser disembunyikan, lalu melanjutkan rotasi saat kondisi itu berakhir. Preferensi reduced motion mematikan rotasi dan transisi. Teks berganti dengan crossfade tanpa menggeser kontrol, sementara foto `ferry-landing.webp` tetap sama. Teks hero dan halaman layanan saat ini dikelola di kode, bukan panel admin.

## Live admin versus demo

- `/admin` adalah panel live setelah dua env Supabase terisi dan user berhasil di-allowlist.
- `/admin/demo` hanya tersedia saat Supabase **belum** terkonfigurasi. Perubahan disimpan di `localStorage` browser itu, tidak masuk Postgres, tidak mengubah situs publik, dan tidak cocok untuk data produksi.
- Saat env Supabase sudah ada, route demo ditutup dan `/admin` menggunakan Auth/RLS.
- Admin dapat membuat draft, melihat preview kartu, mengatur kategori/tag/urutan, upload gambar, publish, edit, dan hapus.

## Menambah atau mengubah proyek

1. Login di `/admin`.
2. Pilih **Tambah proyek** atau edit proyek yang ada.
3. Isi field sesuai aturan berikut.
4. Gunakan **Preview** untuk mengecek kartu.
5. Simpan sebagai draft untuk review; centang **Terbitkan** hanya ketika teks dan aset sudah siap.
6. Proyek terbit otomatis masuk Latest Feed untuk semua kategori, dari yang terbaru. **Urutan katalog** hanya mengatur daftar katalog dan karya terkait, bukan feed beranda.
7. Centang **Studi konsep** untuk eksplorasi mandiri, moodboard, atau ilustrasi yang bukan proyek klien. Label tersebut tampil di kartu dan halaman detail.

### Field dan batas validasi

| Field | Aturan | Saran pengisian |
| --- | --- | --- |
| `slug` | 1–80 karakter, unik, huruf kecil/angka dan `-`, format `nama-karya`. | Buat stabil sebelum publish; mengubahnya mengubah URL detail. |
| `title` | 1–120 karakter. | Judul spesifik, bukan slogan kosong. |
| `category` | Salah satu dari lima kategori resmi. | Pilih layanan yang paling dominan. |
| `summary` | 1–300 karakter. | Satu kalimat yang menjelaskan pekerjaan/eksplorasi. |
| `description` | 1–10.000 karakter. | Pisahkan paragraf dengan satu baris kosong; detailkan konteks, proses, dan batasan. |
| `image_url` | Path `/images/...` atau URL HTTPS publik permanen dari bucket `project-images` milik Supabase yang sama, maksimal 2.048 karakter. | Upload lewat panel agar URL dibuat otomatis. Signed URL ditolak agar gambar tidak kedaluwarsa. |
| `project_url` | Opsional; kosong atau URL HTTPS maksimal 2.048 karakter. | Tautkan hasil yang boleh dilihat publik; jangan menautkan footage privat. |
| `year` | Bilangan bulat 1900–2200. | Tahun pengerjaan atau tahun studi konsep. |
| `tags` | Maksimal 20 tag, tiap tag maksimal 32 karakter, tidak boleh duplikat. | Pisahkan dengan koma, misalnya `Next.js, Landing page`. |
| `published` | Boolean. | Akses publik hanya untuk `true`. |
| `is_concept` | Boolean. | Aktifkan untuk karya konsep/non-klien. |
| `sort_order` | Bilangan bulat 0–100.000; angka kecil tampil lebih dulu di katalog dan karya terkait. | Tidak mengubah Latest Feed. Sisakan jarak, misalnya 10, 20, 30, agar mudah menyisipkan karya di katalog. |

### Gambar proyek

Live menerima JPEG, PNG, atau WebP maksimal 5 MB. Bucket `project-images` bersifat publik untuk membaca gambar; upload, update, dan delete tetap dibatasi admin. Karena URL gambar publik walaupun proyek masih draft, metadata draft boleh disembunyikan tetapi gambar itu sendiri tidak boleh memuat materi rahasia.

Delete proyek tidak menghapus file Storage. Setelah menghapus atau mengganti gambar, audit bucket dan bersihkan orphan secara manual setelah memastikan tidak ada proyek lain yang memakainya.

## Pengaturan kontak

Panel menyimpan satu baris `site_settings`:

- **WhatsApp:** kosongkan sampai siap. Format `08...`, `62...`, `+62...`, spasi, tanda hubung, dan kurung diterima. Contoh input uji `0812 0000 0000` dinormalisasi menjadi `6281200000000`; gunakan nomor bisnismu sendiri. Nomor internasional berkode negara lain juga bisa dipakai. Panjang **7–15 digit dihitung setelah normalisasi**, lalu hanya digit internasional yang disimpan untuk tautan `wa.me`.
- **Email:** opsional, gunakan alamat yang benar-benar dapat menerima pesan.
- **Instagram:** opsional, hanya URL HTTPS `instagram.com` atau `www.instagram.com`.
- **Available:** mengubah indikator ketersediaan di hero dan bagian kontak.

Data kontak sengaja tidak diisi di awal agar website tidak mengarang informasi. Setelah akun dan kontak nyata siap, verifikasi bahwa WhatsApp, email, dan Instagram mengarah ke tujuan yang benar.

Kontak yang disimpan lewat admin live tersedia publik. Mode demo hanya menyimpannya di browser dan tidak mengubah kontak website publik.

Format Indonesia yang masih menyertakan awalan lokal setelah kode negara, seperti `+62 (0)812...`, juga dirapikan menjadi `62812...` agar tautan WhatsApp tidak memakai awalan `620` yang keliru.

Form kontak tidak mengirim pesan dari server. Form membuat brief, lalu:

- tanpa kontak: pengunjung hanya dapat menyalin atau mengunduh `.txt`;
- dengan WhatsApp/email: browser membuka link tujuan dan pengunjung tetap menekan tombol kirim sendiri.

## Setup data awal

Migration `supabase/migrations/001_portfolio.sql` membuat schema dan row pengaturan dasar, tetapi tabel `projects` mulai kosong. Data contoh di `src/lib/demo-data.ts` dipakai sebagai fallback/demo ketika Supabase belum ada; contoh yang bertanda konsep tidak boleh dipresentasikan sebagai pekerjaan klien.

Jika suatu saat ingin memasukkan sample seed ke Supabase, buat dan review `supabase/seed.sql` secara terpisah dari `demoProjects`. Jangan mengubah migration, source aplikasi, atau data demo hanya untuk membuat klaim portofolio terlihat lebih penuh. Scope dokumentasi ini tidak membuat seed baru.

## Batas akses dan privasi

- Auth email/password dan allowlist `admin_users` menentukan siapa yang dapat masuk.
- Server action memanggil guard admin; RLS Postgres tetap melindungi operasi langsung ke tabel.
- Public dapat membaca proyek yang published dan URL gambar bucket publik; public tidak dapat menulis proyek/pengaturan.
- Jangan upload dokumen klien, video mentah, data pribadi, atau hasil kerja yang belum mendapat izin tampil.
