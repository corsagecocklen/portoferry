"use client";

import {
  ArrowUpRight,
  Check,
  ExternalLink,
  Folder,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { logout, deleteProject, saveProject, saveSettings } from "@/app/admin/actions";
import { Logo } from "@/components/logo";
import { categories, type Project, type ProjectInput, type SiteSettings } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { settingsSchema } from "@/lib/validation";
import { getThumbnailStyle } from "@/lib/image-crop";

import { downscaleDemoImage, readDemoSnapshot, writeDemoSnapshot } from "./admin-demo-storage";
import type { EditorResult, UploadResult } from "./admin-types";
import { ProjectEditorDialog } from "./project-editor-dialog";

type AdminShellProps = {
  mode: "live" | "demo";
  adminEmail?: string;
  initialProjects: Project[];
  initialSettings: SiteSettings;
};

type ProjectFilter = "all" | "published" | "draft";

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeUploadName(file: File) {
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  return `${makeId()}.${extension}`;
}

function projectImage(project: Project) {
  return project.image_url || "/images/project-placeholder.svg";
}

function formatProjectDate(value: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));
  } catch {
    return "";
  }
}

function ProjectRow({ project, onEdit, onDelete, disabled, demoOnly }: { project: Project; onEdit: (project: Project, target: HTMLButtonElement) => void; onDelete: (project: Project) => void; disabled: boolean; demoOnly: boolean }) {
  const openLabel = `Buka tulisan ${project.title} di tab baru`;
  const openUnavailable = !project.published
    ? "Terbitkan posting terlebih dahulu untuk membuka tulisan."
    : demoOnly
      ? "Posting demo ini hanya tersimpan di browser, bukan di situs publik."
      : disabled ? "Tunggu proses selesai." : null;

  return (
    <li className="admin-project-row">
      <div className="admin-project-thumb">
        <Image src={projectImage(project)} alt="" width={112} height={112} unoptimized style={getThumbnailStyle(project.thumbnail_crop)} />
      </div>
      <div className="admin-project-row-main">
        <div className="admin-project-row-title">
          <h3>{project.title || "Tanpa judul"}</h3>
          <span className={`admin-project-state ${project.published ? "is-published" : "is-draft"}`}>
            <span className="admin-status-dot" aria-hidden="true" />{project.published ? "Terbit" : "Draft"}
          </span>
        </div>
        <p>{project.summary || "Belum ada ringkasan."}</p>
        <div className="admin-project-meta">
          <span>{project.category}</span>
          <span>{project.year}</span>
          <span>{formatProjectDate(project.created_at)}</span>
          {project.is_concept && <span>Studi konsep</span>}
        </div>
      </div>
      <div className="admin-project-actions">
        <button className="icon-button" type="button" onClick={(event) => onEdit(project, event.currentTarget)} aria-label={`Edit ${project.title}`} title="Edit proyek" disabled={disabled}><Pencil size={17} /></button>
        {openUnavailable ? (
          <button className="icon-button admin-project-open" type="button" aria-label={`${openLabel}. ${openUnavailable}`} title={openUnavailable} disabled>
            <ExternalLink size={17} aria-hidden="true" />
          </button>
        ) : (
          <a className="icon-button admin-project-open" href={`/proyek/${project.slug}`} target="_blank" rel="noopener noreferrer" aria-label={openLabel} title="Buka tulisan di tab baru">
            <ExternalLink size={17} aria-hidden="true" />
          </a>
        )}
        <button className="icon-button admin-danger-button" type="button" onClick={() => onDelete(project)} aria-label={`Hapus ${project.title}`} title="Hapus proyek" disabled={disabled}><Trash2 size={17} /></button>
      </div>
    </li>
  );
}

export function AdminShell({ mode, adminEmail, initialProjects, initialSettings }: AdminShellProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [settingsDraft, setSettingsDraft] = useState<SiteSettings>(initialSettings);
  const [savedSettings, setSavedSettings] = useState<SiteSettings>(initialSettings);
  const [demoReady, setDemoReady] = useState(mode === "live");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editorProjectId, setEditorProjectId] = useState<string | null | undefined>(undefined);
  const [settingsErrors, setSettingsErrors] = useState<Partial<Record<keyof SiteSettings, string>>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const editorTrigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (mode !== "demo") return;

    const snapshot = readDemoSnapshot(initialProjects, initialSettings);
    const timeout = window.setTimeout(() => {
      setProjects(snapshot.projects);
      setSettingsDraft(snapshot.settings);
      setSavedSettings(snapshot.settings);
      setDemoReady(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [initialProjects, initialSettings, mode]);

  const counts = useMemo(() => ({
    published: projects.filter((project) => project.published).length,
    draft: projects.filter((project) => !project.published).length,
    total: projects.length,
  }), [projects]);

  const filteredProjects = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id-ID");

    return [...projects]
      .sort((a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at))
      .filter((project) => {
        const matchesStatus = statusFilter === "all" || (statusFilter === "published" ? project.published : !project.published);
        const matchesCategory = categoryFilter === "all" || project.category === categoryFilter;
        const matchesQuery = !needle || `${project.title} ${project.summary} ${project.tags.join(" ")}`.toLocaleLowerCase("id-ID").includes(needle);
        return matchesStatus && matchesCategory && matchesQuery;
      });
  }, [categoryFilter, projects, query, statusFilter]);

  const editorProject = useMemo(() => {
    if (editorProjectId === null || editorProjectId === undefined) return null;
    return projects.find((project) => project.id === editorProjectId) ?? null;
  }, [editorProjectId, projects]);

  function clearFeedback() {
    setMessage("");
    setError("");
  }

  function openEditor(project: Project | null, target?: HTMLElement) {
    clearFeedback();
    editorTrigger.current = target ?? document.activeElement as HTMLElement;
    setEditorProjectId(project?.id ?? null);
  }

  function closeEditor() {
    setEditorProjectId(undefined);
    window.setTimeout(() => editorTrigger.current?.focus({ preventScroll: true }), 0);
  }

  function saveDemoState(nextProjects: Project[], nextSettings = savedSettings) {
    if (writeDemoSnapshot(nextProjects, nextSettings)) return true;
    setError("Perubahan tidak tersimpan. Penyimpanan browser mungkin penuh.");
    return false;
  }

  async function handleProjectSave(input: ProjectInput): Promise<EditorResult> {
    clearFeedback();
    setBusy(true);

    try {
      if (mode === "demo") {
        if (!demoReady) return { success: false, error: "Demo sedang disiapkan. Coba lagi." };
        if (projects.some((project) => project.slug === input.slug && project.id !== editorProjectId)) {
          return { success: false, error: "Slug sudah dipakai proyek lain. Pilih slug berbeda." };
        }

        const current = editorProjectId ? projects.find((project) => project.id === editorProjectId) : undefined;
        const saved: Project = {
          ...input,
          id: current?.id ?? makeId(),
          created_at: current?.created_at ?? new Date().toISOString(),
        };
        const nextProjects = current
          ? projects.map((project) => project.id === current.id ? saved : project)
          : [...projects, saved];

        if (!saveDemoState(nextProjects)) return { success: false, error: "Penyimpanan browser penuh. Hapus gambar atau proyek lain lalu coba lagi." };

        setProjects(nextProjects);
        setMessage(current ? "Proyek demo diperbarui di browser ini." : "Proyek demo ditambahkan di browser ini.");
        return { success: true };
      }

      const result = await saveProject(editorProjectId ?? null, input);
      if (!result.success) return { success: false, error: result.error };
      if (!result.data) return { success: false, error: "Proyek tersimpan tanpa data balasan. Muat ulang halaman." };

      setProjects((current) => editorProjectId ? current.map((project) => project.id === result.data!.id ? result.data! : project) : [result.data!, ...current]);
      setMessage("Proyek berhasil disimpan.");
      return { success: true };
    } catch {
      return { success: false, error: "Proyek gagal disimpan. Periksa koneksi lalu coba lagi." };
    } finally {
      setBusy(false);
    }
  }

  async function handleProjectUpload(file: File): Promise<UploadResult> {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Gunakan gambar JPG, PNG, atau WebP. SVG tidak didukung." };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "Ukuran gambar maksimal 5 MB." };
    }

    if (mode === "demo") {
      try {
        const url = await downscaleDemoImage(file);
        return { success: true, url };
      } catch (uploadError) {
        return { success: false, error: uploadError instanceof Error ? uploadError.message : "Gambar demo gagal diproses." };
      }
    }

    try {
      const supabase = createClient();
      const path = makeUploadName(file);
      const { error: uploadError } = await supabase.storage.from("project-images").upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

      if (uploadError) return { success: false, error: "Upload gagal. Pastikan kamu masih memiliki akses admin." };

      const { data } = supabase.storage.from("project-images").getPublicUrl(path);
      if (!data.publicUrl) return { success: false, error: "URL gambar tidak tersedia setelah upload." };
      return { success: true, url: data.publicUrl };
    } catch {
      return { success: false, error: "Upload gagal karena koneksi. Coba lagi." };
    }
  }

  async function handleDelete(project: Project) {
    if (!window.confirm(`Hapus proyek “${project.title}”? Tindakan ini tidak bisa dibatalkan.`)) return;

    clearFeedback();
    setBusy(true);

    try {
      if (mode === "demo") {
        const nextProjects = projects.filter((item) => item.id !== project.id);
        if (!saveDemoState(nextProjects)) return;
        setProjects(nextProjects);
        setMessage("Proyek demo dihapus dari browser ini.");
        return;
      }

      const result = await deleteProject(project.id);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setProjects((current) => current.filter((item) => item.id !== project.id));
      setMessage("Proyek berhasil dihapus.");
    } catch {
      setError("Proyek gagal dihapus. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  function validateSettings(): SiteSettings | null {
    const nextErrors: Partial<Record<keyof SiteSettings, string>> = {};
    const parsed = settingsSchema.safeParse(settingsDraft);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) nextErrors[issue.path[0] as keyof SiteSettings] ??= issue.message;
      setSettingsErrors(nextErrors);
      return null;
    }

    setSettingsErrors({});
    return parsed.data;
  }

  async function handleSettingsSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    if (!demoReady) {
      setError("Demo sedang disiapkan. Coba lagi.");
      return;
    }
    const settings = validateSettings();
    if (!settings) return;

    setBusy(true);

    try {
      if (mode === "demo") {
        if (!saveDemoState(projects, settings)) return;
        setSavedSettings(settings);
        setSettingsDraft(settings);
        setMessage("Pengaturan demo tersimpan di browser ini.");
        return;
      }

      const result = await saveSettings(settings);
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (result.data) {
        setSettingsDraft(result.data);
        setSavedSettings(result.data);
      }
      setMessage("Pengaturan situs berhasil disimpan.");
    } catch {
      setError("Pengaturan gagal disimpan. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    if (mode === "demo") {
      router.push("/admin");
      return;
    }

    clearFeedback();
    setBusy(true);

    try {
      const result = await logout();
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Logout gagal. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Navigasi admin">
        <div className="admin-sidebar-brand"><Logo /><span className="admin-sidebar-label">WORKSPACE</span></div>
        <nav className="admin-sidebar-nav">
          <a className="is-active" href="#overview"><LayoutDashboard size={17} /> Ringkasan</a>
          <a href="#projects"><Folder size={17} /> Proyek <span>{projects.length}</span></a>
          <a href="#settings"><Settings size={17} /> Pengaturan</a>
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-user"><span className="admin-user-avatar">{mode === "demo" ? "D" : (adminEmail?.slice(0, 1).toUpperCase() || "F")}</span><span><strong>{mode === "demo" ? "Mode demo" : "Admin"}</strong><small>{mode === "demo" ? "Browser lokal" : adminEmail}</small></span></div>
          <button className="admin-sidebar-logout" type="button" onClick={handleLogout} disabled={busy}><LogOut size={16} /> {mode === "demo" ? "Keluar demo" : "Keluar"}</button>
        </div>
      </aside>

      <main className="admin-main" id="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb"><span>Portoferry</span><span>/</span><strong>Admin</strong></div>
          <div className="admin-topbar-actions">
            <span className={`admin-mode-pill ${mode === "demo" ? "is-demo" : "is-live"}`}><span className="admin-status-dot" />{mode === "demo" ? "MODE DEMO" : "LIVE"}</span>
            <Link className="admin-site-link" href="/" target="_blank">Lihat situs <ExternalLink size={14} /></Link>
          </div>
        </header>

        {mode === "demo" && <div className="admin-demo-banner" role="note"><span className="admin-banner-mark">i</span><strong>Mode demo</strong><span>· Tersimpan di browser ini, tidak mengubah situs publik.</span></div>}

        <div className="admin-content">
          <section className="admin-overview" id="overview" aria-labelledby="admin-heading">
            <div>
              <span className="admin-kicker">RUANG KERJA / {mode === "demo" ? "DEMO" : "LIVE"}</span>
              <h1 id="admin-heading">Karya yang siap diceritakan.</h1>
              <p>Atur proyek, pilih mana yang ingin terbit, dan jaga cerita setiap karya tetap jelas.</p>
            </div>
            <button className="button button-primary" type="button" onClick={(event) => openEditor(null, event.currentTarget)} disabled={!demoReady || busy}><Plus size={18} /> Tambah proyek</button>
          </section>

          <div className="admin-feedback" aria-live="polite">
            {message && <p className="admin-success-message"><Check size={16} /> {message}</p>}
            {error && <p className="admin-inline-error" role="alert">{error}</p>}
          </div>

          <section className="admin-stats" aria-label="Ringkasan proyek">
            <div className="admin-stat-card"><span>{mode === "demo" ? "Terbit (demo)" : "Terbit"}</span><strong>{counts.published}</strong><small>{mode === "demo" ? "status lokal saja" : "tampil di katalog publik"}</small></div>
            <div className="admin-stat-card"><span>Draft</span><strong>{counts.draft}</strong><small>{mode === "demo" ? "status lokal saja" : "belum ditampilkan"}</small></div>
            <div className="admin-stat-card"><span>Total proyek</span><strong>{counts.total}</strong><small>terbit dan draft</small></div>
          </section>

          <section className="admin-section" id="projects" aria-labelledby="projects-heading">
            <div className="admin-section-heading">
              <div><span className="admin-kicker">KATALOG KARYA</span><h2 id="projects-heading">Semua proyek</h2></div>
              <span className="admin-section-count">{filteredProjects.length} dari {projects.length}</span>
            </div>
            <div className="admin-project-toolbar">
              <label className="admin-search-field" htmlFor="project-search"><Search size={17} /><span className="sr-only">Cari proyek</span><input id="project-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari judul, ringkasan, atau tag" /></label>
              <label className="admin-select-field" htmlFor="project-status"><span className="sr-only">Filter status</span><select id="project-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ProjectFilter)}><option value="all">Semua status</option><option value="published">Terbit</option><option value="draft">Draft</option></select></label>
              <label className="admin-select-field" htmlFor="project-category-filter"><span className="sr-only">Filter kategori</span><select id="project-category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">Semua kategori</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            </div>
            <div className="admin-project-list-wrap">
              {filteredProjects.length > 0 ? <ul className="admin-project-list">{filteredProjects.map((project) => <ProjectRow key={project.id} project={project} onEdit={(item, target) => openEditor(item, target)} onDelete={handleDelete} disabled={busy} demoOnly={mode === "demo" && !initialProjects.some((item) => item.published && item.slug === project.slug)} />)}</ul> : <div className="admin-empty-state"><Search size={22} /><h3>Belum ada yang cocok.</h3><p>Coba ubah kata kunci atau filter yang dipilih.</p></div>}
            </div>
          </section>

          <section className="admin-section admin-settings-section" id="settings" aria-labelledby="settings-heading">
            <div className="admin-section-heading"><div><span className="admin-kicker">KONTAK SITUS</span><h2 id="settings-heading">Pengaturan yang tampil publik</h2></div><MessageCircle size={20} aria-hidden="true" /></div>
            <form className="admin-settings-card" onSubmit={handleSettingsSave} aria-busy={busy || !demoReady} noValidate>
              <div className="admin-settings-copy"><h3>Bagaimana orang menghubungimu?</h3><p>Isi hanya kanal yang siap kamu gunakan. Field kosong tidak akan ditampilkan di situs.</p>{mode === "demo" && <p className="admin-demo-inline-note">Pengaturan ini hanya tersimpan di browser ini.</p>}</div>
              <fieldset className="admin-settings-fields" aria-label="Detail kontak publik" disabled={busy || !demoReady}>
                <label className="field" htmlFor="settings-whatsapp"><span className="admin-field-label-icon"><MessageCircle size={15} /> WhatsApp</span><input id="settings-whatsapp" type="tel" inputMode="tel" value={settingsDraft.whatsapp} onChange={(event) => { setSettingsDraft((current) => ({ ...current, whatsapp: event.target.value })); setSettingsErrors((current) => ({ ...current, whatsapp: undefined })); }} placeholder="08xx xxxx xxxx atau +62 ..." aria-invalid={Boolean(settingsErrors.whatsapp)} aria-describedby={settingsErrors.whatsapp ? "settings-whatsapp-help settings-whatsapp-error" : "settings-whatsapp-help"} disabled={busy} /><span id="settings-whatsapp-help" className="admin-field-help">Terima 08..., 62..., atau +62... dengan spasi, tanda hubung, dan kurung. Disimpan sebagai digit internasional tanpa tanda +.</span>{settingsErrors.whatsapp && <span id="settings-whatsapp-error" className="admin-field-error">{settingsErrors.whatsapp}</span>}</label>
                <label className="field" htmlFor="settings-email"><span className="admin-field-label-icon"><Mail size={15} /> Email</span><input id="settings-email" type="email" autoComplete="email" value={settingsDraft.email} onChange={(event) => { setSettingsDraft((current) => ({ ...current, email: event.target.value })); setSettingsErrors((current) => ({ ...current, email: undefined })); }} placeholder="halo@domain.com" aria-invalid={Boolean(settingsErrors.email)} aria-describedby={settingsErrors.email ? "settings-email-error" : undefined} disabled={busy} />{settingsErrors.email && <span id="settings-email-error" className="admin-field-error">{settingsErrors.email}</span>}</label>
                <label className="field" htmlFor="settings-instagram"><span className="admin-field-label-icon"><ArrowUpRight size={15} /> Instagram</span><input id="settings-instagram" type="url" value={settingsDraft.instagram} onChange={(event) => { setSettingsDraft((current) => ({ ...current, instagram: event.target.value })); setSettingsErrors((current) => ({ ...current, instagram: undefined })); }} placeholder="https://instagram.com/username" aria-invalid={Boolean(settingsErrors.instagram)} aria-describedby={settingsErrors.instagram ? "settings-instagram-error" : undefined} disabled={busy} />{settingsErrors.instagram && <span id="settings-instagram-error" className="admin-field-error">{settingsErrors.instagram}</span>}</label>
                <label className="admin-availability-toggle"><input type="checkbox" checked={settingsDraft.available} onChange={(event) => setSettingsDraft((current) => ({ ...current, available: event.target.checked }))} disabled={busy} /><span><strong>Terima proyek baru</strong><small>Atur status ketersediaan yang terlihat di halaman kontak.</small></span></label>
              </fieldset>
              <div className="admin-settings-actions"><button className="button button-primary" type="submit" disabled={busy || !demoReady}>{busy ? <LoaderCircle className="admin-spin" size={17} /> : <Check size={17} />}{busy ? "Menyimpan…" : "Simpan pengaturan"}</button><span className="admin-form-status" aria-live="polite">{busy ? "Perubahan sedang disimpan…" : ""}</span></div>
            </form>
          </section>
        </div>
      </main>

      <ProjectEditorDialog open={editorProjectId !== undefined} project={editorProject} mode={mode} onClose={closeEditor} onSave={handleProjectSave} onUpload={handleProjectUpload} />
    </div>
  );
}
