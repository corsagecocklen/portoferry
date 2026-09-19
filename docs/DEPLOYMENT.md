# Deployment Portoferry

Panduan ini memasang aplikasi ke Supabase, menghubungkannya ke Vercel, lalu mengarahkan `portoferry.my.id` yang dikelola di Dewabiz. Tidak ada deployment atau kredensial nyata yang diverifikasi dari workspace ini.

## Gambaran arsitektur

- **Kode dan deploy:** GitHub `corsagecocklen/portoferry` → Vercel.
- **Auth, database, dan gambar upload:** Supabase Auth, Postgres, RLS, dan bucket `project-images`.
- **DNS:** nameserver tetap di Dewabiz; record DNS authoritative diedit di panel Dewabiz.
- **Update konten:** perubahan proyek/pengaturan dari admin masuk ke Supabase dan tampil setelah revalidasi, tanpa menunggu push kode atau deploy Vercel.
- **Update kode/desain:** push ke production branch membuat production deployment; branch lain membuat preview deployment melalui integrasi Git Vercel.

## 1. Siapkan repository di GitHub

Gunakan repository `corsagecocklen/portoferry`. Pilih branch yang berisi aplikasi ini sebagai production branch; jangan mengasumsikan namanya `main`.

1. Pastikan file aplikasi dan migration ikut berada di repository.
2. Di Vercel pilih **Add New → Project → Import Git Repository**.
3. Pilih `corsagecocklen/portoferry`.
4. Atur **Settings → Git → Production Branch** ke branch aplikasi yang dipilih. Nama branch harus sama dengan yang tersedia di GitHub.
5. Biarkan Vercel mendeteksi Next.js. Root directory adalah root repository dan build memakai script `pnpm build` dari `package.json`.

Setiap push ke branch yang dipilih sebagai production akan memicu deploy production. Push ke branch lain membuat preview. Rujukan: [Deploying Git Repositories with Vercel](https://vercel.com/docs/git) dan [Deploying Next.js](https://nextjs.org/docs/app/getting-started/deploying).

### Pilih plan sesuai penggunaan

Portoferry menawarkan layanan bisnis. Dokumen Vercel menyatakan Hobby dibatasi untuk penggunaan personal/non-komersial; karena itu **jangan menganggap Hobby otomatis sesuai** hanya karena gratis. Baca [Hobby Plan](https://vercel.com/docs/plans/hobby), [Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines), dan [Pricing](https://vercel.com/pricing), lalu pilih plan yang mematuhi syarat penggunaan serta kebutuhan bisnis saat ini. Ini bukan konfirmasi bahwa akun Hobby boleh dipakai untuk website layanan Ferry.

## 2. Buat dan konfigurasi Supabase

### Jalankan migration

1. Buat project Supabase baru atau pilih project yang akan menjadi backend Portoferry.
2. Buka **SQL Editor**.
3. Jalankan seluruh isi [`supabase/migrations/001_portfolio.sql`](../supabase/migrations/001_portfolio.sql). Migration dirancang idempoten.
4. Pastikan tabel `projects`, `site_settings`, `admin_users`, fungsi `public.is_admin()`, policy RLS, dan bucket `project-images` berhasil dibuat.

Migration membuat satu baris `site_settings`; tabel `projects` tetap kosong sampai proyek nyata dibuat. Tidak ada seed klien fiktif yang perlu dipublikasikan.

### Buat user admin pertama

1. Di Supabase buka **Authentication → Users → Add user**.
2. Buat akun email/password manual, gunakan password unik dan kuat, lalu aktifkan **Auto Confirm User** untuk akun tersebut.
3. Nonaktifkan **Allow new users to sign up** di konfigurasi Auth. Panel ini hanya membutuhkan akun yang dibuat pemilik; jangan membuka pendaftaran publik.
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

Salin URL project dan **publishable key** dari Supabase ke env Vercel berikut. Migration dan aplikasi tidak memerlukan service-role key.

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
NEXT_PUBLIC_SITE_URL=https://portoferry.my.id
```

Di Vercel buka **Project → Settings → Environment Variables**. Isi setidaknya **Production**; isi Preview juga jika preview harus membaca project Supabase yang sama. Untuk lokal, simpan nilai di `.env.local` yang di-ignore Git. Next.js memuat env dari file `.env*`; lihat [Environment Variables Next.js](https://nextjs.org/docs/app/guides/environment-variables).

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
- [ ] Login dengan user Auth yang sudah ada di `admin_users` berhasil.
- [ ] Proyek draft tidak muncul di `/` atau `/proyek`.
- [ ] Proyek published muncul di `/proyek`; proyek published + featured di kategori utama dapat masuk feed beranda.
- [ ] Upload gambar JPG/PNG/WebP maksimal 5 MB berhasil di bucket `project-images`.
- [ ] Pengaturan kontak diuji dengan data nyata, lalu link domain apex dan `www` mengarah sesuai status Domains Vercel.
- [ ] SSL/HTTPS dan metadata canonical memakai `NEXT_PUBLIC_SITE_URL` yang benar.

Checklist ini belum merupakan bukti bahwa production sudah aktif. Simpan URL deployment dan hasil pengecekan setelah owner melakukan setup.

## Operasional setelah live

- **Konten:** masuk `/admin`, ubah proyek/pengaturan, lalu simpan. Perubahan database tidak membutuhkan push Git atau deploy baru.
- **Kode/desain:** commit dan push ke production branch untuk production; branch lain tetap preview sesuai pengaturan Vercel.
- **Storage:** menghapus proyek tidak menghapus file gambar yang pernah di-upload. Tinjau dan hapus orphan dari Supabase Storage secara manual setelah memastikan file tidak dipakai proyek lain.
- **Kontak:** bila WhatsApp/email belum diisi, form hanya menyiapkan brief. Setelah diisi, tombol membuka WhatsApp/email tetapi user tetap harus menekan kirim.
