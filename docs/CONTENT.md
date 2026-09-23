# Content dan panel admin

Dokumen ini menjelaskan isi yang dapat dikelola Ferry dari `/admin` setelah Supabase live. Teks contoh di mode demo adalah label konsep; jangan mengubahnya menjadi klaim pekerjaan klien tanpa bukti.

## Arah editorial

Landing page memprioritaskan tiga layanan utama:

1. **Web Development** — landing page, company profile, dan web app.
2. **IT Consulting** — pemetaan kebutuhan, solusi sistem, dan pendampingan.
3. **Video Editing** — Reels/TikTok, video promosi, dan dokumentasi.

Fokus tiga layanan tersebut berlaku untuk hero dan daftar layanan, bukan Recent Works. Recent Works dan katalog menampilkan semua kategori proyek, termasuk Graphic Design dan AI Consulting.

Gunakan kalimat yang konkret: jelaskan masalah, ruang lingkup, hasil yang benar-benar ada, dan siapa yang mengerjakan. Hindari angka, logo klien, testimoni, deadline, atau klaim “bebas revisi” jika belum disepakati. Copy “landing page dalam 1 jam” harus tetap diberi konteks: hanya untuk landing page sederhana dengan brief, teks, foto, dan lingkup yang sudah siap; pekerjaan berfitur khusus perlu waktu lebih panjang.

Prinsip penulisan mengikuti [No AI Slop](https://github.com/petergyang/no-ai-slop) (MIT): lead dengan poinnya, pakai detail nyata, dan pertahankan suara Ferry. Referensi itu digunakan untuk **writing/evaluasi**, bukan aturan desain web.

## Alur halaman publik

| Area | Sumber konten | Kapan tampil |
| --- | --- | --- |
| Hero | `src/components/hero-carousel.tsx` | Empat slide dengan pergantian otomatis setiap 3 detik dan satu foto yang sama. Nomor slide dan panah tetap tersedia, tanpa tombol play/pause. |
| Halaman layanan | `src/lib/services.ts` | Web Development, Video Editing, dan IT Consulting menampilkan feed karya sesuai kategori tepat setelah pembuka, lalu cakupan, proses, FAQ, dan brief yang sudah memilih layanan terkait. Tautan “Lihat proyek” langsung menuju feed; ilustrasi pembuka lebih ringkas di mobile. |
| Recent Works di beranda | `projects` | Semua proyek `published` dari seluruh kategori, diurutkan menurut `created_at` dari yang terbaru, tanpa batas tiga kartu. |
| Katalog `/proyek` | `projects` | Semua proyek `published`, termasuk Graphic Design dan AI Consulting. |
| Detail `/proyek/[slug]` | `projects` | Satu proyek `published` dengan slug yang sesuai. |
| Status/kontak | `site_settings` | Dibaca publik; WhatsApp, email, dan Instagram boleh kosong. |

Pengunjung tidak melihat proyek draft. Setelah diterbitkan, proyek dari kategori mana pun masuk Recent Works. Urutan feed mengikuti waktu penambahan proyek (`created_at`), bukan tahun pengerjaan atau urutan katalog (`sort_order`). Mengedit proyek tidak memindahkannya ke atas feed. Tidak ada fitur unggulan.

Kolom database lama `featured` tetap dibiarkan untuk kompatibilitas data yang sudah ada, tetapi aplikasi tidak lagi menggunakan atau menulis nilainya. Kolom tersebut tidak memengaruhi visibilitas maupun urutan proyek.

Hover pointer tidak menghentikan rotasi hero. Setelah panah atau nomor slide dipilih lewat klik, keyboard, atau sentuhan, pergantian otomatis berhenti sampai hero dimuat ulang; navigasi manual tetap tersedia. Tanpa pemilihan manual, hero berhenti sementara saat mendapat fokus keyboard, berada di luar layar, atau tab browser disembunyikan, lalu melanjutkan rotasi saat kondisi itu berakhir. Preferensi reduced motion mematikan rotasi dan transisi. Teks berganti dengan crossfade tanpa menggeser kontrol, sementara foto `ferry-landing.webp` tetap sama. Teks hero dan halaman layanan saat ini dikelola di kode, bukan panel admin.

Headline hero: “Website Optimal, Bisnis Maksimal.”, “Dari ide, jadi website.”, “Ide Menarik, Siap Naikkan Trafik.”, dan “Sistem Andal, Kinerja Maksimal.” Status tersedia di hero dan kontak memakai “Siap Bekerja • Di Kantor / Hibrid / Jarak Jauh / Freelance”; ketika ketersediaan dimatikan di admin, pesan jadwal tetap menggantikan status siap bekerja.

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
6. Proyek terbit otomatis masuk Recent Works untuk semua kategori, dari yang terbaru. **Urutan katalog** hanya mengatur daftar katalog dan karya terkait, bukan feed beranda.
7. Centang **Studi konsep** untuk eksplorasi mandiri, moodboard, atau ilustrasi yang bukan proyek klien. Label tersebut tampil di kartu dan halaman detail.

### Field dan batas validasi

| Field | Aturan | Saran pengisian |
| --- | --- | --- |
| `slug` | 1–80 karakter, unik, huruf kecil/angka dan `-`, format `nama-karya`. | Buat stabil sebelum publish; mengubahnya mengubah URL detail. |
| `title` | 1–120 karakter. | Judul spesifik, bukan slogan kosong. |
| `category` | Salah satu dari enam kategori: Web Development, IT Consulting, Video Editing, Graphic Design, AI Consulting, atau Artikel. | Pilih layanan yang paling dominan untuk karya, atau Artikel untuk tulisan. |
| `summary` | 1–300 karakter. | Satu kalimat yang menjelaskan pekerjaan/eksplorasi. |
| `description` | 1–10.000 karakter. | Pisahkan paragraf dengan satu baris kosong; detailkan konteks, proses, dan batasan. |
| `image_url` | Path `/images/...` atau URL HTTPS publik permanen dari bucket `project-images` milik Supabase yang sama, maksimal 2.048 karakter. | Upload lewat panel agar URL dibuat otomatis. Signed URL ditolak agar gambar tidak kedaluwarsa. |
| `body_images` | Maksimal enam gambar dengan ID unik, URL aman, teks alternatif wajib (1–300 karakter), keterangan opsional (maksimal 300 karakter), dan posisi setelah paragraf. | Posisi 0 berarti sebelum paragraf pertama; pada posisi yang sama, urutan daftar menentukan urutan tampil. |
| `thumbnail_crop` | Opsional: posisi `x`/`y` 0–100 persen dan `zoom` 1–3; `null` memakai crop tengah bawaan. | Berlaku pada thumbnail persegi, bukan gambar penuh pada halaman detail atau gambar share. |
| `project_url` | Opsional; kosong atau URL HTTPS maksimal 2.048 karakter. | Tautkan hasil yang boleh dilihat publik; jangan menautkan footage privat. |
| `year` | Bilangan bulat 1900–2200. | Tahun pengerjaan atau tahun studi konsep. |
| `tags` | Maksimal 20 tag, tiap tag maksimal 32 karakter, tidak boleh duplikat. | Pisahkan dengan koma, misalnya `Next.js, Landing page`. |
| `published` | Boolean. | Akses publik hanya untuk `true`. |
| `is_concept` | Boolean. | Aktifkan untuk karya konsep/non-klien. |
| `sort_order` | Bilangan bulat 0–100.000; angka kecil tampil lebih dulu di katalog dan karya terkait. | Tidak mengubah Recent Works. Sisakan jarak, misalnya 10, 20, 30, agar mudah menyisipkan karya di katalog. |

### Tulisan dan tags

Pilih **Artikel** di editor untuk mengisi judul dan isi tulisan. Tulisan yang diterbitkan muncul di Recent Works sesuai waktu pembuatan, filter Artikel di katalog, serta halaman detail `/proyek/[slug]`. Pisahkan paragraf dengan satu baris kosong. Gambar sampul bisa diunggah seperti proyek biasa; jika memakai placeholder bawaan, detail artikel langsung menampilkan tulisan tanpa sampul kosong. Artikel tidak ditambahkan sebagai layanan di form kontak.

Ketik beberapa tags dengan koma, misalnya `Website, Tips, Catatan`. Koma dan spasi tetap terlihat saat mengetik; saat disimpan, spasi tepi, tag kosong, dan duplikat dirapikan. Batas tetap 20 tag, maksimal 32 karakter per tag.

Untuk database yang sudah berjalan, jalankan `supabase/migrations/002_article_category.sql` sebelum menyimpan kategori Artikel. Migrasi hanya memperluas kategori yang diizinkan, tidak mengubah proyek, Storage, atau akses admin. Lihat [panduan deployment](DEPLOYMENT.md#menambahkan-kategori-artikel-pada-database-yang-sudah-berjalan).

### Gambar proyek

#### Gambar di tengah tulisan

1. Tulis isi posting seperti biasa; beri satu baris kosong di antara paragraf.
2. Di **Gambar dalam tulisan**, pilih **Unggah gambar tulisan**. Bisa memilih beberapa file sekaligus, hingga **6 gambar tambahan** di luar sampul, masing-masing JPG/PNG/WebP maksimal 5 MB.
3. Isi **Teks alternatif** yang menjelaskan gambar dan **Keterangan** bila diperlukan.
4. Pilih **Posisi gambar**: sebelum paragraf pertama atau setelah paragraf tertentu. Jika beberapa gambar berada di posisi yang sama, panah mengubah urutannya. Bila paragraf dihapus, gambar yang posisinya melewati akhir tulisan tetap ditampilkan di akhir.
5. Buka **Preview isi tulisan**, lalu simpan posting. Mengganti gambar mempertahankan teks dan posisinya; **Lepas gambar dari draf** tidak menghapus file Storage.

Gambar isi tulisan tampil utuh sesuai rasio aslinya pada halaman detail, bukan sebagai galeri terpisah di akhir. Tidak perlu menulis HTML atau Markdown. Jika sebagian upload gagal, gambar yang berhasil tetap ada di draf dan pesan menjelaskan file yang gagal.

#### Crop thumbnail feed

Upload sampul melalui **Unggah gambar sampul**, lalu buka **Atur thumbnail 1:1**. Seret gambar memakai mouse/jari atau gunakan penggeser **Posisi horizontal**, **Posisi vertikal**, dan **Zoom thumbnail**. Semua penggeser mendukung keyboard. Preview kartu menggunakan crop dan rasio persegi yang sama dengan feed. **Atur ulang** mengembalikan crop tengah; mengganti sampul juga mereset crop agar posisi gambar lama tidak diterapkan ke gambar baru.

Crop disimpan sebagai pengaturan, bukan file gambar baru: gambar asli, sampul halaman detail, dan metadata share tetap utuh. Pengaturan baru tersimpan setelah **Simpan proyek**; membatalkan editor tidak menyimpan perubahan.

Aktifkan penyimpanannya dengan [`003_post_media.sql`](../supabase/migrations/003_post_media.sql); lihat [langkah aktivasi](DEPLOYMENT.md#menambahkan-gambar-tulisan-dan-crop-thumbnail). Posting lama tetap bisa dibaca dan diedit tanpa fitur media sebelum migrasi. Jika mencoba menyimpan media sebelum migrasi, editor menampilkan pesan aktivasi dan tetap menyimpan isi draf di layar, bukan diam-diam membuang pengaturan.

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

Jalankan migrasi sesuai urutan: `001_portfolio.sql` membuat schema dan row pengaturan dasar dengan tabel `projects` kosong, `002_article_category.sql` menambahkan kategori Artikel, lalu `003_post_media.sql` menambahkan pengaturan gambar tulisan dan crop. Data contoh di `src/lib/demo-data.ts` dipakai sebagai fallback/demo ketika Supabase belum ada; contoh yang bertanda konsep tidak boleh dipresentasikan sebagai pekerjaan klien. Artikel demo dan ilustrasinya diberi label contoh dan tidak dimasukkan ke database produksi. Gambar demo otomatis diperkecil hingga sekitar 250 KB per file untuk menghemat kuota browser; gambar live tidak diperkecil oleh mode demo.

Jika suatu saat ingin memasukkan sample seed ke Supabase, buat dan review `supabase/seed.sql` secara terpisah dari `demoProjects`. Jangan mengubah migration, source aplikasi, atau data demo hanya untuk membuat klaim portofolio terlihat lebih penuh. Scope dokumentasi ini tidak membuat seed baru.

## Batas akses dan privasi

- Auth email/password dan allowlist `admin_users` menentukan siapa yang dapat masuk.
- Server action memanggil guard admin; RLS Postgres tetap melindungi operasi langsung ke tabel.
- Public dapat membaca proyek yang published dan URL gambar bucket publik; public tidak dapat menulis proyek/pengaturan.
- Jangan upload dokumen klien, video mentah, data pribadi, atau hasil kerja yang belum mendapat izin tampil.
