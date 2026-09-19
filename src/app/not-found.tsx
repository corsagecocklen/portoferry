import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return <main className="error-page"><Logo /><span className="eyebrow">404 / SALAH BELOK SEDIKIT</span><h1>Halaman ini<br /><em>nggak ketemu.</em></h1><p>Proyeknya mungkin masih draft, sudah dipindah, atau tautannya keliru.</p><Link className="button button-primary" href="/proyek"><ArrowLeft size={18} /> Lihat semua proyek</Link></main>;
}
