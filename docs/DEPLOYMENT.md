# Deployment Portoferry

Panduan ini memasang aplikasi ke Supabase, menghubungkannya ke Vercel, lalu mengarahkan `portoferry.my.id` yang dikelola di Dewabiz. Tidak ada deployment atau kredensial nyata yang diverifikasi dari workspace ini.

## Gambaran arsitektur

- **Kode dan deploy:** GitHub `corsagecocklen/portoferry` → Vercel.
- **Auth, database, dan gambar upload:** Supabase Auth, Postgres, RLS, dan bucket `project-images`.
- **DNS:** nameserver tetap di Dewabiz; record DNS authoritative diedit di panel Dewabiz.
- **Update konten:** perubahan proyek/pengaturan dari admin masuk ke Supabase dan tampil setelah revalidasi, tanpa menunggu push kode atau deploy Vercel.
- **Update kode/desain:** push ke production branch membuat production deployment; branch lain membuat preview deployment melalui integrasi Git Vercel.

## Pengamanan dan batas verifikasi

- `/admin` memverifikasi user ke Supabase Auth dan memeriksa allowlist `admin_users`. Login saja tidak cukup untuk mendapat akses admin.
- Aksi simpan/hapus memeriksa izin di server; RLS database dan Storage membatasi perubahan ke admin. Jangan mematikan RLS untuk mengatasi error konfigurasi.
- `/admin/demo` ditutup dengan 404 saat dua env Supabase terisi. Data demo lokal tidak dimigrasikan otomatis ke database live.
- Login aplikasi saat ini memakai email/password, belum memiliki alur MFA/2FA, CAPTCHA, atau pembatas percobaan login khusus aplikasi. Proteksi bawaan Supabase tidak menggantikan semua lapisan tersebut.
- Pengujian lokal tidak membuktikan konfigurasi Auth/RLS produksi benar. Jalankan checklist live di bawah sebelum menganggap aktivasi selesai.
- Kontak situs dan bucket gambar bersifat publik. Status draft menyembunyikan metadata proyek, bukan file gambar yang URL-nya sudah diketahui. Jangan upload materi rahasia.

Gunakan password admin yang unik dan kuat. Aktifkan 2FA pada akun pengelola GitHub, Vercel, dan Supabase; ini terpisah dari login `/admin`. Tinjau [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod) dan Security Advisor di project nyata.

## 1. Siapkan repository di GitHub

Gunakan repository `corsagecocklen/portoferry`. Branch aplikasi saat panduan ini diperbarui adalah `hoplite/poseidonia-20bbdcf9`; jangan mengasumsikan namanya `main`.

1. Pastikan file aplikasi dan migration ikut berada di repository.
2. Di Vercel pilih **Add New → Project → Import Git Repository**.
3. Pilih `corsagecocklen/portoferry`.
4. Di **Settings → Environments → Production**, atur **Branch Tracking / Production Branch** ke `hoplite/poseidonia-20bbdcf9`, lalu simpan. Jika pengaturan ini baru tersedia setelah deploy pertama, periksa dan sesuaikan sebelum memakai domain produksi.
5. Biarkan Vercel mendeteksi Next.js dan pnpm dari lockfile. Root directory adalah root repository (`./`), build memakai `pnpm build`, dan Output Directory mengikuti default Next.js. Jangan gunakan `.hoplite/run.sh` sebagai build command Vercel.
6. Gunakan Node.js **24.x**, sesuai runtime verifikasi lokal saat ini dan salah satu [versi yang didukung Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions). Periksa versi pnpm pada build log; repository menetapkan `pnpm@10.26.0` dan Vercel mendukung [pnpm 10 untuk project baru](https://vercel.com/changelog/automatic-pnpm-v10-support).

Setiap push ke branch yang dipilih sebagai production akan memicu deploy production. Push ke branch lain membuat preview. Jika env atau production branch baru diatur setelah deploy awal, buat deployment Production baru/redeploy dengan konfigurasi yang benar. Rujukan: [Deploying Git Repositories with Vercel](https://vercel.com/docs/git), [Production Branch](https://vercel.com/kb/guide/can-i-use-a-non-default-branch-for-production), dan [Deploying Next.js](https://nextjs.org/docs/app/getting-started/deploying).

### Pilih plan sesuai penggunaan

Portoferry menawarkan layanan bisnis. Dokumen Vercel menyatakan Hobby dibatasi untuk penggunaan personal/non-komersial; karena itu **jangan menganggap Hobby otomatis sesuai** hanya karena gratis. Baca [Hobby Plan](https://vercel.com/docs/plans/hobby), [Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines), dan [Pricing](https://vercel.com/pricing), lalu pilih plan yang mematuhi syarat penggunaan serta kebutuhan bisnis saat ini. Ini bukan konfirmasi bahwa akun Hobby boleh dipakai untuk website layanan Ferry.

## 2. Buat dan konfigurasi Supabase

### Jalankan migration

1. Buat project Supabase baru atau pilih project yang akan menjadi backend Portoferry.
2. Buka **SQL Editor**.
3. Jalankan seluruh isi [`001_portfolio.sql`](../supabase/migrations/001_portfolio.sql), [`002_article_category.sql`](../supabase/migrations/002_article_category.sql), lalu [`003_post_media.sql`](../supabase/migrations/003_post_media.sql), berurutan. Ketiga migrasi aman dijalankan ulang.
4. Pastikan tabel `projects`, `site_settings`, `admin_users`, fungsi `public.is_admin()`, policy RLS, bucket `project-images`, dan kategori Artikel berhasil disiapkan.

Migration membuat satu baris `site_settings`; tabel `projects` tetap kosong sampai proyek nyata dibuat. Katalog kosong setelah tersambung bukan error dan data `/admin/demo` tidak ikut berpindah. Tidak ada seed klien fiktif yang perlu dipublikasikan. Deploy Vercel tidak menjalankan migration SQL secara otomatis.

### Menambahkan kategori Artikel pada database yang sudah berjalan

Untuk situs yang sudah memakai migrasi `001`, jalankan **hanya** [`002_article_category.sql`](../supabase/migrations/002_article_category.sql) lewat **Supabase → SQL Editor → New query → Run**. Migrasi mengganti constraint kategori dalam satu transaksi; kelima kategori lama tetap diterima, ditambah `Artikel`. Proyek yang sudah ada, gambar Storage, dan policy akses tidak diubah. Jalankan sebelum memakai kategori baru pada admin live.

Setelah berhasil, refresh `/admin`, pilih **Tambah proyek → Kategori → Artikel**, lalu isi judul, ringkasan, dan isi tulisan. Simpan sebagai draft dahulu dan buka ulang untuk memeriksa isinya sebelum diterbitkan. Bila muncul pesan “Kategori Artikel belum aktif di database”, migrasi belum diterapkan pada project Supabase yang dipakai production; push/deploy Vercel saja tidak menjalankan SQL ini.

Regresi SQL tersedia di `tests/sql/article-migration.sql`; jalankan hanya pada database uji sekali pakai yang sudah menerapkan migrasi `001`, bukan database produksi. Pengujian memeriksa penerimaan Artikel, penolakan kategori lain, keamanan menjalankan migrasi ulang, serta data dan policy yang tetap utuh.

### Menambahkan gambar tulisan dan crop thumbnail

Untuk situs yang sudah berjalan, buka [`003_post_media.sql`](../supabase/migrations/003_post_media.sql), salin **seluruh isi file**, lalu jalankan di **Supabase → SQL Editor → New query → Run** pada project production yang benar. Deploy Vercel tidak menjalankan langkah ini.

Migrasi menambahkan `body_images` (default daftar kosong) dan `thumbnail_crop` (default tanpa crop khusus), beserta validasi struktur/jumlah gambar dan batas posisi/zoom. Judul, isi, kategori, URL sampul, gambar Storage, dan RLS/policy akses lama tidak diubah. Skrip juga menyegarkan schema cache PostgREST. Jalankan sekali sebelum menyimpan fitur media; skrip idempotent bila perlu dijalankan ulang. Migrasi `002` tetap diperlukan terpisah untuk kategori Artikel.

Sesudah berhasil:

1. Refresh `/admin` dan edit satu posting sebagai draft.
2. Tambahkan tiga gambar tulisan, pilih letaknya di antara paragraf, lalu cek **Preview isi tulisan**.
3. Upload sampul lebar, buka **Atur thumbnail 1:1**, geser/zoom, lalu **Simpan proyek**.
4. Buka ulang dan pastikan posisi gambar serta crop tersimpan sebelum menerbitkan. Di halaman detail, sampul dan gambar tulisan tetap utuh.

Sebelum migrasi, posting lama masih dapat ditampilkan dan diedit selama tidak memakai field baru. Menyimpan pengaturan media akan ditolak dengan petunjuk `003_post_media.sql`; editor mempertahankan draf. Tidak ada retry yang membuang gambar/crop tanpa pemberitahuan.

Pengujian SQL ada di [`tests/sql/post-media-migration.sql`](../tests/sql/post-media-migration.sql). Jalankan **hanya pada database sekali pakai** setelah migrasi `001` dan `002`, bukan production; pengujian memeriksa idempotensi, pelestarian data/RLS/Storage, serta penolakan payload media yang tidak valid.

### Buat user admin pertama

1. Di Supabase buka **Authentication → Users → Add user**.
2. Buat akun email/password manual, gunakan password unik dan kuat, lalu aktifkan **Auto Confirm User** untuk akun tersebut.
3. Nonaktifkan **Allow new users to sign up** di konfigurasi Auth (**Sign In / Providers**); biarkan anonymous sign-ins nonaktif. Panel ini hanya membutuhkan akun yang dibuat pemilik; jangan membuka pendaftaran publik.
4. Salin UUID user dari daftar Auth.
5. Di **SQL Editor**, masukkan UUID itu ke allowlist:

   ```sql
   insert into public.admin_users (user_id)
   values ('UUID_USER_AUTH')
   on conflict (user_id) do nothing;
   ```

   Ganti `UUID_USER_AUTH` dengan UUID aktual. Jalankan SQL ini sebagai pengelola project, bukan dari frontend.

Jangan menyimpan password, service-role key, atau token di repository. Aplikasi memakai sesi Supabase Auth, server guard, fungsi `is_admin()`, dan RLS; hanya user yang ada di `admin_users` yang boleh mengubah proyek/pengaturan.

Rujukan resmi: [Supabase password Auth](https://supabase.com/docs/guides/auth/passwords), [General Auth configuration](https://supabase.com/docs/guides/auth/general-configuration), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), dan [Storage buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals).

### Ambil env yang benar

Ambil **Project URL** dari dialog **Connect**, serta **publishable key** (`sb_publishable_...`) dari **Connect** atau **Settings → API Keys**. Project URL bukan connection string Postgres. Salin ke env Vercel berikut; jangan gunakan secret key (`sb_secret_...`) atau legacy service-role key. Lihat [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
NEXT_PUBLIC_SITE_URL=https://portoferry.my.id
```

Di Vercel buka **Project → Settings → Environment Variables**. Isi **Production**. Untuk Preview yang memerlukan backend, gunakan project Supabase terpisah agar pengujian tidak mengubah data produksi. Env Preview yang kosong sengaja memakai mode demo. Setelah menambah/mengganti env, deploy ulang karena nilai `NEXT_PUBLIC_` masuk saat build. Untuk lokal, simpan nilai di `.env.local` yang di-ignore Git. Next.js memuat env dari file `.env*`; lihat [Environment Variables Next.js](https://nextjs.org/docs/app/guides/environment-variables).

## 3. Hubungkan domain Dewabiz ke Vercel

Domain yang akan dipakai adalah `portoferry.my.id`, dibeli melalui `my.dewabiz.com`. Nameserver yang diberikan saat ini:

```text
ns1.dewabiz.co.id
ns2.dewabiz.co.id
```

### Tambahkan domain di Vercel

1. Di project Vercel buka **Settings → Domains**.
2. Tambahkan `portoferry.my.id`.
3. Tambahkan `www.portoferry.my.id` jika ingin versi `www` aktif atau dialihkan.
4. Catat record **A/CNAME/TXT yang persis ditampilkan kartu domain project**. Nilai dapat berbeda menurut project dan dapat berubah; jangan menyalin IP legacy dari blog atau panduan lama.

### Edit DNS di Dewabiz tanpa mengganggu email

1. Sebelum mengubah apa pun, periksa nameserver authoritative:

   ```bash
   dig NS portoferry.my.id +short
   ```

   Hasil harus menunjukkan provider yang mengelola DNS saat ini. Jika bukan Dewabiz, edit di provider yang benar, bukan di panel yang hanya menjadi registrar.

2. Pertahankan nameserver default Dewabiz di atas. Jangan memindahkan nameserver ke Vercel untuk prosedur ini.
3. Di panel DNS/DNS Management Dewabiz, buat atau ubah hanya record yang diminta Vercel untuk apex dan `www`, menggunakan **nilai exact dari Vercel**.
4. Pertahankan seluruh record `MX` dan `TXT` yang dipakai email, SPF, DKIM, DMARC, atau verifikasi layanan lain. Jangan menghapus atau mengganti record tersebut hanya karena menambahkan domain Vercel.
5. Jika Vercel meminta TXT untuk verifikasi kepemilikan, tambahkan TXT tersebut tanpa menghapus TXT yang sudah ada.
6. Tunggu propagasi, lalu cek kembali:

   ```bash
   dig NS portoferry.my.id +short
   dig A portoferry.my.id +short
   dig CNAME www.portoferry.my.id +short
   ```

   Nilai hasil harus dibandingkan dengan instruksi pada halaman Domains Vercel. Propagasi dapat memerlukan waktu; jangan mengubah record berulang kali sebelum hasil resolver berubah.

Rujukan: [Dewabiz nameserver](https://docs.dewabiz.co.id/en/configuration/nameserver), [Dewabiz DNS record](https://www.dewabiz.com/blog/cara-mengatur-dns-record-pada-dewabiz), [Vercel custom domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain), dan [Vercel domain troubleshooting](https://vercel.com/docs/domains/troubleshooting).

## 4. Verifikasi setelah setup

Lakukan checklist ini menggunakan project dan akun nyata:

- [ ] `pnpm install --frozen-lockfile` berhasil dengan Node 22+.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, dan `pnpm test:e2e` dijalankan.
- [ ] Situs publik terbuka pada preview URL Vercel.
- [ ] `/admin` meminta login, bukan menampilkan mode demo.
- [ ] `/admin/demo` mengembalikan 404 pada deployment yang sudah dikonfigurasi.
- [ ] Login dengan user Auth yang sudah ada di `admin_users` berhasil.
- [ ] User Auth di luar allowlist ditolak; akses tanpa login tidak boleh menulis proyek, pengaturan, atau Storage.
- [ ] RLS aktif di tiga tabel; Security Advisor dan policy Storage sudah diperiksa pada project nyata.
- [ ] Proyek draft tidak muncul di `/` atau `/proyek`.
- [ ] Semua proyek published muncul di Recent Works dan `/proyek`, termasuk Graphic Design dan AI Consulting. Feed diurutkan dari waktu penambahan terbaru, tidak dibatasi tiga kartu, dan tidak memakai urutan katalog atau tanda unggulan. Draft tetap tidak tampil.
- [ ] Panel admin tidak memiliki checkbox, badge, atau statistik Unggulan. Data proyek lama tetap dapat diedit tanpa mengubah kolom database lama `featured`.
- [ ] Upload gambar JPG/PNG/WebP maksimal 5 MB berhasil di bucket `project-images`.
- [ ] Pengaturan kontak diuji dengan data nyata, lalu link domain apex dan `www` mengarah sesuai status Domains Vercel.
- [ ] SSL/HTTPS dan metadata canonical memakai `NEXT_PUBLIC_SITE_URL` yang benar.

Checklist ini belum merupakan bukti bahwa production sudah aktif. Simpan URL deployment dan hasil pengecekan setelah owner melakukan setup.

## Operasional setelah live

- **Konten:** masuk `/admin`, ubah proyek/pengaturan, lalu simpan. Perubahan database tidak membutuhkan push Git atau deploy baru.
- **Kode/desain:** commit dan push ke production branch untuk production; branch lain tetap preview sesuai pengaturan Vercel.
- **Schema database:** jalankan migration baru di Supabase secara terpisah; auto-deploy Git tidak otomatis mengubah tabel atau policy.
- **Storage:** menghapus proyek tidak menghapus file gambar yang pernah di-upload. Tinjau dan hapus orphan dari Supabase Storage secara manual setelah memastikan file tidak dipakai proyek lain.
- **Backup dan ketersediaan:** pilih paket sesuai kebutuhan bisnis. Project Supabase Free dapat [dijeda setelah aktivitas rendah selama 7 hari](https://supabase.com/docs/guides/platform/free-project-pausing). Siapkan backup database dan file gambar secara terpisah: [backup database tidak mencakup objek Storage](https://supabase.com/docs/guides/platform/backups), dan Free memerlukan ekspor mandiri berkala.
- **Kontak:** bila WhatsApp/email belum diisi, form hanya menyiapkan brief. Setelah diisi, tombol membuka WhatsApp/email tetapi user tetap harus menekan kirim.
