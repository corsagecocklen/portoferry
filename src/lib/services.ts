import type { Category } from "./types";

export type ServiceCategory = Extract<
  Category,
  "Web Development" | "Video Editing" | "IT Consulting"
>;

export type ServiceSlug =
  | "web-development"
  | "video-editing"
  | "it-consulting";

export type ServiceVisual = "web" | "video" | "consulting";

export type ServiceDeliverable = {
  title: string;
  description: string;
  items: string[];
};

export type ServiceStep = {
  title: string;
  description: string;
};

export type ServiceFaq = {
  question: string;
  answer: string;
};

export type Service = {
  slug: ServiceSlug;
  title: string;
  category: ServiceCategory;
  number: string;
  visual: ServiceVisual;
  eyebrow: string;
  heroAccent: string;
  heroDescription: string;
  heroNote: string;
  deliverablesIntro: string;
  deliverables: ServiceDeliverable[];
  process: ServiceStep[];
  timeline: string;
  revisions: string;
  faqs: ServiceFaq[];
};

export const services = [
  {
    slug: "web-development",
    title: "Web Development",
    category: "Web Development",
    number: "01",
    visual: "web",
    eyebrow: "WEB DEVELOPMENT",
    heroAccent: "Website yang bekerja.",
    heroDescription:
      "Saya buat landing page, company profile, dan web app yang nyaman dibuka di HP. Kita susun halamannya agar pengunjung bisa mengenal usahamu dan menghubungi kamu.",
    heroNote:
      "Isi, fitur, dan jadwal disepakati sebelum pengerjaan dimulai.",
    deliverablesIntro:
      "Struktur halaman, tampilan, dan fondasi teknis dirancang supaya pengunjung tahu harus melakukan apa.",
    deliverables: [
      {
        title: "Landing page & company profile",
        description:
          "Halaman fokus untuk memperkenalkan bisnis, layanan, produk, atau campaign.",
        items: [
          "Struktur informasi dan CTA yang mudah dipahami",
          "Layout responsif untuk ponsel dan desktop",
          "Form kontak, tautan, dan konten yang siap kamu kelola",
        ],
      },
      {
        title: "Web app & admin panel",
        description:
          "Antarmuka dan alur data untuk kebutuhan yang lebih dari sekadar halaman statis.",
        items: [
          "Pemetaan peran, data, dan alur kerja",
          "Fitur yang dibangun bertahap sesuai prioritas",
          "Handover dan panduan penggunaan setelah tayang",
        ],
      },
      {
        title: "Perapian sebelum tayang",
        description:
          "Pengecekan dasar agar website tidak berhenti di layar desain.",
        items: [
          "Optimasi dasar struktur dan aset",
          "Uji tampilan di ukuran layar utama",
          "Checklist akses, konten, dan langkah berikutnya",
        ],
      },
    ],
    process: [
      {
        title: "Brief & struktur",
        description:
          "Kita sepakati tujuan, audiens, isi, referensi, dan batas lingkup terlebih dahulu.",
      },
      {
        title: "Arah visual",
        description:
          "Saya susun hierarki halaman dan arah tampilan sebelum detail teknis dikerjakan.",
      },
      {
        title: "Build & review",
        description:
          "Website dibangun responsif, lalu kamu memberi masukan dalam putaran revisi yang disepakati.",
      },
      {
        title: "Tayang & handover",
        description:
          "Setelah final, kita cek bersama dan saya jelaskan cara update atau melanjutkan pengembangannya.",
      },
    ],
    timeline:
      "Landing page sederhana bisa dikerjakan sekitar 1 jam hanya jika brief, teks, foto, dan akses sudah siap serta lingkupnya disepakati. Halaman berjumlah banyak, integrasi, atau fitur khusus tentu membutuhkan waktu lebih panjang.",
    revisions:
      "Jumlah putaran revisi visual dan konten dibahas sejak awal. Penambahan halaman, fitur, atau perubahan arah besar di tengah proses perlu disepakati ulang.",
    faqs: [
      {
        question: "Apakah website sederhana benar-benar bisa selesai 1 jam?",
        answer:
          "Bisa dibahas untuk landing page sederhana dengan struktur siap, brief jelas, teks dan foto lengkap, serta scope yang sudah disepakati. Waktu dihitung setelah bahan siap; website dengan fitur khusus tidak masuk janji tersebut.",
      },
      {
        question: "Kalau saya belum punya desain, mulai dari mana?",
        answer:
          "Ceritakan bisnis, pengunjung yang ingin kamu ajak bicara, dan tindakan yang diharapkan. Saya bantu menyusun struktur serta arah visual sebelum masuk ke detail.",
      },
      {
        question: "Apakah bisa dibuatkan admin panel?",
        answer:
          "Bisa, jika memang membantu alur kerja. Kita petakan data dan peran yang diperlukan dulu, lalu menentukan fitur minimum sebelum membangun sisanya.",
      },
    ],
  },
  {
    slug: "video-editing",
    title: "Video Editing",
    category: "Video Editing",
    number: "02",
    visual: "video",
    eyebrow: "VIDEO EDITING",
    heroAccent: "Rapikan footage‑mu.",
    heroDescription:
      "Saya susun footage menjadi Reels, video promosi, atau dokumentasi. Potongan, audio, subtitle, dan warna dirapikan sesuai bahan serta gaya yang kamu pilih.",
    heroNote:
      "Materi konsep di halaman ini adalah eksplorasi visual, bukan video final yang bisa diputar.",
    deliverablesIntro:
      "Kamu kirim bahan dan referensi. Saya bantu memilih momen, menyusun urutan, lalu menyiapkan file untuk kanal publikasinya.",
    deliverables: [
      {
        title: "Short-form content",
        description:
          "Video vertikal untuk Reels, TikTok, Shorts, atau kanal sosial lainnya.",
        items: [
          "Seleksi momen dan susunan hook",
          "Subtitle, text overlay, dan format vertikal",
          "Versi final sesuai spesifikasi kanal",
        ],
      },
      {
        title: "Video promosi & profil",
        description:
          "Potongan gambar dan suara yang membawa penonton memahami produk atau cerita.",
        items: [
          "Rough cut dari brief dan bahan yang tersedia",
          "Penataan musik, suara, warna, dan transisi secukupnya",
          "Arahan format ekspor dan kebutuhan publikasi",
        ],
      },
      {
        title: "Dokumentasi & cerita personal",
        description:
          "Editing yang memberi ruang pada suasana, urutan kejadian, dan detail kecil.",
        items: [
          "Penyusunan alur dari footage panjang",
          "Pilihan tempo sesuai suasana yang dituju",
          "File review dan final setelah revisi disepakati",
        ],
      },
    ],
    process: [
      {
        title: "Bahan & tujuan",
        description:
          "Kita cek footage, audio, referensi, durasi, kanal, dan siapa penontonnya.",
      },
      {
        title: "Rough cut",
        description:
          "Cerita dan urutan utama disusun dulu supaya revisi tidak tersesat di detail kecil.",
      },
      {
        title: "Polish & review",
        description:
          "Suara, warna, teks, dan ritme dirapikan lalu dikirim untuk masukan yang terarah.",
      },
      {
        title: "Export",
        description:
          "File final diekspor sesuai kebutuhan publikasi yang telah disepakati.",
      },
    ],
    timeline:
      "Waktu pengerjaan bergantung pada durasi footage, kerumitan cerita, kebutuhan subtitle atau motion, dan seberapa cepat bahan review tersedia. Estimasi diberikan setelah bahan dan lingkup dilihat.",
    revisions:
      "Revisi dilakukan berdasarkan putaran yang disepakati, idealnya dengan catatan yang terkumpul. Perubahan arah cerita atau tambahan materi setelah rough cut dapat mengubah waktu pengerjaan.",
    faqs: [
      {
        question: "Bisa edit untuk Reels atau TikTok?",
        answer:
          "Bisa. Kita tentukan durasi, rasio, gaya subtitle, dan tujuan videonya terlebih dahulu agar hasilnya tidak sekadar dipotong ke ukuran vertikal.",
      },
      {
        question: "Apakah contoh di halaman ini adalah video jadi?",
        answer:
          "Bukan. Artwork bertanda studi konsep atau moodboard hanya menunjukkan arah visual; tidak ada klaim sebagai proyek klien dan tidak ada video playable di sini.",
      },
      {
        question: "Bahan apa yang perlu saya siapkan?",
        answer:
          "Siapkan footage atau audio yang boleh digunakan, tujuan video, referensi, teks atau logo bila ada, serta target kanal dan waktu tayang.",
      },
    ],
  },
  {
    slug: "it-consulting",
    title: "IT Consulting",
    category: "IT Consulting",
    number: "03",
    visual: "consulting",
    eyebrow: "IT CONSULTING",
    heroAccent: "Tentukan langkahnya.",
    heroDescription:
      "Saya bantu memetakan masalah IT, membandingkan pilihan sistem, dan menyusun rencana penerapan yang sesuai anggaran serta kebiasaan timmu.",
    heroNote:
      "Kita mulai dari alat dan alur kerja yang sudah kamu pakai.",
    deliverablesIntro:
      "Kamu mendapat catatan masalah, pilihan solusi beserta batasannya, dan urutan pekerjaan yang disepakati.",
    deliverables: [
      {
        title: "Audit kebutuhan & alur kerja",
        description:
          "Memotret bagaimana pekerjaan berjalan dan di titik mana waktu atau informasi sering tersendat.",
        items: [
          "Inventaris alat, data, dan peran yang digunakan",
          "Pemetaan langkah manual dan risiko yang terlihat",
          "Daftar prioritas berdasarkan dampak dan kemampuan tim",
        ],
      },
      {
        title: "Rekomendasi sistem",
        description:
          "Pilihan alat dan rancangan alur yang sesuai dengan konteks, anggaran, dan kesiapan pengguna.",
        items: [
          "Perbandingan opsi beserta batasannya",
          "Rancangan alur data dan akses dasar",
          "Pemisahan kebutuhan wajib dan tambahan yang bisa menyusul",
        ],
      },
      {
        title: "Pendampingan penerapan",
        description:
          "Teman diskusi saat solusi mulai dipakai dan perlu disesuaikan dengan pekerjaan nyata.",
        items: [
          "Rencana langkah penerapan bertahap",
          "Dokumentasi singkat untuk tim",
          "Review setelah penggunaan awal sesuai kesepakatan",
        ],
      },
    ],
    process: [
      {
        title: "Dengar konteks",
        description:
          "Kita mulai dari tujuan usaha, kebiasaan tim, kendala, dan batasan yang tidak boleh diabaikan.",
      },
      {
        title: "Petakan masalah",
        description:
          "Alur kerja dan titik risiko disusun agar kita membahas masalah yang sama, bukan asumsi masing-masing.",
      },
      {
        title: "Pilih langkah",
        description:
          "Rekomendasi diprioritaskan berdasarkan manfaat, biaya, kemampuan tim, dan risiko perpindahan.",
      },
      {
        title: "Dampingi penerapan",
        description:
          "Jika dibutuhkan, saya bantu memecah penerapan menjadi langkah kecil yang bisa ditinjau bersama.",
      },
    ],
    timeline:
      "Kebutuhan konsultasi tidak punya durasi yang bisa dijanjikan sebelum konteksnya dipahami. Sesi awal dipakai untuk menyepakati masalah, keluaran yang dibutuhkan, dan cara kerja yang masuk akal.",
    revisions:
      "Revisi rekomendasi berarti menguji ulang asumsi atau batasan yang berubah. Perubahan tersebut dibicarakan terbuka karena dapat mengubah prioritas, pilihan alat, dan rencana penerapan.",
    faqs: [
      {
        question: "Apakah saya harus sudah tahu software yang ingin dipakai?",
        answer:
          "Tidak. Justru lebih baik kita mulai dari alur kerja dan masalah yang ingin diselesaikan, lalu membandingkan pilihan yang relevan.",
      },
      {
        question: "Apa hasil yang saya terima setelah konsultasi?",
        answer:
          "Bentuknya mengikuti lingkup: bisa berupa peta alur, daftar prioritas, perbandingan opsi, rancangan penerapan, atau dokumentasi singkat untuk tim.",
      },
      {
        question: "Bisa sekaligus dibantu membangun solusinya?",
        answer:
          "Bisa dibahas jika kebutuhan dan batasnya cocok. Konsultasi tetap dipisahkan dari pembangunan supaya keputusan teknisnya bisa ditinjau dengan jernih.",
      },
    ],
  },
] satisfies readonly Service[];

export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}
