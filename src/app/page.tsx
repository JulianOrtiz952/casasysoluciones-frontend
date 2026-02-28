'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from './theme-provider';

interface Imagen {
  id: number;
  imagen: string;
  es_portada: boolean;
}

interface Inmueble {
  id: number;
  titulo: string;
  descripcion: string;
  precio: string;
  direccion: string;
  imagen: string | null;
  imagenes?: Imagen[];
  estado: 'arrendada' | 'en_oferta' | 'en_mantenimiento' | 'inactiva';
}

function InmuebleCard({ inmueble }: { inmueble: Inmueble }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  const images = (() => {
    if (!inmueble.imagenes || inmueble.imagenes.length === 0) {
      return inmueble.imagen ? [inmueble.imagen] : [];
    }
    const imgs = [...inmueble.imagenes];
    const portadaIdx = imgs.findIndex(img => img.es_portada);
    if (portadaIdx > 0) {
      const portada = imgs.splice(portadaIdx, 1)[0];
      imgs.unshift(portada);
    }
    return imgs.map(i => i.imagen);
  })();

  const nextImg = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCurrentIdx(prev => (prev + 1) % images.length);
  }

  const prevImg = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCurrentIdx(prev => (prev - 1 + images.length) % images.length);
  }

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-2xl shadow-xl hover:shadow-2xl transition duration-300 overflow-hidden transform hover:-translate-y-1 border border-rose-50 dark:border-slate-800 flex flex-col">
      <div className="h-64 overflow-hidden relative group bg-slate-100 dark:bg-slate-800">
        <Link href={`/inmuebles/${inmueble.id}`} className="block w-full h-full">
          {images.length > 0 ? (
            <img src={images[currentIdx]} alt={inmueble.titulo} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
          )}
        </Link>
        <div className="absolute top-4 left-4 pointer-events-none">
          <span className="px-3 py-1 bg-emerald-500/90 text-white text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-md shadow-sm">
            En Oferta
          </span>
        </div>

        {images.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition backdrop-blur-sm z-10 focus:outline-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition backdrop-blur-sm z-10 focus:outline-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none">
              {images.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-3 bg-white' : 'w-1.5 bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-5 sm:p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1">{inmueble.titulo}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-1">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
          <span className="line-clamp-1">{inmueble.direccion}</span>
        </p>
        <div className="my-4 h-px bg-rose-50 dark:bg-slate-800"></div>
        <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 min-h-[60px] flex-grow">{inmueble.descripcion}</p>
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs uppercase font-semibold text-rose-500 block mb-0.5">Mensual</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">${parseFloat(inmueble.precio).toLocaleString()}</span>
          </div>
          <Link href={`/inmuebles/${inmueble.id}`} className="w-full sm:w-auto text-center bg-slate-900 dark:bg-rose-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-800 dark:hover:bg-rose-600 transition shadow-md">
            Ver Detalles
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOfertas = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/v1/inmuebles/`);
        if (res.ok) {
          const data: Inmueble[] = await res.json();
          // Filter out properties that are not 'en_oferta'
          const ofertas = data.filter(item => item.estado === 'en_oferta');
          setInmuebles(ofertas);
        }
      } catch (error) {
        console.error('Error cargando inmuebles', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOfertas();
  }, []);

  return (
    <main className="min-h-screen bg-rose-50/30 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Navbar Pública */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-rose-100 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <svg className="w-8 h-8 text-rose-500 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-pink-500">
                Inmobiliaria VS
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 hover:bg-rose-100 dark:hover:bg-slate-800 dark:text-slate-400 transition"
                aria-label="Alternar tema"
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                )}
              </button>
              <Link
                href="/login"
                className="text-sm font-semibold text-white bg-rose-500 dark:bg-rose-600 px-5 py-2.5 rounded-full hover:bg-rose-600 dark:hover:bg-rose-500 transition shadow-md shadow-rose-500/30"
              >
                Acceso Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-rose-50/50 dark:bg-slate-900 -skew-y-6 transform origin-top-left -z-10 transition-colors"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
            Encuentra el hogar de tus <span className="text-rose-500 dark:text-rose-400">sueños</span>
          </h2>
          <p className="mt-4 text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Explora nuestro catálogo exclusivo de propiedades seleccionadas solo para ti. Comodidad, lujo y accesibilidad.
          </p>
        </div>
      </section>

      {/* Catálogo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-24">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
          </div>
        ) : inmuebles.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-12 text-center shadow-xl border border-rose-50 dark:border-slate-800">
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
    </main>
  );
}
