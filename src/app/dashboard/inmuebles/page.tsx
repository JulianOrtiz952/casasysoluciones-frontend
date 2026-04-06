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
    en_conjunto?: boolean;
    administracion_incluida?: boolean;
    valor_administracion?: string | null;
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
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Añadir Inmueble
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 dark:border-rose-500"></div>
                </div>
            ) : inmuebles.length === 0 ? (
                <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm backdrop-blur-md">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">No hay inmuebles registrados</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto font-light leading-relaxed">Comienza añadiendo tu primera propiedad para empezar a gestionar tu catálogo.</p>
                    <Link
                        href="/dashboard/inmuebles/nuevo"
                        className="inline-flex px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
                    >
                        Registrar mi primer inmueble
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inmuebles.map((inmueble) => (
                        <div key={inmueble.id} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 dark:border-slate-800 hover:-translate-y-0.5 transition-all duration-300 group flex flex-col">
                            <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                {(() => {
                                    const mainImg = inmueble.imagenes?.find(img => img.es_portada)?.imagen || (inmueble.imagenes?.length ? inmueble.imagenes[0].imagen : inmueble.imagen);
                                    return mainImg ? (
                                        <img
                                            src={mainImg}
                                            alt={inmueble.titulo}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    );
                                })()}
                                <div className="absolute top-3 right-3">
                                    <span className={`px-3 py-1 text-[11px] uppercase tracking-wider font-bold rounded-full backdrop-blur-md shadow-sm border border-white/20 ${estadoInfo[inmueble.estado]?.colorClass || 'bg-slate-500/90 text-white'}`}>
                                        {estadoInfo[inmueble.estado]?.label || inmueble.estado}
                                    </span>
                                </div>
                            </div>
                            <div className="p-5 flex flex-col flex-grow">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate group-hover:text-rose-600 transition-colors">{inmueble.titulo}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5 truncate font-medium">
                                    <svg className="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    {inmueble.direccion}
                                </p>
                                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">${parseFloat(inmueble.precio).toLocaleString()} <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">/mes</span></span>
                                        <Link href={`/dashboard/inmuebles/${inmueble.id}`} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition">
                                            Ver detalles
                                        </Link>
                                    </div>
                                    {inmueble.en_conjunto && (
                                        <div className="mt-2.5 text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
                                            <span>Condominio:</span>
                                            {inmueble.administracion_incluida ? (
                                                <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">Incluido</span>
                                            ) : (
                                                <span className="text-slate-600 dark:text-slate-300 font-semibold">+ ${inmueble.valor_administracion ? parseFloat(inmueble.valor_administracion).toLocaleString() : '0'}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
