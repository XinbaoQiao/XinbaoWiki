'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PaperHighlightImage } from '@/lib/paper-highlights';
import styles from './PaperImageLightbox.module.css';

export type ExpandedPaperImage = PaperHighlightImage & { title: string };

export function PaperImageLightbox({ image, closeLabel, onClose }: {
  image: ExpandedPaperImage | null;
  closeLabel: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!image || !dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [image]);

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => dialogRef.current?.close(), 170);
    return () => window.clearTimeout(timer);
  }, [closing]);

  function requestClose() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) dialogRef.current?.close();
    else setClosing(true);
  }

  if (!image) return null;
  return createPortal(
    <dialog
      aria-labelledby={titleId}
      className={styles.dialog}
      data-closing={closing || undefined}
      data-paper-image-dialog=""
      onCancel={(event) => { event.preventDefault(); requestClose(); }}
      onClose={() => { setClosing(false); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) requestClose();
      }}
      ref={dialogRef}
    >
      <header className={styles.header}>
        <h2 id={titleId}>{image.title}</h2>
        <button aria-label={closeLabel} onClick={requestClose} type="button">×</button>
      </header>
      <div className={styles.visual}>
        <img src={image.image} width={image.width} height={image.height} alt={image.image_alt} />
      </div>
    </dialog>, document.body
  );
}
