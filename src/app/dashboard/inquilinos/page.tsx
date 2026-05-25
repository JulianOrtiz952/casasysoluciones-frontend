'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Usuario {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: 'ADMIN' | 'ASSISTANT' | 'TENANT';
    role_display: string;
    is_active: boolean;
    document_type: string;
    document_number: string;
    phone: string;
    public_code: string;
}

export default function InquilinosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'ADMIN' | 'ASSISTANT' | 'TENANT'>('all');

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const token = localStorage.getItem('token');
                // Buscamos todos los usuarios para la gestión administrativa
                const res = await fetch(`${API_URL}/api/v1/usuarios/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUsuarios(Array.isArray(data) ? data : (data.results || []));
                }
            } catch (error) {
                console.error("Error al cargar usuarios", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsuarios();
    }, []);

    const filtered = usuarios.filter(u => filter === 'all' || u.role === filter);

    const stats = {
        total: usuarios.length,
        admins: usuarios.filter(u => u.role === 'ADMIN').length,
        asistentes: usuarios.filter(u => u.role === 'ASSISTANT').length,
        arrendatarios: usuarios.filter(u => u.role === 'TENANT').length,
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Usuarios</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Gestiona los administradores, asistentes y arrendatarios del sistema.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        Exportar
                    </button>
                    <Link
                        href="/dashboard/inquilinos/nuevo"
                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 uppercase tracking-widest"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                        Crear Arrendatario
                    </Link>
                </div>
            </div>

            {/* Stat Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Usuarios', value: stats.total, color: 'bg-blue-50 text-blue-600', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                    { label: 'Administradores', value: stats.admins, color: 'bg-purple-50 text-purple-600', icon: 'M12 11c0 3.517-1.009 6.799-2.753 9.571m-1.17-10.963a11.323 11.323 0 01-1.378-5.753m11.074 12.355A11.303 11.303 0 019 21a11.303 11.303 0 01-11.23-9.512C.33 6.945 3.866 3 8 3c4.135 0 7.67 3.945 7.231 8.488a11.326 11.326 0 01-1.378 5.753l1.17 1.407a11.316 11.316 0 011.054-2.693l1.17 1.406z' },
                    { label: 'Asistentes', value: stats.asistentes, color: 'bg-orange-50 text-orange-600', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                    { label: 'Arrendatarios', value: stats.arrendatarios, color: 'bg-emerald-50 text-emerald-600', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center shrink-0`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={s.icon}></path></svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{s.label}</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters and Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full md:w-auto">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'ADMIN', label: 'Administradores' },
                        { id: 'ASSISTANT', label: 'Asistentes' },
                        { id: 'TENANT', label: 'Arrendatarios' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setFilter(t.id as any)}
                            className={`flex-1 md:flex-none px-5 py-2 text-xs font-bold rounded-xl transition-all ${filter === t.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-64 group">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input 
                        type="text" 
                        placeholder="Buscar en la tabla..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl outline-none text-xs font-medium border border-transparent focus:border-slate-200 transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documento</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usuario / Email</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rol</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                [1, 2, 3].map(i => <tr key={i} className="animate-pulse h-16 bg-slate-50/30"></tr>)
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">No se encontraron usuarios</td></tr>
                            ) : filtered.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500">
                                                {u.first_name?.[0]}{u.last_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{u.first_name} {u.last_name}</p>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">ID: USR-{u.id.toString().padStart(4, '0')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{u.document_type || 'CC'} {u.document_number || 'N/A'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-slate-500 lowercase">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight ${
                                            u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                            u.role === 'ASSISTANT' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {u.role_display}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                            <span className={`text-[10px] font-black uppercase tracking-tight ${u.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {u.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4">
                <span>Mostrando 1 a {filtered.length} de {stats.total} usuarios</span>
                <div className="flex gap-2">
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-600 text-white">1</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">2</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">...</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
