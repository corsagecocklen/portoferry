"use client";

import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from "react";

import { maxBodyImages, splitProjectParagraphs } from "@/lib/project-body";
import type { ProjectBodyImage } from "@/lib/types";

import type { UploadResult } from "./admin-types";
import styles from "./body-images-editor.module.css";

type BodyImagesEditorProps = {
  description: string;
  images: ProjectBodyImage[];
  onChange: (images: ProjectBodyImage[]) => void;
  onUpload: (file: File) => Promise<UploadResult>;
  disabled?: boolean;
  onBusyChange: (busy: boolean) => void;
  error?: string;
};

function getPlacement(image: ProjectBodyImage, paragraphCount: number): number {
  const placement = Number.isFinite(image.after_paragraph)
    ? Math.trunc(image.after_paragraph)
    : 0;

  return paragraphCount === 0 ? 0 : Math.max(0, Math.min(paragraphCount, placement));
}

function getParagraphSnippet(paragraph: string): string {
  const snippet = paragraph.replace(/\s+/g, " ").trim();
  return snippet.length > 56 ? `${snippet.slice(0, 55).trimEnd()}…` : snippet;
}

function getDefaultAlt(filename: string, number: number): string {
  const name = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (name || `Gambar tulisan ${number}`).slice(0, 300);
}

export function BodyImagesEditor({
  description,
  images,
  onChange,
  onUpload,
  disabled = false,
  onBusyChange,
  error,
}: BodyImagesEditorProps) {
  const instanceId = useId().replace(/:/g, "");
  const paragraphs = useMemo(() => splitProjectParagraphs(description), [description]);
  const imagesRef = useRef(images);
  const uploadingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const altInputRefs = useRef(new Map<string, HTMLInputElement>());
  const focusAfterDeleteRef = useRef<string | null>(null);
  const focusAddAfterDeleteRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    imagesRef.current = images;

    const imageId = focusAfterDeleteRef.current;
    if (imageId && images.some((image) => image.id === imageId)) {
      focusAfterDeleteRef.current = null;
      altInputRefs.current.get(imageId)?.focus();
      return;
    }

    if (focusAddAfterDeleteRef.current && images.length === 0) {
      focusAddAfterDeleteRef.current = false;
      fileInputRef.current?.focus();
    }
  }, [images]);

  const unavailable = disabled || isUploading;
  const errorMessages = [error, uploadError].filter((message): message is string => Boolean(message));
  const errorId = `${instanceId}-body-image-errors`;

  function updateImages(nextImages: ProjectBodyImage[]) {
    imagesRef.current = nextImages;
    onChange(nextImages);
  }

  async function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";

    if (files.length === 0 || unavailable || uploadingRef.current) return;

    const currentCount = imagesRef.current.length;
    const availableSlots = Math.max(0, maxBodyImages - currentCount);
    if (files.length > availableSlots) {
      setUploadError(
        `Maksimal ${maxBodyImages} gambar dalam tulisan. Tersisa ${availableSlots} slot, jadi tidak ada gambar yang diunggah.`,
      );
      setStatusMessage("");
      return;
    }

    const defaultPosition = paragraphs.length > 0 ? 1 : 0;
    const failures: string[] = [];
    let uploadedCount = 0;

    uploadingRef.current = true;
    setIsUploading(true);
    setUploadError("");
    setStatusMessage(`Mengunggah ${files.length} gambar…`);

    try {
      onBusyChange(true);

      for (const file of files) {
        let result: UploadResult;
        try {
          result = await onUpload(file);
        } catch {
          failures.push(`${file.name}: Gambar gagal diunggah. Periksa koneksi lalu coba lagi.`);
          continue;
        }

        if (!result.success) {
          failures.push(`${file.name}: ${result.error}`);
          continue;
        }

        const currentImages = imagesRef.current;
        if (currentImages.length >= maxBodyImages) {
          failures.push(`${file.name}: slot gambar sudah penuh.`);
          continue;
        }

        const imageNumber = currentImages.length + 1;
        const nextImages = [
          ...currentImages,
          {
            id: crypto.randomUUID(),
            url: result.url,
            alt: getDefaultAlt(file.name, imageNumber),
            caption: "",
            after_paragraph: defaultPosition,
          },
        ];

        updateImages(nextImages);
        uploadedCount += 1;
      }

      setUploadError(failures.join(" "));
      if (uploadedCount > 0) {
        setStatusMessage(`${uploadedCount} gambar berhasil ditambahkan.`);
      } else {
        setStatusMessage("");
      }
    } finally {
      uploadingRef.current = false;
      setIsUploading(false);
      onBusyChange(false);
    }
  }

  async function handleReplaceChange(event: ChangeEvent<HTMLInputElement>, imageId: string) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";

    if (!file || unavailable || uploadingRef.current) return;

    const imageIndex = imagesRef.current.findIndex((image) => image.id === imageId);
    if (imageIndex < 0) return;

    uploadingRef.current = true;
    setIsUploading(true);
    setUploadError("");
    setStatusMessage("Mengunggah pengganti gambar…");

    try {
      onBusyChange(true);
      const result = await onUpload(file);

      if (!result.success) {
        setUploadError(`${file.name}: ${result.error}`);
        setStatusMessage("");
        return;
      }

      const currentImages = imagesRef.current;
      if (!currentImages.some((image) => image.id === imageId)) {
        setStatusMessage("");
        return;
      }

      updateImages(currentImages.map((image) =>
        image.id === imageId ? { ...image, url: result.url } : image,
      ));
      setStatusMessage(`Gambar ${imageIndex + 1} berhasil diganti. Periksa kembali teks alternatif dan keterangannya.`);
    } catch {
      setUploadError(`${file.name}: Gambar gagal diunggah. Periksa koneksi lalu coba lagi.`);
      setStatusMessage("");
    } finally {
      uploadingRef.current = false;
      setIsUploading(false);
      onBusyChange(false);
    }
  }

  function updateImage(imageId: string, changes: Partial<ProjectBodyImage>) {
    if (unavailable || uploadingRef.current) return;

    const nextImages = imagesRef.current.map((image) =>
      image.id === imageId ? { ...image, ...changes } : image,
    );
    updateImages(nextImages);
  }

  function moveImage(imageId: string, direction: -1 | 1) {
    if (unavailable || uploadingRef.current) return;

    const currentImages = imagesRef.current;
    const sourceIndex = currentImages.findIndex((image) => image.id === imageId);
    if (sourceIndex < 0) return;

    const sourcePosition = getPlacement(currentImages[sourceIndex], paragraphs.length);
    const peers = currentImages
      .map((image, index) => ({ image, index }))
      .filter(({ image }) => getPlacement(image, paragraphs.length) === sourcePosition);
    const peerIndex = peers.findIndex(({ image }) => image.id === imageId);
    const target = peers[peerIndex + direction];
    if (!target) return;

    const nextImages = [...currentImages];
    [nextImages[sourceIndex], nextImages[target.index]] = [nextImages[target.index], nextImages[sourceIndex]];
    updateImages(nextImages);
  }

  function removeImage(imageId: string, imageIndex: number) {
    if (unavailable || uploadingRef.current) return;

    const nextImages = imagesRef.current.filter((image) => image.id !== imageId);
    const nextFocusImage = nextImages[Math.min(imageIndex, nextImages.length - 1)];
    focusAfterDeleteRef.current = nextFocusImage?.id ?? null;
    focusAddAfterDeleteRef.current = !nextFocusImage;
    updateImages(nextImages);
  }

  return (
    <section className={styles.editor} aria-labelledby={`${instanceId}-heading`}>
      <div className={styles.headingRow}>
        <div>
          <h3 id={`${instanceId}-heading`}><ImagePlus size={17} aria-hidden="true" /> Gambar dalam tulisan</h3>
          <p>Letakkan gambar di antara paragraf. Maksimal {maxBodyImages} gambar; gambar yang dihapus hanya dilepas dari draf.</p>
        </div>
        <span className={styles.count}>{images.length}/{maxBodyImages}</span>
      </div>

      <div className={styles.uploadField}>
        <label htmlFor={`${instanceId}-upload`}>Unggah gambar tulisan</label>
        <input
          ref={fileInputRef}
          id={`${instanceId}-upload`}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          disabled={unavailable || images.length >= maxBodyImages}
          aria-describedby={errorMessages.length > 0 ? errorId : undefined}
          onChange={handleFilesChange}
        />
        <span className={styles.helpText}>
          JPEG, PNG, atau WebP. {Math.max(0, maxBodyImages - images.length)} slot tersisa.
        </span>
      </div>

      {errorMessages.length > 0 && (
        <div id={errorId} className={styles.error} role="alert" aria-live="assertive">
          {errorMessages.map((message, index) => <p key={`${index}-${message}`}>{message}</p>)}
        </div>
      )}
      <p className={styles.status} role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>

      {images.length > 0 && (
        <ol className={styles.imageList}>
          {images.map((image, index) => {
            const placement = getPlacement(image, paragraphs.length);
            const peerIndexes = images
              .map((peer, peerIndex) => ({ peer, peerIndex }))
              .filter(({ peer }) => getPlacement(peer, paragraphs.length) === placement)
              .map(({ peerIndex }) => peerIndex);
            const orderInPosition = peerIndexes.indexOf(index);
            const imageNumber = index + 1;
            const positionId = `${instanceId}-position-${image.id}`;
            const altId = `${instanceId}-alt-${image.id}`;
            const captionId = `${instanceId}-caption-${image.id}`;
            const previousImageNumber = orderInPosition > 0 ? peerIndexes[orderInPosition - 1] + 1 : undefined;
            const nextImageNumber = orderInPosition < peerIndexes.length - 1
              ? peerIndexes[orderInPosition + 1] + 1
              : undefined;

            return (
              <li className={styles.imageItem} key={image.id}>
                <div className={styles.itemHeading}>
                  <strong>Gambar {imageNumber}</strong>
                  <div className={styles.orderControls}>
                    <button
                      type="button"
                      className={styles.orderButton}
                      aria-label={`Pindahkan gambar ${imageNumber} sebelum gambar ${previousImageNumber ?? "sebelumnya"} pada posisi yang sama`}
                      title={previousImageNumber ? `Sebelum gambar ${previousImageNumber} pada posisi yang sama` : "Tidak ada gambar sebelumnya pada posisi yang sama"}
                      disabled={unavailable || !previousImageNumber}
                      onClick={() => moveImage(image.id, -1)}
                    >
                      <ArrowUp size={16} aria-hidden="true" />
                      <span>Naikkan urutan</span>
                    </button>
                    <button
                      type="button"
                      className={styles.orderButton}
                      aria-label={`Pindahkan gambar ${imageNumber} setelah gambar ${nextImageNumber ?? "berikutnya"} pada posisi yang sama`}
                      title={nextImageNumber ? `Setelah gambar ${nextImageNumber} pada posisi yang sama` : "Tidak ada gambar berikutnya pada posisi yang sama"}
                      disabled={unavailable || !nextImageNumber}
                      onClick={() => moveImage(image.id, 1)}
                    >
                      <ArrowDown size={16} aria-hidden="true" />
                      <span>Turunkan urutan</span>
                    </button>
                  </div>
                </div>

                <label className={styles.field} htmlFor={altId}>
                  Teks alternatif gambar {imageNumber}
                  <input
                    ref={(element) => {
                      if (element) altInputRefs.current.set(image.id, element);
                      else altInputRefs.current.delete(image.id);
                    }}
                    id={altId}
                    type="text"
                    value={image.alt}
                    maxLength={300}
                    required
                    disabled={unavailable}
                    onChange={(event) => updateImage(image.id, { alt: event.target.value })}
                  />
                </label>

                <label className={styles.field} htmlFor={captionId}>
                  Keterangan gambar {imageNumber} <span className={styles.optional}>(opsional)</span>
                  <input
                    id={captionId}
                    type="text"
                    value={image.caption}
                    maxLength={300}
                    disabled={unavailable}
                    onChange={(event) => updateImage(image.id, { caption: event.target.value })}
                  />
                </label>

                <label className={styles.field} htmlFor={positionId}>
                  Posisi gambar {imageNumber}
                  <select
                    id={positionId}
                    value={placement}
                    disabled={unavailable}
                    onChange={(event) => updateImage(image.id, { after_paragraph: Number(event.target.value) })}
                  >
                    <option value={0}>
                      {paragraphs.length === 0
                        ? "Sebelum paragraf pertama (tulisan belum ada)"
                        : "Sebelum paragraf pertama"}
                    </option>
                    {paragraphs.map((paragraph, paragraphIndex) => {
                      const number = paragraphIndex + 1;
                      return (
                        <option value={number} key={number}>
                          Setelah paragraf {number}: {getParagraphSnippet(paragraph)}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label className={styles.field} htmlFor={`${instanceId}-replace-${image.id}`}>
                  Ganti gambar {imageNumber}
                  <input
                    id={`${instanceId}-replace-${image.id}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    disabled={unavailable}
                    onChange={(event) => handleReplaceChange(event, image.id)}
                  />
                  <span className={styles.helpText}>Teks alternatif, keterangan, dan posisi tetap dipakai.</span>
                </label>

                <button
                  type="button"
                  className={styles.removeButton}
                  aria-label={`Hapus gambar ${imageNumber} dari tulisan`}
                  disabled={unavailable}
                  onClick={() => removeImage(image.id, index)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Lepas gambar dari draf
                </button>
              </li>
            );
          })}
        </ol>
      )}

    </section>
  );
}
