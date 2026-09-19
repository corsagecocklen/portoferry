"use client";

import { ArrowLeft, ArrowUpRight, LoaderCircle, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Logo } from "@/components/logo";
import { login } from "@/app/admin/actions";

export function AdminLogin() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const result = await login(email, password);

        if (!result.success) {
          setError(result.error);
          return;
        }

        router.push("/admin");
        router.refresh();
      } catch {
        setError("Login gagal. Coba lagi beberapa saat.");
      }
    });
  }

  return (
    <main className="admin-centered-page">
      <section className="admin-login-card" aria-labelledby="login-title">
        <div className="admin-login-topline">
          <Logo />
          <span className="admin-lock-mark" aria-hidden="true"><LockKeyhole size={17} /></span>
        </div>
        <span className="admin-kicker">PORTOFERRY / ADMIN</span>
        <h1 id="login-title">Masuk untuk mengelola karya.</h1>
        <p className="admin-login-intro">Satu tempat untuk memperbarui proyek yang ingin kamu tampilkan.</p>
        <form className="admin-login-form" onSubmit={submit} aria-busy={isPending}>
          <label className="field" htmlFor="admin-email">
            Email admin
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@domain.com"
              required
              disabled={isPending}
            />
          </label>
          <label className="field" htmlFor="admin-password">
            Password
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isPending}
            />
          </label>
          {error && <p className="admin-inline-error" role="alert">{error}</p>}
          <button className="button button-primary admin-login-submit" type="submit" disabled={isPending}>
            {isPending ? <LoaderCircle className="admin-spin" size={17} aria-hidden="true" /> : <ArrowUpRight size={17} aria-hidden="true" />}
            {isPending ? "Memeriksa…" : "Masuk ke admin"}
          </button>
          <p className="admin-form-status" aria-live="polite">{isPending ? "Sedang memeriksa akses…" : ""}</p>
        </form>
        <Link className="admin-back-link" href="/"><ArrowLeft size={15} /> Kembali ke situs</Link>
      </section>
    </main>
  );
}
