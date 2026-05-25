'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
    overview: {
        total_inmuebles: number;
        disponibles: number;
        inquilinos_activos: number;
        tickets_abiertos: number;
        tickets_urgentes: number;
    };
    tickets_by_status: Record<string, number>;
    tickets_by_priority: Record<string, number>;
    recent_tickets: Array<{
        id: string;
        inmueble: string;
        tipo: string;
        prioridad: string;
        estado: string;
        fecha: string;
    }>;
}

export default function DashboardSummary() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/v1/admin/dashboard-stats/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center h-64 animate-pulse text-slate-400 font-medium">Cargando resumen...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Resumen General</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Monitorea el estado de tus propiedades e incidencias</p>
                </div>
                <Link href="/dashboard/tickets/nuevo" className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                    Nuevo Ticket
                </Link>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Total Inmuebles', value: stats?.overview.total_inmuebles, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' },
                    { label: 'Disponibles', value: stats?.overview.disponibles, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' },
                    { label: 'Inquilinos Activos', value: stats?.overview.inquilinos_activos, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600' },
                    { label: 'Tickets Abiertos', value: stats?.overview.tickets_abiertos, icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z', color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' },
                    { label: 'Tickets Urgentes', value: stats?.overview.tickets_urgentes, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shrink-0`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon}></path></svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{stat.value ?? 0}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tickets by Status Chart (Doughnut) */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tickets por Estado</h3>
                        <button className="text-slate-400 hover:text-slate-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                        </button>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="relative w-48 h-48">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" className="dark:stroke-slate-800"></circle>
                                {(() => {
                                    const total = Object.values(stats?.tickets_by_status || {}).reduce((a, b) => a + b, 0) || 1;
                                    let offset = 0;
                                    const colors = { open: '#f59e0b', in_progress: '#3b82f6', resolved: '#10b981', closed: '#64748b' };
                                    return Object.entries(stats?.tickets_by_status || {}).map(([status, count], i) => {
                                        const percentage = (count / total) * 100;
                                        const dash = `${percentage} ${100 - percentage}`;
                                        const res = <circle key={i} cx="18" cy="18" r="15.915" fill="none" stroke={colors[status as keyof typeof colors] || '#000'} strokeWidth="3" strokeDasharray={dash} strokeDashoffset={-offset}></circle>;
                                        offset += percentage;
                                        return res;
                                    });
                                })()}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{Object.values(stats?.tickets_by_status || {}).reduce((a, b) => a + b, 0)}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Total</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 flex-1 w-full">
                            {[
                                { label: 'Abiertos', key: 'open', color: 'bg-amber-500' },
                                { label: 'En progreso', key: 'in_progress', color: 'bg-blue-500' },
                                { label: 'Resueltos', key: 'resolved', color: 'bg-emerald-500' },
                                { label: 'Cerrados', key: 'closed', color: 'bg-slate-400' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{item.label}</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{stats?.tickets_by_status[item.key] || 0}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tickets by Priority Chart (Bars) */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tickets por Prioridad</h3>
                        <button className="text-slate-400 hover:text-slate-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                        </button>
                    </div>

                    <div className="h-48 flex items-end justify-between gap-4 px-2">
                        {[
                            { label: 'Baja', key: 'low', color: 'bg-slate-400' },
                            { label: 'Media', key: 'medium', color: 'bg-orange-500' },
                            { label: 'Alta', key: 'high', color: 'bg-rose-500' },
                            { label: 'Urgente', key: 'urgent', color: 'bg-rose-900' },
                        ].map((item, i) => {
                            const val = stats?.tickets_by_priority[item.key] || 0;
                            const max = Math.max(...Object.values(stats?.tickets_by_priority || {}), 1);
                            const height = `${(val / max) * 100}%`;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center group">
                                    <div className="mb-2 text-xs font-black text-slate-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        {val}
                                    </div>
                                    <div className={`w-full ${item.color} rounded-lg transition-all duration-500 shadow-sm`} style={{ height }}></div>
                                    <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Tickets Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tickets Recientes</h3>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                            Filtrar
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inmueble</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prioridad</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {stats?.recent_tickets.map((ticket, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">#{ticket.id}</td>
                                    <td className="px-8 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium truncate max-w-[200px]">{ticket.inmueble}</td>
                                    <td className="px-8 py-4 text-sm text-slate-500 dark:text-slate-500">{ticket.tipo}</td>
                                    <td className="px-8 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            ticket.prioridad === 'high' ? 'bg-rose-50 text-rose-600' : 
                                            ticket.prioridad === 'medium' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-600'
                                        }`}>
                                            <div className={`w-1 h-1 rounded-full ${
                                                ticket.prioridad === 'high' ? 'bg-rose-600' : 
                                                ticket.prioridad === 'medium' ? 'bg-orange-600' : 'bg-slate-600'
                                            }`}></div>
                                            {ticket.prioridad}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tight ${
                                            ticket.estado === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                                            ticket.estado === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {ticket.estado}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-sm text-slate-400">{ticket.fecha}</td>
                                    <td className="px-8 py-4 text-right">
                                        <Link href={`/dashboard/tickets/${ticket.id}`} className="text-rose-600 hover:text-rose-700 font-bold text-xs uppercase tracking-widest">
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
