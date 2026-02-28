'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

const estadoInfo: Record<string, { label: string, colorClass: string }> = {
    'arrendada': { label: 'Arrendada', colorClass: 'bg-indigo-500/90 text-white' },
    'en_oferta': { label: 'En Oferta', colorClass: 'bg-emerald-500/90 text-white' },
    'en_mantenimiento': { label: 'En Mantenimiento', colorClass: 'bg-amber-500/90 text-white' },
    'inactiva': { label: 'Inactiva', colorClass: 'bg-slate-500/90 text-white' },
};

export default function InmueblesPage() {
    const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInmuebles = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${API_URL}/api/v1/inmuebles/`);
                if (res.ok) {
                    const data = await res.json();
                    setInmuebles(data);
                } else {
                    console.error("Error al cargar los inmuebles");
                }
            } catch (error) {
                console.error("Error de red:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInmuebles();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Catálogo de Inmuebles</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gesti&oacute;n y visualizaci&oacute;n de tus propiedades.</p>
                </div>
                <Link
                    href="/dashboard/inmuebles/nuevo"
                    className="px-6 py-3 bg-rose-500 text-white font-semibold rounded-xl hover:bg-rose-600 transition shadow-lg shadow-rose-500/30 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Añadir Inmueble
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
                </div>
            ) : inmuebles.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="w-20 h-20 bg-rose-50 dark:bg-slate-800 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hay inmuebles registrados</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">Comienza añadiendo tu primera propiedad para empezar a gestionar tu catálogo.</p>
                    <Link
                        href="/dashboard/inmuebles/nuevo"
                        className="inline-flex px-6 py-3 bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-semibold rounded-xl hover:bg-rose-100 dark:hover:bg-slate-700 transition"
                    >
                        Registrar mi primer inmueble
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inmuebles.map((inmueble) => (
                        <div key={inmueble.id} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition group">
                            <div className="relative h-48 bg-slate-100 dark:bg-slate-800">
                                {(() => {
                                    const mainImg = inmueble.imagenes?.find(img => img.es_portada)?.imagen || (inmueble.imagenes?.length ? inmueble.imagenes[0].imagen : inmueble.imagen);
                                    return mainImg ? (
                                        <img
                                            src={mainImg}
                                            alt={inmueble.titulo}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    );
                                })()}
                                <div className="absolute top-3 right-3">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-md shadow-sm ${estadoInfo[inmueble.estado]?.colorClass || 'bg-slate-500/90 text-white'}`}>
                                        {estadoInfo[inmueble.estado]?.label || inmueble.estado}
                                    </span>
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate">{inmueble.titulo}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1 truncate">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    {inmueble.direccion}
                                </p>
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-xl font-black text-rose-500">${parseFloat(inmueble.precio).toLocaleString()} <span className="text-xs text-slate-400 font-normal">/mes</span></span>
                                    <Link href={`/dashboard/inmuebles/${inmueble.id}`} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 transition">
                                        Ver detalles
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
