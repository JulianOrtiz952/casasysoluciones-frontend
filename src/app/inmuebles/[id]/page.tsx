'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface PropertyImage {
    id: number;
    image: string;
    is_cover: boolean;
}

interface Inmueble {
    id: number;
    code: string;
    description: string;
    price: string;
    address: string;
    cover_image: string | null;
    images?: PropertyImage[];
    status: string;
    status_display: string;
    in_complex: boolean;
    admin_included: boolean;
    admin_value?: string;
    rooms?: number | null;
    bathrooms?: number | null;
    living_rooms?: number | null;
    kitchens?: number | null;
    garages?: number | null;
    is_commercial?: boolean;
    google_maps_link?: string | null;
}

export default function PublicInmuebleDetail() {
    const { id } = useParams();
    const router = useRouter();
    const [inmueble, setInmueble] = useState<Inmueble | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIdx, setCurrentImageIdx] = useState(0);

    useEffect(() => {
        const fetchInmueble = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${API_URL}/api/v1/properties/${id}/`);
                if (res.ok) {
                    const data: Inmueble = await res.json();
                    if (data.status !== 'AVAILABLE') {
                        router.push('/');
                        return;
                    }
                    setInmueble(data);
                } else {
                    router.push('/'); // Volver si no existe
                }
            } catch (error) {
                console.error("Error al cargar:", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchInmueble();
    }, [id, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-rose-50/30 dark:bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
            </div>
        );
    }

    const images = (() => {
        const galleryImages = inmueble?.images || [];
        if (galleryImages.length > 0) {
            const sorted = [...galleryImages].sort((a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0));
            return sorted.map(i => i.image);
        }
        return inmueble?.cover_image ? [inmueble.cover_image] : [];
    })();

    const nextImage = () => {
        setCurrentImageIdx((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length);
    };

    if (!inmueble) return null;

    return (
        <main className="min-h-screen bg-rose-50/30 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-20">
            {/* Nav Simple */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-rose-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2 text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            <span className="font-medium">Volver al Catálogo</span>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                <div className="bg-white dark:bg-slate-900 shadow-xl rounded-3xl border border-slate-200 dark:border-slate-800 relative z-10 w-full mb-10">
                    {/* Imagen Header */}
                    <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] relative bg-slate-100 dark:bg-slate-800 group rounded-t-3xl overflow-hidden">
                        {images.length > 0 ? (
                            <img src={images[currentImageIdx]} alt={inmueble.address} className="w-full h-full object-cover transition-opacity duration-500" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <span className="font-semibold text-xl">Sin Fotos</span>
                            </div>
                        )}

                        <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                            <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-500/90 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-full backdrop-blur-md shadow-lg">
                                En Oferta
                            </span>
                        </div>

                        {/* Controles del Carrusel */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/40 hover:bg-black/70 text-white rounded-full transition backdrop-blur-sm z-10 focus:outline-none"
                                >
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/40 hover:bg-black/70 text-white rounded-full transition backdrop-blur-sm z-10 focus:outline-none"
                                >
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                                </button>

                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 z-10">
                                    {images.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentImageIdx(i)}
                                            className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${i === currentImageIdx ? 'w-6 sm:w-8 bg-white' : 'w-2 sm:w-2.5 bg-white/50 hover:bg-white/80'}`}
                                            aria-label={`Ir a imagen ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Contenido principal en dos columnas (PC) */}
                    <div className="p-8 sm:p-12">
                        <div className="flex flex-col lg:flex-row gap-12 relative">
                            {/* Columna Izquierda: Toda la info */}
                            <div className="flex-1 min-w-0">
                                <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4 leading-tight uppercase tracking-tight">{inmueble.code}</h1>
                                <p className="text-lg text-slate-600 dark:text-slate-400 flex items-center gap-2 mb-10">
                                    <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    {inmueble.address}
                                </p>

                                {/* Características */}
                                <div className="flex flex-wrap gap-4 mb-10">
                                    {inmueble.rooms != null && inmueble.rooms > 0 && (
                                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{inmueble.rooms}</p>
                                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Habitaciones</p>
                                            </div>
                                        </div>
                                    )}
                                    {inmueble.bathrooms != null && inmueble.bathrooms > 0 && (
                                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{inmueble.bathrooms}</p>
                                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Baños</p>
                                            </div>
                                        </div>
                                    )}
                                    {inmueble.garages != null && inmueble.garages > 0 && (
                                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{inmueble.garages}</p>
                                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Garajes</p>
                                            </div>
                                        </div>
                                    )}
                                    {inmueble.living_rooms != null && inmueble.living_rooms > 0 && (
                                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{inmueble.living_rooms}</p>
                                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Salas</p>
                                            </div>
                                        </div>
                                    )}
                                    {inmueble.kitchens != null && inmueble.kitchens > 0 && (
                                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"></path></svg>
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{inmueble.kitchens}</p>
                                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Cocinas</p>
                                            </div>
                                        </div>
                                    )}
                                    {inmueble.is_commercial && (
                                        <div className="flex items-center gap-4 bg-slate-900 dark:bg-indigo-900/40 px-5 py-4 rounded-2xl border border-slate-800 dark:border-indigo-800/50 shadow-sm">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 dark:bg-indigo-800/50 flex items-center justify-center text-white shadow-sm">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white leading-none">Local / Comercial</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-lg mb-10">
                                {inmueble.description}
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Ubicación en el Mapa</h3>

                            {/* Contenedor del Mapa */}
                            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative bg-slate-100 dark:bg-slate-800 space-y-0 flex flex-col">
                                <div className="w-full h-[350px] relative">
                                    <iframe
                                        className="absolute top-0 left-0 w-full h-full"
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(inmueble.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                        frameBorder="0"
                                        scrolling="no"
                                        marginHeight={0}
                                        marginWidth={0}
                                        title={`Mapa de ubicación para ${inmueble.address}`}
                                    ></iframe>
                                </div>
                                {inmueble.google_maps_link && (
                                    <div className="bg-rose-50 dark:bg-slate-900 border-t border-rose-100 dark:border-slate-700 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center shrink-0">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">El propietario ha compartido una ruta exacta.</p>
                                        </div>
                                        <a
                                            href={inmueble.google_maps_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition shadow-md shadow-rose-500/20 whitespace-nowrap"
                                        >
                                            Abrir ubicación exacta
                                        </a>
                                    </div>
                                )}
                            </div>

                        {inmueble.images && inmueble.images.length > 0 && (
                            <div className="mt-12">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Galería de Imágenes</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {inmueble.images.map((img) => {
                                        const foundIdx = images.indexOf(img.image);
                                        const isSelected = images[currentImageIdx] === img.image;
                                        return (
                                            <div
                                                key={img.id}
                                                onClick={() => {
                                                    if (foundIdx !== -1) setCurrentImageIdx(foundIdx);
                                                    window.scrollTo({ top: 100, behavior: 'smooth' });
                                                }}
                                                className={`relative rounded-2xl overflow-hidden h-48 border shadow-sm hover:shadow-md transition cursor-pointer group/item ${isSelected ? 'border-rose-500 ring-2 ring-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                                            >
                                                <img src={img.image} alt="Galería" className="w-full h-full object-cover group-hover/item:scale-105 transition duration-500" />
                                                {img.is_cover && (
                                                    <span className="absolute bottom-2 left-2 bg-emerald-500 text-white text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md shadow-sm">
                                                        Portada
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        </div>

                            {/* Columna Derecha Modal (Precio y CTAs) - Sticky */}
                            <div className="w-full lg:w-[380px] shrink-0">
                                <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-800 dark:border-slate-700 shadow-2xl shadow-slate-900/10 lg:sticky lg:top-8 mt-4 lg:mt-0">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Precio Mensual</p>
                                    <p className="text-4xl sm:text-5xl font-black text-white mb-8">${parseFloat(inmueble.price).toLocaleString()}</p>

                                    {inmueble.in_complex && (
                                        <div className="mb-8 pt-6 border-t border-slate-700/50">
                                            <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                                Conjunto Cerrado
                                            </p>
                                            {inmueble.admin_value && parseFloat(inmueble.admin_value) > 0 && (
                                                <div className="flex flex-col mt-2">
                                                    <p className="text-sm text-slate-300">
                                                        Admón: <span className="font-bold text-white">${parseFloat(inmueble.admin_value).toLocaleString()}</span>
                                                    </p>
                                                    {inmueble.admin_included && (
                                                        <span className="mt-2 text-[10px] font-bold px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-md w-max inline-block">
                                                            Incluida en el canon
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div className="flex flex-col gap-4">
                                        <a
                                            href={`https://wa.me/573105769214?text=${encodeURIComponent(`Hola, estoy interesado en la propiedad: ${inmueble.code} ubicada en ${inmueble.address}.`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#25D366] hover:bg-[#1DA851] text-white font-black rounded-xl transition-all shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.23)] hover:-translate-y-0.5 active:scale-95 text-[15px]"
                                        >
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                            Hablar por WhatsApp
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
