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
    code: string;
    address: string;
    city: string;
    type: string;
    type_display: string;
    status: string;
    status_display: string;
    price: string;
    active_tenant?: { first_name: string, last_name: string } | null;
}

const statusTags: Record<string, { label: string, color: string, bg: string }> = {
    'AVAILABLE': { label: 'Disponible', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    'RENTED': { label: 'Arrendado', color: 'text-blue-600', bg: 'bg-blue-50' },
    'MAINTENANCE': { label: 'Mantenimiento', color: 'text-amber-600', bg: 'bg-amber-50' },
};

export default function InmueblesPage() {
    const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'disponible' | 'ocupado'>('all');

    useEffect(() => {
        const fetchInmuebles = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/v1/properties/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setInmuebles(Array.isArray(data) ? data : (data.results || []));
                }
            } catch (error) {
                console.error("Error fetching properties:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInmuebles();
    }, []);

    const filteredInmuebles = inmuebles.filter(inv => {
        if (filter === 'disponible') return inv.status === 'AVAILABLE';
        if (filter === 'ocupado') return inv.status === 'RENTED';
        return true;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header and Search */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Inmuebles</h1>
                        <Link href="/dashboard/inmuebles/nuevo" className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                            Registrar Inmueble
                        </Link>
                    </div>

                    <div className="relative w-full md:max-w-md group">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input 
                            type="text" 
                            placeholder="Buscar por dirección, código o arrendatario..." 
                            className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/20 border border-transparent focus:border-rose-500/30 transition-all text-sm font-medium"
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                        {[
                            { id: 'all', label: 'Todos' },
                            { id: 'disponible', label: 'Disponible' },
                            { id: 'ocupado', label: 'Ocupado' },
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setFilter(t.id as any)}
                                className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${filter === t.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <button className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 hover:text-rose-600 transition-colors shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                    </button>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="bg-white dark:bg-slate-900 h-80 rounded-3xl animate-pulse border border-slate-100 shadow-sm"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredInmuebles.map((inv) => {
                        const status = statusTags[inv.status] || { label: inv.status, color: 'text-slate-500', bg: 'bg-slate-100' };
                        return (
                            <div key={inv.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col gap-5">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">{inv.code}</h3>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{inv.type_display}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 ${status.bg} ${status.color} rounded-lg text-[10px] font-black uppercase tracking-tight`}>
                                        {status.label}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-400">
                                        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        <p className="text-sm font-medium leading-snug line-clamp-2">{inv.address}</p>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-slate-500">
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                        <p className="text-xs font-bold"><span className="text-slate-400">Arrendatario:</span> {inv.active_tenant ? `${inv.active_tenant.first_name} ${inv.active_tenant.last_name}` : 'Disponible'}</p>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-slate-500">
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"></path></svg>
                                        <p className="text-xs font-bold"><span className="text-slate-400">Ciudad:</span> {inv.city || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-5 gap-2 mt-2">
                                    <Link href={`/dashboard/inmuebles/${inv.id}`} className="col-span-2 py-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white text-[11px] font-black uppercase tracking-widest text-center rounded-xl hover:bg-slate-100 transition-colors">
                                        Ver detalle
                                    </Link>
                                    <Link href={`/dashboard/inventarios/nuevo?property=${inv.id}`} className="col-span-2 py-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white text-[11px] font-black uppercase tracking-widest text-center rounded-xl hover:bg-slate-100 transition-colors">
                                        Inventario
                                    </Link>
                                    <button className="col-span-1 p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:text-rose-600 transition-colors">
                                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination Placeholder */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mostrando 1 a {filteredInmuebles.length} de {inmuebles.length} resultados</span>
                <div className="flex gap-2">
                    {[1, 2, 3].map(p => (
                        <button key={p} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-colors ${p === 1 ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                            {p}
                        </button>
                    ))}
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
