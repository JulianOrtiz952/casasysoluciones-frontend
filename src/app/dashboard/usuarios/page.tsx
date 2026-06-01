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
    document_type?: string;
    document_number?: string;
}

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'ADMIN' | 'ASSISTANT'>('all');

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const fetchUsuarios = async () => {
        setLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/v1/usuarios/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsuarios(Array.isArray(data) ? data : (data.results || []));
            }
        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            setLoading(false);
        }
    };

    const staff = usuarios.filter(u => u.role !== 'TENANT');
    const filtered = staff.filter(u => filter === 'all' || u.role === filter);

    const stats = {
        total: staff.length,
        admins: staff.filter(u => u.role === 'ADMIN').length,
        asistentes: staff.filter(u => u.role === 'ASSISTANT').length,
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Personal Administrativo</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Control de acceso y gestión de roles para el equipo interno.</p>
                </div>
                <Link
                    href="/dashboard/usuarios/nuevo"
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 uppercase tracking-widest"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                    Nuevo Usuario
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { label: 'Total Staff', value: stats.total, color: 'bg-indigo-50 text-indigo-600', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                    { label: 'Administradores', value: stats.admins, color: 'bg-purple-50 text-purple-600', icon: 'M9 12l2 2 4-4m5.618-4.016A3.323 3.323 0 0010.603 2L12 10l-2.293 2.293a1 1 0 000 1.414L12 16l1.397-8.382a3.323 3.323 0 004.618 4.016z' },
                    { label: 'Asistentes', value: stats.asistentes, color: 'bg-amber-50 text-amber-600', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-5">
                        <div className={`w-14 h-14 ${s.color} rounded-2xl flex items-center justify-center shrink-0`}>
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={s.icon}></path></svg>
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{s.label}</p>
                            <p className="text-3xl font-black text-slate-800 dark:text-white leading-none">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                {[
                    { id: 'all', label: 'Todos' },
                    { id: 'ADMIN', label: 'Admins' },
                    { id: 'ASSISTANT', label: 'Asistentes' },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setFilter(t.id as any)}
                        className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all ${filter === t.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre del Usuario</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Corporativo</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rol</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                [1, 2, 3].map(i => <tr key={i} className="animate-pulse h-20 bg-slate-50/30"></tr>)
                            ) : filtered.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-black text-slate-500">
                                                {u.first_name?.[0]}{u.last_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{u.first_name} {u.last_name}</p>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Staff ID: {u.id.toString().padStart(4, '0')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-medium text-slate-500">{u.email}</td>
                                    <td className="px-8 py-5">
                                        <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-tight ${
                                            u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                            {u.role_display}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                            <span className={`text-[10px] font-black uppercase tracking-tight ${u.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {u.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="text-slate-400 hover:text-rose-600 transition-colors font-bold text-xs uppercase tracking-widest">
                                            Editar
                                        </button>
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
