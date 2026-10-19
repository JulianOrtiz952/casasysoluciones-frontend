"use client";

import { useEffect, useState } from "react";
import { GalleryImage } from "./GalleryImage";
import { useGallerySwipe } from "./useGallerySwipe";
import type { PropertyPhoto } from "@/lib/properties";

export function PropertyGallery({ images, title }: { images: PropertyPhoto[]; title: string }) {
  const [current, setCurrent] = useState(0);
  const swipe = useGallerySwipe(images.length, setCurrent);

  useEffect(() => {
    if (images.length < 2) return;
    const adjacent = [
      images[(current + 1) % images.length],
      images[(current - 1 + images.length) % images.length],
    ];
    adjacent.forEach((photo) => {
      const preload = new window.Image();
      preload.src = photo.src;
    });
  }, [current, images]);

  return (
    <div {...swipe} aria-label={`Fotografías de ${title}`} className="group relative aspect-[4/3] w-full touch-pan-y overflow-hidden rounded-t-3xl bg-slate-100 sm:h-[500px] sm:aspect-auto dark:bg-slate-800">
      {images.length ? <GalleryImage src={images[current].src} previewSrc={images[current].previewSrc} alt={`${title}. Fotografía ${current + 1} de ${images.length}`} priority sizes="(max-width: 1152px) 100vw, 1152px" /> : <div className="flex h-full items-center justify-center text-xl font-semibold text-slate-400">Sin fotografías</div>}
      {images.length > 1 && <>
        <button type="button" aria-label="Fotografía anterior" onClick={() => setCurrent((index) => (index - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-2xl text-slate-800 shadow">‹</button>
        <button type="button" aria-label="Fotografía siguiente" onClick={() => setCurrent((index) => (index + 1) % images.length)} className="absolute right-4 top-1/2 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-2xl text-slate-800 shadow">›</button>
        <span className="absolute bottom-4 right-4 rounded-full bg-black/65 px-3 py-1.5 text-sm font-semibold text-white">{current + 1} / {images.length}</span>
      </>}
    </div>
  );
}
