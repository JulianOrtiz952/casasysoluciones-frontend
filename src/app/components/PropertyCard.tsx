"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GalleryImage } from "./GalleryImage";
import { useGallerySwipe } from "./useGallerySwipe";
import {
  type Property,
  propertyImages,
  propertyPath,
  propertyTitle,
} from "@/lib/properties";

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function PropertyCard({ property, priority = false }: { property: Property; priority?: boolean }) {
  const [current, setCurrent] = useState(0);
  const images = propertyImages(property);
  const title = propertyTitle(property);
  const href = propertyPath(property);
  const swipe = useGallerySwipe(images.length, setCurrent);

  useEffect(() => {
    if (images.length < 2) return;
    const preload = new window.Image();
    preload.src = images[(current + 1) % images.length];
  }, [current, images]);

  function changeImage(event: React.MouseEvent, direction: number) {
    event.preventDefault();
    event.stopPropagation();
    setCurrent((index) => (index + direction + images.length) % images.length);
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div {...swipe} className="group relative h-56 touch-pan-y overflow-hidden bg-slate-100 sm:h-64" aria-label={`Fotografías de ${title}`}>
        <Link href={href} className="block h-full w-full" aria-label={`Ver ${title}`}>
          {images.length ? (
            <GalleryImage
              src={images[current]}
              alt={`${title}. Fotografía ${current + 1} de ${images.length}`}
              priority={priority && current === 0}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">Sin fotografías</div>
          )}
        </Link>
        <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-800 shadow-sm">
          En arriendo
        </span>
        {images.length > 1 && (
          <>
            <button type="button" aria-label="Fotografía anterior" onClick={(event) => changeImage(event, -1)} className="absolute left-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl text-slate-800 shadow">‹</button>
            <button type="button" aria-label="Fotografía siguiente" onClick={(event) => changeImage(event, 1)} className="absolute right-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl text-slate-800 shadow">›</button>
          </>
        )}
      </div>
      <Link href={href} className="flex flex-col p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900 transition-colors hover:text-rose-600 dark:text-white">{title}</h2>
        <p className="mt-2 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">{property.address}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Código {property.code}</p>
        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Canon mensual</span>
          <span className="mt-1 block text-2xl font-black text-slate-900 dark:text-white">{money.format(Number(property.price))}</span>
          {property.in_complex && (
            <span className="mt-1 block text-xs text-slate-500">
              Administración {property.admin_included ? "incluida" : property.admin_value ? money.format(Number(property.admin_value)) : "por consultar"}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
