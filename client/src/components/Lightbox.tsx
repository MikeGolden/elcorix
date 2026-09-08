import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "./icons";

export type LightboxImage = {
  src: string;
  alt: string;
};

type LightboxProps = {
  images: readonly LightboxImage[];
  /** Index of the open image, or `null` while the lightbox is closed. */
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

/**
 * Full-screen viewer for a gallery image.
 *
 * Rendered inline — the overlay is `fixed` and nothing in the app creates a
 * stacking context above it, so no portal is needed. While open it locks page
 * scrolling, moves focus into the dialog and returns it to the trigger on
 * close, and handles Escape / arrow keys. Paging wraps around, so neither
 * arrow is ever a dead end.
 */
export default function Lightbox({ images, index, onClose, onIndexChange }: LightboxProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const isOpen = index !== null;
  const count = images.length;

  const step = useCallback(
    (direction: -1 | 1) => {
      if (index === null || count === 0) return;
      onIndexChange((index + direction + count) % count);
    },
    [count, index, onIndexChange],
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, step]);

  // Keep the page behind the overlay from scrolling on wheel/touch.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, [isOpen]);

  if (index === null || count === 0) return null;

  const image = images[Math.min(index, count - 1)];

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("lightbox.label")}
      tabIndex={-1}
      data-testid="lightbox"
      onClick={(event) => {
        // Only a click on the backdrop itself closes the viewer.
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 outline-none
                 sm:p-8"
    >
      <figure className="pointer-events-none flex max-h-full max-w-[min(1100px,100%)] flex-col
                         items-center gap-3">
        <img
          src={image.src}
          alt={image.alt}
          data-testid="lightbox-image"
          className="max-h-[78vh] w-auto max-w-full rounded-panel object-contain shadow-2xl"
        />
        <figcaption className="text-center text-sm text-white/80">
          {image.alt}
          {count > 1 && (
            <span className="ml-2 whitespace-nowrap text-white/60">
              {t("lightbox.counter", { current: index + 1, total: count })}
            </span>
          )}
        </figcaption>
      </figure>

      <button
        type="button"
        onClick={onClose}
        aria-label={t("lightbox.close")}
        className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full
                   bg-white/10 text-white transition hover:bg-white/25 sm:right-5 sm:top-5"
      >
        <CloseIcon />
      </button>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={t("lightbox.prev")}
            className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center
                       justify-center rounded-full bg-white/10 text-white transition
                       hover:bg-white/25 sm:left-5"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={t("lightbox.next")}
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center
                       justify-center rounded-full bg-white/10 text-white transition
                       hover:bg-white/25 sm:right-5"
          >
            <ChevronRightIcon />
          </button>
        </>
      )}
    </div>
  );
}
