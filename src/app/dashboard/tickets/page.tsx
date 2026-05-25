'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Ticket {
    id: number;
    property: {
        address: string;
        code: string;
    };
    damage_type_display: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    priority_display: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    status_display: string;
    created_at: string;
    title: string;
}

export default function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/v1/tickets/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTickets(Array.isArray(data) ? data : (data.results || []));
                }
            } catch (error) {
                console.error("Error fetching tickets:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        in_progress: tickets.filter(t => t.status === 'in_progress').length,
        closed: tickets.filter(t => t.status === 'closed' || t.status === 'resolved').length,
    };

    const filteredTickets = tickets.filter(t => filterStatus === 'all' || t.status === filterStatus);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Tickets</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Administra las solicitudes y mantenimientos de tus inmuebles.</p>
                </div>
                <Link
                    href="/dashboard/tickets/nuevo"
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 uppercase tracking-widest"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                    Nuevo Ticket
                </Link>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Tickets', value: stats.total, color: 'bg-indigo-50 text-indigo-600', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
                    { label: 'Abiertos', value: stats.open, color: 'bg-amber-50 text-amber-600', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { label: 'En Proceso', value: stats.in_progress, color: 'bg-blue-50 text-blue-600', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                    { label: 'Cerrados', value: stats.closed, color: 'bg-emerald-50 text-emerald-600', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
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

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full md:w-auto overflow-x-auto">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'open', label: 'Abiertos' },
                        { id: 'in_progress', label: 'En Proceso' },
                        { id: 'resolved', label: 'Resueltos' },
                        { id: 'closed', label: 'Cerrados' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setFilterStatus(t.id)}
                            className={`whitespace-nowrap px-5 py-2 text-xs font-bold rounded-xl transition-all ${filterStatus === t.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-64 group">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input 
                        type="text" 
                        placeholder="Buscar ticket..." 
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
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID Ticket</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inmueble</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prioridad</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                [1, 2, 3].map(i => <tr key={i} className="animate-pulse h-16 bg-slate-50/30"></tr>)
                            ) : filteredTickets.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">No se encontraron tickets</td></tr>
                            ) : filteredTickets.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">#{t.id.toString().padStart(4, '0')}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{t.property?.address || t.property?.code}</td>
                                    <td className="px-6 py-4 text-xs text-slate-500">{t.damage_type_display}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight ${
                                            t.priority === 'urgent' ? 'bg-rose-900 text-white' :
                                            t.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                                            t.priority === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {t.priority_display}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tight ${
                                            t.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                                            t.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                            t.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {t.status_display}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/dashboard/tickets/${t.id}`} className="text-rose-600 hover:text-rose-700 font-bold text-xs uppercase tracking-widest transition-colors">
                                            Ver
                                        </Link>
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
