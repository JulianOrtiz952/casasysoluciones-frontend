'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Inventario {
    id: number;
    property: {
        address: string;
        code: string;
    };
    created_at: string;
    tenant: {
        first_name: string;
        last_name: string;
    };
    status: 'draft' | 'finalized';
    status_display: string;
    spaces_count: number;
}

export default function InventariosPage() {
    const [inventarios, setInventarios] = useState<Inventario[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInventarios = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/v1/inventarios/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setInventarios(Array.isArray(data) ? data : (data.results || []));
                }
            } catch (error) {
                console.error("Error fetching inventarios:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInventarios();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Inventarios de Inmuebles</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Control y seguimiento del estado físico de las propiedades.</p>
                </div>
                <Link
                    href="/dashboard/inventarios/nuevo"
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 uppercase tracking-widest"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                    Realizar Inventario
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative group">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input type="text" placeholder="Buscar por propiedad..." className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none text-xs font-medium border border-transparent focus:border-slate-200 transition-all" />
                </div>
                <div className="relative">
                    <select className="w-full pl-4 pr-10 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none text-xs font-medium border border-transparent focus:border-slate-200 appearance-none transition-all">
                        <option>Todas las propiedades</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                <div className="relative">
                    <input type="date" className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none text-xs font-medium border border-transparent focus:border-slate-200 transition-all" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID Inmueble</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha de Registro</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsable</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                [1, 2, 3].map(i => <tr key={i} className="animate-pulse h-16 bg-slate-50/30"></tr>)
                            ) : inventarios.length === 0 ? (
                                <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">No hay inventarios registrados</td></tr>
                            ) : inventarios.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{inv.property?.address || inv.property?.code}</p>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">INV-{inv.id.toString().padStart(4, '0')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-xs font-bold text-slate-600 dark:text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                                    <td className="px-8 py-4 text-xs font-medium text-slate-500">{inv.tenant?.first_name} {inv.tenant?.last_name}</td>
                                    <td className="px-8 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                                            inv.status === 'finalized' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {inv.status_display}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/dashboard/inventarios/${inv.id}`} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                            </Link>
                                            <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
