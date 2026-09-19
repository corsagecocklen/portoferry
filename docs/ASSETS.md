# Assets dan provenance

Asset di bawah adalah file yang saat ini disiapkan untuk Portoferry. File turunan publik berada di `public/images/`; attachment asli pengguna berada di area workspace privat yang di-ignore Git dan tidak perlu dimasukkan ke repository.

## Asset publik yang dikomit

| File | Ukuran | Pemakaian | Sumber/provenance |
| --- | ---: | --- | --- |
| `ferry-landing.webp` | 1920×1072 | Satu foto tetap untuk seluruh slide hero beranda. | Versi WebP dari `Change_design_using_face_2K_20260919154051.jpeg` yang diberikan pengguna; diperkecil dari 2752×1536 tanpa mengubah wajah, pakaian, atau latar. Metadata asli tidak disertakan. |
| `ferry-hero.webp` | 1000×1121 | Cutout awal; sumber artwork proyek dan social preview sebelumnya. | Turunan terproses dari poster/foto Ferry yang diberikan pengguna. |
| `ferry-formal.webp` | 896×1200 | Potret di halaman IT Consulting. | Versi WebP dari foto setengah badan berjas yang diberikan pengguna, tanpa metadata asli. |
| `ferry-formal-cutout.webp` | 677×1116 | Asset hero sebelumnya; tidak dipakai oleh hero aktif. | Turunan foto berjas yang sama; latar dihapus dan tepi diperhalus secara lokal, tanpa mengganti wajah atau pakaian. |
| `ferry-portrait.webp` | 650×813 | Potret bagian “Tentang”. | Turunan terproses dari foto wajah Ferry yang diberikan pengguna. |
| `ferry-avatar.webp` | 96×96 | Avatar pada kartu feed proyek. | Crop terproses dari foto Ferry yang diberikan pengguna. |
| `project-profile.webp` | 1000×1000 | Kartu eksplorasi visual/profil. | Turunan terproses dari poster desain yang diberikan pengguna; jangan dianggap endorsement merek yang tampak di referensi. |
| `project-portoferry.webp` | 1000×1000 | Kartu konsep website Portoferry. | Artwork ilustratif yang dibuat khusus untuk tampilan portfolio. |
| `project-kopi.webp` | 1000×1000 | Kartu konsep “Ruang Kopi”. | Artwork ilustratif mandiri dengan foto kopi Unsplash ter-embed; bukan pekerjaan klien. |
| `project-jeda.webp` | 1000×1000 | Kartu konsep “Di antara jeda”. | Artwork ilustratif mandiri dengan foto hutan Unsplash ter-embed; bukan video final/pekerjaan klien. |
| `project-system.webp` | 1000×1000 | Kartu konsep pemetaan sistem. | Ilustrasi UI/workflow yang dibuat khusus; bukan implementasi bisnis nyata. |
| `project-ai.webp` | 1000×1000 | Kartu konsep AI workflow. | Ilustrasi UI yang dibuat khusus; bukan produk AI aktif. |
| `og-portoferry-v2.jpg` | 1200×630 | Gambar share Open Graph/Twitter saat ini. | Dibuat dari hero `ferry-landing.webp` yang disetujui, dengan headline dan copy layanan Portoferry saat ini; regenerasi memakai `node scripts/generate-og-image.mjs`. |
| `og-portoferry.jpg` | 1200×630 | Gambar share legacy; tidak lagi direferensikan metadata. | Komposisi sebelumnya dipertahankan agar URL versi lama tidak hilang tiba-tiba. |
| `project-placeholder.svg` | 1000×1000 viewBox | Fallback ketika gambar proyek belum tersedia. | SVG internal sederhana. |

`public/icon.svg` dan `src/app/icon.svg` adalah ikon aplikasi. Ikon UI lain berasal dari [Lucide](https://lucide.dev/) dengan lisensi ISC. Font Manrope dan Instrument Serif dipasang lewat Fontsource dengan lisensi OFL; cek file lisensi paket saat mendistribusikan ulang.

## Regenerasi artwork share

Artwork share dibuat dari asset hero yang sudah dikomit agar perubahan dapat diulang tanpa dependency baru:

```bash
node scripts/generate-og-image.mjs
```

## Asset pengguna dan consent

Foto dan desain Ferry dipakai dengan izin untuk portfolio ini. Attachment asli—termasuk foto wajah, poster desain, dan screenshot referensi—tetap privat; yang dipakai publik adalah versi yang sudah diproses dan dikomit di `public/images/`. Jangan menyalin attachment mentah ke `public/` atau mengunggahnya ke issue/PR publik tanpa izin baru.

Jika izin ditarik atau asset harus diganti:

1. Hapus/ganti semua turunan terkait di `public/images/` dan referensi kontennya.
2. Cari URL asset lama di data proyek dan Storage Supabase.
3. Deploy perubahan kode, lalu cek cache/CDN dan preview/production.
4. Hapus file Storage yang tidak lagi diperlukan setelah memastikan tidak dipakai proyek lain.

## Foto stok Unsplash pada artwork konsep

Artwork konsep menggunakan foto stok berikut sebagai elemen visual, bukan sebagai klaim karya klien:

- Kopi: [`photo-1442512595331-e89e73853f31`](https://images.unsplash.com/photo-1442512595331-e89e73853f31)
- Hutan: [`photo-1441974231531-c6227db76b6e`](https://images.unsplash.com/photo-1441974231531-c6227db76b6e)

Tinjau [Unsplash License](https://unsplash.com/license) sebelum membuat turunan baru atau memakai foto stok lain. Simpan URL sumber dan status lisensi ketika menambah asset, terutama jika artwork dipakai di luar website.

## Aturan upload dari admin

- Format yang diterima: JPEG, PNG, WebP.
- Ukuran maksimal live: 5 MB.
- Live menyimpan file ke bucket publik Supabase `project-images` dan menghasilkan public URL.
- Mode demo memproses gambar di browser dan menyimpan snapshot lokal; gambar demo tidak masuk Storage atau website publik.
- Project URL dapat dipakai untuk menautkan video/hasil eksternal HTTPS, tetapi aplikasi ini tidak menyediakan bucket footage privat.

Jangan mengunggah materi rahasia dengan asumsi status draft menyembunyikan file. Metadata proyek draft dilindungi, tetapi URL file pada bucket publik dapat diakses siapa pun yang memilikinya.

## Arah visual

Referensi desain pengguna diterjemahkan menjadi komposisi editorial gelap, aksen biru es, tipografi sans yang rapat, dan aksen serif miring. [No AI Slop](https://github.com/petergyang/no-ai-slop) dipakai untuk kualitas **writing**, bukan sebagai sumber aturan visual. Semua konsep yang bukan pekerjaan klien harus tetap diberi penanda `is_concept` dan ditulis apa adanya.
