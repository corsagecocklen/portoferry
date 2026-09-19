"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="error-page"><span className="eyebrow">SEBENTAR, ADA KENDALA</span><h1>Belum bisa<br /><em>memuat halaman.</em></h1><p>Data sedang sulit diakses. Coba lagi sebentar, ya.</p><button className="button button-primary" onClick={reset}><RefreshCw size={18} /> Coba lagi</button><Link className="text-link" href="/">Kembali ke beranda</Link></main>;
}
