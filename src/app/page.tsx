'use client';

import Image from 'next/image';
import { useGallerySwipe } from './components/useGallerySwipe';
import { GalleryImage } from './components/GalleryImage';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PropertyImage {
  id: number;
  image: string;
  is_cover: boolean;
}

interface Inmueble {
  id: number;
  code: string;
  address: string;
  description: string;
  price: string;
  cover_image: string | null;
  images?: PropertyImage[];
  status: string;
  status_display: string;
  in_complex: boolean;
  admin_included: boolean;
  admin_value: string | null;
  owner_name: string;
}

function InmuebleCard({ inmueble }: { inmueble: Inmueble }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return `${API_URL}${url}`;
  };

  const images = (() => {
    const galleryImages = inmueble.images || [];
    if (galleryImages.length === 0) {
      return inmueble.cover_image ? [getImageUrl(inmueble.cover_image)] : [];
    }
    // Ensure cover is first
    const sorted = [...galleryImages].sort((a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0));
    return sorted.map(i => getImageUrl(i.image));
  })();

  const swipe = useGallerySwipe(images.length, setCurrentIdx);

  const nextImg = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCurrentIdx(prev => (prev + 1) % images.length);
  }

  const prevImg = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCurrentIdx(prev => (prev - 1 + images.length) % images.length);
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] motion-safe:hover:-translate-y-1 focus-within:ring-2 focus-within:ring-rose-500 transition-all duration-300 overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col group/card">
      <div {...swipe} aria-label="Fotos del inmueble" className="h-56 sm:h-64 overflow-hidden relative group bg-slate-100 dark:bg-slate-800 touch-pan-y touch-pinch-zoom select-none">
        <Link href={`/inmuebles/${inmueble.id}`} draggable={false} className="block w-full h-full">
          {images.length > 0 ? (
            <GalleryImage src={images[currentIdx]} alt={`${inmueble.address}, foto ${currentIdx + 1} de ${images.length}`} className="transition-transform duration-500 motion-safe:group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
          )}
        </Link>
        <div className="absolute top-4 left-4 pointer-events-none z-10">
          <span className="px-3.5 py-1.5 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700 text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-md shadow-sm">
            En Oferta
          </span>
        </div>

        {images.length > 1 && (
          <>
            <button type="button" aria-label="Foto anterior" onClick={prevImg} className="absolute left-3 top-1/2 -translate-y-1/2 size-11 flex items-center justify-center bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/80 text-slate-800 dark:text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-all backdrop-blur-sm z-20 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button type="button" aria-label="Foto siguiente" onClick={nextImg} className="absolute right-3 top-1/2 -translate-y-1/2 size-11 flex items-center justify-center bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/80 text-slate-800 dark:text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-all backdrop-blur-sm z-20 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[60%] overflow-hidden flex gap-1.5 z-20 pointer-events-none">
              {images.map((_, i) => (
                <div key={i} className={`h-1.5 shrink-0 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-4 bg-white shadow-sm' : 'w-1.5 bg-white/60'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      <Link href={`/inmuebles/${inmueble.id}`} aria-label={`Ver detalles de ${inmueble.code}, ${inmueble.address}`} className="p-5 sm:p-6 flex flex-col flex-grow focus-visible:outline-none">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover/card:text-rose-600 transition-colors uppercase tracking-tight">{inmueble.owner_name}</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{inmueble.code}</p>
        <div className="flex gap-2 mt-2.5 items-start">
          <svg className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 w-full font-medium" title={inmueble.address}>
            {inmueble.address}
          </p>
        </div>
        
        <div className="my-5 h-px bg-slate-100 dark:bg-slate-800"></div>
        
        <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Precio Mensual</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">${parseFloat(inmueble.price).toLocaleString()}</span>
            {inmueble.in_complex && (
              <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-400">Administración: </span>
                {inmueble.admin_included ? (
                  <span className="text-emerald-500 font-medium bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">Incluida</span>
                ) : (
                  <span className="font-semibold text-slate-600 dark:text-slate-300">+ ${inmueble.admin_value ? parseFloat(inmueble.admin_value).toLocaleString() : '0'}</span>
                )}
              </div>
            )}
          </div>
          <span className="w-full sm:w-auto text-center bg-slate-900 dark:bg-rose-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-800 dark:hover:bg-rose-500 transition-all shadow-sm focus:ring-2 focus:ring-slate-900 focus:outline-none">
            Ver detalles
          </span>
        </div>
      </Link>
    </div>
  );
}

export default function Home() {
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOfertas = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/v1/properties/`);
        if (res.ok) {
          const rawData = await res.json();
          const items: Inmueble[] = Array.isArray(rawData) ? rawData : (rawData.results || []);
          
          // Filter out properties that are not 'AVAILABLE' (modern status)
          const ofertas = items.filter(item => item.status === 'AVAILABLE');
          setInmuebles(ofertas);
        }
      } catch {
        // Silenced for production
      } finally {
        setLoading(false);
      }
    };
    fetchOfertas();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Navbar Pública */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center gap-3 min-h-20 py-3">
            <Link href="/" aria-label="Casas y Soluciones, inicio" className="flex items-center gap-2 sm:gap-3 min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
              <Image unoptimized width={781} height={301} src="/logo.jpeg" alt="" className="h-7 sm:h-11 w-auto shrink-0 rounded-md bg-white p-1 shadow-sm border border-slate-100" />
              <div className="hidden min-[380px]:block">
              <h1 className="text-sm sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Casas<span className="text-rose-600">y</span>Soluciones
              </h1>
              <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">Tu próximo hogar empieza aquí</p>
              </div>
            </Link>
            <nav aria-label="Navegación principal" className="shrink-0">
              <a
                href="#catalogo"
                className="inline-flex min-h-11 items-center text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 px-3 sm:px-5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-rose-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 whitespace-nowrap"
              >
                Ver propiedades
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32 flex items-center justify-center min-h-[450px]">
        <div className="absolute inset-0 w-full h-full bg-grid-slate-100/[0.04] bg-[length:32px_32px]"></div>
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-slate-100 to-transparent -z-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-100/40 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.15]">
            Encuentra la propiedad que <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">siempre soñaste</span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Descubre nuestro catálogo exclusivo. Espacios de comodidad y lujo diseñados para convertirse en tu próximo hogar.
          </p>
        </div>
      </section>

      {/* Catálogo */}
      <section id="catalogo" aria-label="Propiedades disponibles" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-16 sm:pb-24">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
          </div>
        ) : inmuebles.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 sm:p-12 text-center shadow-xl border border-rose-50 dark:border-slate-800">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Próximamente más oportunidades</h3>
            <p className="text-slate-500 dark:text-slate-400">Actualmente no hay propiedades en oferta al público. ¡Vuelve a revisar en los próximos días!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {inmuebles.map((inmueble) => (
              <InmuebleCard key={inmueble.id} inmueble={inmueble} />
            ))}
          </div>
        )}
      </section>
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Casas y Soluciones</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Encuentra un espacio para tu próximo hogar.</p>
          </div>
          <Link href="/login" className="self-start inline-flex min-h-11 items-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
            Acceso al equipo
          </Link>
        </div>
      </footer>
    </main>
  );
}
