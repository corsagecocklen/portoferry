"use client";

import { ImagePlus, LoaderCircle, Save, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { ProjectCard } from "@/components/project-card";
import { categories, type Project, type ProjectInput } from "@/lib/types";

import {
  createBlankProject,
  projectToInput,
  slugify,
  tagsToText,
  textToTags,
  validateProjectInput,
  type EditorResult,
  type ProjectField,
  type UploadResult,
} from "./admin-types";

type ProjectEditorDialogProps = {
  open: boolean;
  project: Project | null;
  mode: "live" | "demo";
  onClose: () => void;
  onSave: (input: ProjectInput) => Promise<EditorResult>;
  onUpload: (file: File) => Promise<UploadResult>;
};

type FieldErrors = Partial<Record<ProjectField, string>>;

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <span id={id} className="admin-field-error">{message}</span> : null;
}

export function ProjectEditorDialog({
  open,
  project,
  mode,
  onClose,
  onSave,
  onUpload,
}: ProjectEditorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<ProjectInput>(createBlankProject);
  const [tagsText, setTagsText] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (!open) return;

    const timeout = window.setTimeout(() => {
      setDraft(project ? projectToInput(project) : createBlankProject());
      setTagsText(project ? tagsToText(project.tags) : "");
      setErrors({});
      setFormError("");
      setUploadError("");
      setSlugEdited(Boolean(project));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [open, project]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    let focusTimeout: number | undefined;

    if (open && !dialog.open) {
      dialog.showModal();
      dialog.scrollTop = 0;
      focusTimeout = window.setTimeout(() => titleRef.current?.focus({ preventScroll: true }), 0);
    }

    if (!open && dialog.open) {
      dialog.close();
    }

    return () => {
      window.clearTimeout(focusTimeout);
      if (dialog.open) dialog.close();
    };
  }, [open]);

  const previewProject = useMemo<Project>(() => ({
    ...draft,
    slug: draft.slug || "preview",
    id: project?.id ?? "preview-project",
    created_at: project?.created_at ?? new Date().toISOString(),
  }), [draft, project]);

  const isArticle = draft.category === "Artikel";

  function updateField<K extends keyof ProjectInput>(field: K, value: ProjectInput[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  function updateTitle(value: string) {
    setDraft((current) => ({
      ...current,
      title: value,
      slug: slugEdited ? current.slug : slugify(value),
    }));
    setErrors((current) => ({ ...current, title: undefined, slug: undefined }));
    setFormError("");
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) return;

    setUploadError("");
    setIsUploading(true);

    try {
      const result = await onUpload(file);

      if (!result.success) {
        setUploadError(result.error);
        return;
      }

      updateField("image_url", result.url);
    } catch {
      setUploadError("Gambar gagal diunggah. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsUploading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const nextErrors = validateProjectInput(draft, mode);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setFormError("Periksa lagi bagian yang masih ditandai.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await onSave({
        ...draft,
        title: draft.title.trim(),
        slug: draft.slug.trim(),
        summary: draft.summary.trim(),
        description: draft.description.trim(),
        image_url: draft.image_url.trim(),
        project_url: draft.project_url.trim(),
        tags: draft.tags.map((tag) => tag.trim()).filter(Boolean),
      });

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      onClose();
    } catch {
      setFormError("Proyek gagal disimpan. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel(event: React.SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    if (isSaving || isUploading) return;
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="admin-dialog"
      aria-labelledby="project-editor-title"
      onCancel={handleCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSaving && !isUploading) onClose();
      }}
    >
      <div className="admin-dialog-panel">
        <div className="admin-dialog-head">
          <div>
            <span className="admin-kicker">{project ? "EDIT PROYEK" : "PROYEK BARU"}</span>
            <h2 id="project-editor-title">{project ? "Rapikan detail proyek." : "Tambahkan karya baru."}</h2>
            <p>{mode === "demo" ? "Perubahan hanya tersimpan di browser ini." : "Perubahan tersimpan ke katalog proyek setelah kamu simpan."}</p>
          </div>
          <button className="icon-button admin-dialog-close" type="button" onClick={onClose} disabled={isSaving || isUploading} aria-label="Tutup editor">
            <X size={20} />
          </button>
        </div>

        <div className="admin-editor-layout">
          <form className="admin-project-form" onSubmit={submit} aria-busy={isSaving || isUploading} noValidate>
            <div className="admin-form-grid admin-form-grid-two">
              <label className="field" htmlFor="project-title">
                {isArticle ? "Judul artikel" : "Judul proyek"}
                <input
                  ref={titleRef}
                  id="project-title"
                  value={draft.title}
                  onChange={(event) => updateTitle(event.target.value)}
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? "project-title-error" : undefined}
                  maxLength={120}
                  required
                />
                <FieldError id="project-title-error" message={errors.title} />
              </label>
              <label className="field" htmlFor="project-slug">
                Slug URL
                <input
                  id="project-slug"
                  value={draft.slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    updateField("slug", slugify(event.target.value));
                  }}
                  aria-invalid={Boolean(errors.slug)}
                  aria-describedby={errors.slug ? "project-slug-error" : undefined}
                  maxLength={80}
                  placeholder="nama-proyek"
                  required
                />
                <FieldError id="project-slug-error" message={errors.slug} />
              </label>
            </div>

            <div className="admin-form-grid admin-form-grid-two">
              <label className="field" htmlFor="project-category">
                Kategori
                <select id="project-category" value={draft.category} onChange={(event) => updateField("category", event.target.value as ProjectInput["category"])}>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className="field" htmlFor="project-year">
                Tahun
                <input
                  id="project-year"
                  type="number"
                  inputMode="numeric"
                  value={Number.isNaN(draft.year) ? "" : draft.year}
                  onChange={(event) => updateField("year", event.target.value === "" ? Number.NaN : Number(event.target.value))}
                  aria-invalid={Boolean(errors.year)}
                  aria-describedby={errors.year ? "project-year-error" : undefined}
                  min={1900}
                  max={2200}
                  required
                />
                <FieldError id="project-year-error" message={errors.year} />
              </label>
            </div>

            <label className="field" htmlFor="project-summary">
              Ringkasan singkat
              <input
                id="project-summary"
                value={draft.summary}
                onChange={(event) => updateField("summary", event.target.value)}
                aria-invalid={Boolean(errors.summary)}
                aria-describedby={errors.summary ? "project-summary-error" : undefined}
                maxLength={300}
                placeholder="Satu kalimat yang menjelaskan dampaknya."
                required
              />
              <FieldError id="project-summary-error" message={errors.summary} />
            </label>

            <label className="field" htmlFor="project-description">
              {isArticle ? "Isi artikel" : "Cerita proyek"}
              <textarea
                id="project-description"
                value={draft.description}
                onChange={(event) => updateField("description", event.target.value)}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? "project-description-error" : undefined}
                rows={6}
                maxLength={10000}
                placeholder={isArticle ? "Tulis artikelmu di sini. Pisahkan paragraf dengan satu baris kosong." : "Konteks, peran, proses, dan hasil yang ingin kamu ceritakan."}
                required
              />
              <FieldError id="project-description-error" message={errors.description} />
            </label>

            <div className="admin-image-input-group">
              <label className="field" htmlFor="project-image-url">
                URL gambar
                <input
                  id="project-image-url"
                  type="text"
                  value={draft.image_url}
                  onChange={(event) => updateField("image_url", event.target.value)}
                  aria-invalid={Boolean(errors.image_url)}
                  aria-describedby={errors.image_url ? "project-image-error" : "project-image-help project-image-error"}
                  placeholder="/images/nama-karya.webp"
                  required
                />
                <span id="project-image-help" className="admin-field-help">Live: JPG, PNG, atau WebP maksimal 5 MB. Demo otomatis diperkecil untuk browser.</span>
                <FieldError id="project-image-error" message={errors.image_url} />
              </label>
              <label className="admin-upload-control">
                <ImagePlus size={18} aria-hidden="true" />
                <span>{isUploading ? "Mengunggah…" : "Unggah gambar"}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} disabled={isSaving || isUploading} />
              </label>
              {uploadError && <p className="admin-inline-error" role="alert">{uploadError}</p>}
            </div>

            <div className="admin-form-grid admin-form-grid-two">
              <label className="field" htmlFor="project-url">
                Tautan proyek <span className="admin-optional">opsional</span>
                <input id="project-url" type="url" value={draft.project_url} onChange={(event) => updateField("project_url", event.target.value)} aria-invalid={Boolean(errors.project_url)} aria-describedby={errors.project_url ? "project-url-error" : undefined} placeholder="https://…" />
                <FieldError id="project-url-error" message={errors.project_url} />
              </label>
              <label className="field" htmlFor="project-order">
                Urutan katalog
                <input id="project-order" type="number" inputMode="numeric" min={0} value={Number.isNaN(draft.sort_order) ? "" : draft.sort_order} onChange={(event) => updateField("sort_order", event.target.value === "" ? Number.NaN : Number(event.target.value))} aria-invalid={Boolean(errors.sort_order)} aria-describedby={errors.sort_order ? "project-order-help project-order-error" : "project-order-help"} />
                <span id="project-order-help" className="admin-field-help">Mengatur urutan katalog saja. Latest Feed selalu menampilkan proyek terbit terbaru.</span>
                <FieldError id="project-order-error" message={errors.sort_order} />
              </label>
            </div>

            <label className="field" htmlFor="project-tags">
              Tags <span className="admin-optional">pisahkan dengan koma</span>
              <input id="project-tags" value={tagsText} onChange={(event) => {
                setTagsText(event.target.value);
                updateField("tags", textToTags(event.target.value));
              }} aria-invalid={Boolean(errors.tags)} aria-describedby={errors.tags ? "project-tags-help project-tags-error" : "project-tags-help"} placeholder="Next.js, Landing page, Konsep" />
              <span id="project-tags-help" className="admin-field-help">Maksimal 20 tag, masing-masing 32 karakter. Contoh: Website, Tips, Catatan.</span>
              <FieldError id="project-tags-error" message={errors.tags} />
            </label>

            <fieldset className="admin-check-fieldset">
              <legend>Status proyek</legend>
              <label className="admin-check-item"><input type="checkbox" checked={draft.published} onChange={(event) => updateField("published", event.target.checked)} /> <span><strong>{mode === "demo" ? "Tandai terbit (demo)" : "Terbitkan"}</strong><small>{mode === "demo" ? "Status hanya untuk catatan lokal; tidak tampil di situs publik." : "Setelah disimpan sebagai terbit, proyek muncul di katalog dan Latest Feed semua kategori."}</small></span></label>
              <label className="admin-check-item"><input type="checkbox" checked={draft.is_concept} onChange={(event) => updateField("is_concept", event.target.checked)} /> <span><strong>Studi konsep</strong><small>Jelaskan bahwa karya ini adalah eksplorasi, bukan klaim proyek klien.</small></span></label>
            </fieldset>

            {formError && <p className="admin-inline-error admin-form-error" role="alert">{formError}</p>}
            <div className="admin-dialog-actions">
              <button className="button button-quiet" type="button" onClick={onClose} disabled={isSaving || isUploading}>Batal</button>
              <button className="button button-primary" type="submit" disabled={isSaving || isUploading}>
                {isSaving ? <LoaderCircle className="admin-spin" size={17} aria-hidden="true" /> : <Save size={17} aria-hidden="true" />}
                {isSaving ? "Menyimpan…" : "Simpan proyek"}
              </button>
            </div>
            <p className="admin-form-status" aria-live="polite">{isUploading ? "Gambar sedang diproses…" : isSaving ? "Perubahan sedang disimpan…" : ""}</p>
          </form>

          <aside className="admin-preview-panel" aria-label="Preview kartu proyek">
            <div className="admin-preview-heading">
              <div><span className="admin-kicker">PREVIEW POST</span><h3>Lihat sebelum simpan.</h3></div>
              <Upload size={16} aria-hidden="true" />
            </div>
            <p className="admin-preview-copy">{mode === "demo" ? "Preview ini lokal. Menyimpan tidak mengubah situs publik." : "Preview membantu mengecek tampilan kartu sebelum perubahan disimpan."}</p>
            <div className="admin-project-card-preview" inert aria-hidden="true">
              <ProjectCard project={previewProject} index={0} />
            </div>
            <div className="admin-preview-status"><span className={draft.published ? "admin-status-dot is-published" : "admin-status-dot"} />{mode === "demo" ? (draft.published ? "Ditandai terbit di demo" : "Draft demo") : (draft.published ? "Akan ditandai terbit" : "Disimpan sebagai draft")}</div>
          </aside>
        </div>
      </div>
    </dialog>
  );
}
