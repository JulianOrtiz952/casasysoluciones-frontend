'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

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
                const res = await fetch(`${API_URL}/api/v1/inmuebles/${id}/`);
                if (res.ok) {
                    const data: Inmueble = await res.json();
                    if (data.estado !== 'en_oferta') {
                        // Si por alguna razón escriben la URL de una que no está en oferta, no la deben ver
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
        if (!inmueble || !inmueble.imagenes || inmueble.imagenes.length === 0) {
            return inmueble?.imagen ? [inmueble.imagen] : [];
        }
        const imgs = [...inmueble.imagenes];
        const portadaIdx = imgs.findIndex(img => img.es_portada);
        if (portadaIdx > 0) {
            const portada = imgs.splice(portadaIdx, 1)[0];
            imgs.unshift(portada);
        }
        return imgs.map(i => i.imagen);
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

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                <div className="bg-white dark:bg-slate-900 shadow-xl rounded-3xl overflow-hidden border border-rose-100 dark:border-slate-800">
                    {/* Imagen Header */}
                    <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] relative bg-slate-100 dark:bg-slate-800 group">
                        {images.length > 0 ? (
                            <img src={images[currentImageIdx]} alt={inmueble.titulo} className="w-full h-full object-cover transition-opacity duration-500" />
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

                    {/* Contenido */}
                    <div className="p-8 sm:p-12">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                            <div className="flex-1">
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">{inmueble.titulo}</h1>
                                <p className="text-lg text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    {inmueble.direccion}
                                </p>
                            </div>
                            <div className="md:text-right bg-rose-50 dark:bg-slate-800 p-6 rounded-2xl w-full md:w-auto self-start border border-rose-100 dark:border-slate-700">
                                <p className="text-sm font-semibold uppercase tracking-wider text-rose-500 dark:text-rose-400 mb-1">Precio Mensual</p>
                                <p className="text-4xl font-black text-slate-900 dark:text-white">${parseFloat(inmueble.precio).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="mt-10">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Acerca de esta propiedad</h2>
                            <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                {inmueble.descripcion}
                            </div>
                        </div>

                        {inmueble.imagenes && inmueble.imagenes.length > 0 && (
                            <div className="mt-12">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Galería de Imágenes</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {inmueble.imagenes.map((img) => (
                                        <div key={img.id} className="relative rounded-2xl overflow-hidden h-48 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
                                            <a href={img.imagen} target="_blank" rel="noopener noreferrer">
                                                <img src={img.imagen} alt="Galería" className="w-full h-full object-cover hover:scale-105 transition duration-500" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-12 pt-10 border-t border-rose-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">¿Te interesa esta propiedad?</h3>
                            <button className="w-full sm:w-auto px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/30 transition transform hover:-translate-y-1 text-lg">
                                Contactar Administrador
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
