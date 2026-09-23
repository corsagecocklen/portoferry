"use client";

import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent, type SyntheticEvent } from "react";
import Image from "next/image";

import type { ThumbnailCrop } from "@/lib/types";
import {
  getThumbnailCropAfterDrag,
  getThumbnailStyle,
  normalizeThumbnailCrop,
} from "@/lib/image-crop";

import styles from "./image-crop-editor.module.css";

type ThumbnailCropEditorProps = {
  src: string;
  value: ThumbnailCrop | null | undefined;
  onChange: (crop: ThumbnailCrop | null) => void;
  disabled?: boolean;
};

type ImageState = {
  status: "loading" | "loaded" | "error";
  naturalWidth: number;
  naturalHeight: number;
};

type DragState = {
  pointerId: number;
  target: HTMLDivElement;
  startX: number;
  startY: number;
  initialCrop: ThumbnailCrop;
  lastCrop: ThumbnailCrop;
  naturalWidth: number;
  naturalHeight: number;
  squareSize: number;
};

function sameCrop(left: ThumbnailCrop, right: ThumbnailCrop): boolean {
  return left.x === right.x && left.y === right.y && left.zoom === right.zoom;
}

function releasePointer(state: DragState) {
  try {
    if (state.target.hasPointerCapture(state.pointerId)) {
      state.target.releasePointerCapture(state.pointerId);
    }
  } catch {
    return;
  }
}

export function ThumbnailCropEditor({
  src,
  value,
  onChange,
  disabled,
}: ThumbnailCropEditorProps) {
  return <ThumbnailCropEditorView key={src} src={src} value={value} onChange={onChange} disabled={disabled} />;
}

function ThumbnailCropEditorView({
  src,
  value,
  onChange,
  disabled = false,
}: ThumbnailCropEditorProps) {
  const id = useId();
  const dragRef = useRef<DragState | null>(null);
  const [imageState, setImageState] = useState<ImageState>({ status: "loading", naturalWidth: 0, naturalHeight: 0 });
  const crop = normalizeThumbnailCrop(value);
  const hasSource = typeof src === "string" && src.trim().length > 0;
  const imageReady = hasSource && imageState.status === "loaded" && imageState.naturalWidth > 0 && imageState.naturalHeight > 0;
  const imageFailed = hasSource && imageState.status === "error";
  const controlsDisabled = disabled || !imageReady;
  const horizontalId = `${id}-horizontal`;
  const verticalId = `${id}-vertical`;
  const zoomId = `${id}-zoom`;
  const instructionsId = `${id}-instructions`;

  useEffect(() => () => {
    const activeDrag = dragRef.current;
    if (!activeDrag) return;
    dragRef.current = null;
    releasePointer(activeDrag);
  }, [disabled, imageReady]);

  function handleImageLoad(event: SyntheticEvent<HTMLImageElement>) {
    const loadedImage = event.currentTarget;
    if (loadedImage.getAttribute("src") !== src) return;

    const naturalWidth = loadedImage.naturalWidth;
    const naturalHeight = loadedImage.naturalHeight;
    if (naturalWidth <= 0 || naturalHeight <= 0) {
      setImageState({ status: "error", naturalWidth: 0, naturalHeight: 0 });
      return;
    }

    setImageState({ status: "loaded", naturalWidth, naturalHeight });
  }

  function handleImageError(event: SyntheticEvent<HTMLImageElement>) {
    const failedImage = event.currentTarget;
    if (failedImage.getAttribute("src") !== src) return;
    setImageState({ status: "error", naturalWidth: 0, naturalHeight: 0 });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (controlsDisabled || !event.isPrimary || event.button !== 0 || imageState.status !== "loaded") return;

    const squareSize = Math.min(event.currentTarget.clientWidth, event.currentTarget.clientHeight);
    if (!Number.isFinite(squareSize) || squareSize <= 0) return;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      return;
    }

    event.preventDefault();
    const initialCrop = normalizeThumbnailCrop(value);
    dragRef.current = {
      pointerId: event.pointerId,
      target: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      initialCrop,
      lastCrop: initialCrop,
      naturalWidth: imageState.naturalWidth,
      naturalHeight: imageState.naturalHeight,
      squareSize,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const activeDrag = dragRef.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
    if (controlsDisabled) {
      dragRef.current = null;
      releasePointer(activeDrag);
      return;
    }

    const nextCrop = getThumbnailCropAfterDrag(
      activeDrag.initialCrop,
      event.clientX - activeDrag.startX,
      event.clientY - activeDrag.startY,
      activeDrag.naturalWidth,
      activeDrag.naturalHeight,
      activeDrag.squareSize,
    );
    if (sameCrop(activeDrag.lastCrop, nextCrop)) return;

    activeDrag.lastCrop = nextCrop;
    event.preventDefault();
    onChange(nextCrop);
  }

  function finishPointerDrag(pointerId: number) {
    const activeDrag = dragRef.current;
    if (!activeDrag || activeDrag.pointerId !== pointerId) return;
    dragRef.current = null;
    releasePointer(activeDrag);
  }

  function updateCrop(update: Partial<ThumbnailCrop>) {
    onChange(normalizeThumbnailCrop({ ...crop, ...update }));
  }

  return (
    <details className={styles.editor}>
      <summary className={styles.summary}>
        <span className={styles.summaryLabel}>Atur thumbnail 1:1</span>
        <span className={styles.chevron} aria-hidden="true">⌄</span>
      </summary>

      <div className={styles.content}>
        <div className={styles.toolbar}>
          <p className={styles.instructions} id={instructionsId}>
            Seret gambar atau gunakan penggeser untuk memilih fokus. Gambar penuh tetap tampil di halaman detail.
          </p>
          <button
            className={styles.resetButton}
            type="button"
            onClick={() => onChange(null)}
            disabled={controlsDisabled || value == null}
            aria-label="Atur ulang crop thumbnail"
          >
            Atur ulang
          </button>
        </div>

        <div className={styles.previewControls}>
          <div
            className={styles.preview}
            data-disabled={controlsDisabled}
            role="group"
            aria-label="Pratinjau persegi thumbnail"
            aria-describedby={instructionsId}
            aria-disabled={controlsDisabled}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(event) => finishPointerDrag(event.pointerId)}
            onPointerCancel={(event) => finishPointerDrag(event.pointerId)}
            onLostPointerCapture={(event) => finishPointerDrag(event.pointerId)}
          >
            {hasSource && !imageFailed && (
              <Image
                key={src}
                className={styles.previewImage}
                src={src}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 420px) 60vw, 320px"
                draggable={false}
                style={getThumbnailStyle(value)}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
            {!hasSource && <div className={styles.statusMessage} role="status">Belum ada gambar untuk dipratinjau.</div>}
            {hasSource && !imageReady && !imageFailed && <div className={styles.statusMessage} role="status">Memuat pratinjau gambar…</div>}
            {imageFailed && <div className={styles.statusMessage} role="alert">Gambar tidak dapat dimuat untuk thumbnail.</div>}
            {imageReady && !controlsDisabled && <span className={styles.dragHint} aria-hidden="true">Seret untuk mengatur posisi</span>}
          </div>

          <label className={styles.verticalField} htmlFor={verticalId}>
            <span className={styles.rangeLabel}>
              <span>Posisi vertikal</span>
              <output htmlFor={verticalId}>{crop.y}%</output>
            </span>
            <input
              id={verticalId}
              className={`${styles.range} ${styles.verticalRange}`}
              type="range"
              min={0}
              max={100}
              step={1}
              value={crop.y}
              aria-label="Posisi vertikal"
              aria-valuetext={`${crop.y}%`}
              disabled={controlsDisabled}
              onChange={(event) => updateCrop({ y: Number(event.currentTarget.value) })}
            />
          </label>
        </div>

        <label className={`${styles.rangeField} ${styles.horizontalField}`} htmlFor={horizontalId}>
          <span className={styles.rangeLabel}>
            <span>Posisi horizontal</span>
            <output htmlFor={horizontalId}>{crop.x}%</output>
          </span>
          <input
            id={horizontalId}
            className={styles.range}
            type="range"
            min={0}
            max={100}
            step={1}
            value={crop.x}
            aria-label="Posisi horizontal"
            aria-valuetext={`${crop.x}%`}
            disabled={controlsDisabled}
            onChange={(event) => updateCrop({ x: Number(event.currentTarget.value) })}
          />
        </label>

        <label className={`${styles.rangeField} ${styles.zoomField}`} htmlFor={zoomId}>
          <span className={styles.rangeLabel}>
            <span>Zoom thumbnail</span>
            <output htmlFor={zoomId}>{crop.zoom.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}×</output>
          </span>
          <input
            id={zoomId}
            className={styles.range}
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={crop.zoom}
            aria-label="Zoom thumbnail"
            aria-valuetext={`${crop.zoom.toFixed(2)} kali`}
            disabled={controlsDisabled}
            onChange={(event) => updateCrop({ zoom: Number(event.currentTarget.value) })}
          />
        </label>
      </div>
    </details>
  );
}
