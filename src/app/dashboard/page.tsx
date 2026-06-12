'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
        prioridad_label: string;
        estado: string;
        estado_label: string;
        fecha: string;
    }>;
}

function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export default function DashboardSummary() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const token = localStorage.getItem('token');
                if (token) {
                    const decoded = parseJwt(token);
                    if (decoded) {
                        const role = decoded.role || decoded.rol;
                        if (role === 'TENANT') {
                            router.push('/dashboard/inmuebles');
                            return;
                        }
                        if (role === 'TECHNICIAN') {
                            router.push('/dashboard/tickets');
                            return;
                        }
                    }
                }
                const tokenCheck = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/v1/admin/dashboard-stats/`, {
                    headers: { 'Authorization': `Bearer ${tokenCheck}` }
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
    }, [router]);

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
                {/* Total Inmuebles */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 9.75L12 3l9 6.75V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 21V12h6v9" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Total Inmuebles</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{stats?.overview.total_inmuebles ?? 0}</p>
                    </div>
                </div>

                {/* Disponibles */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-emerald-600 dark:bg-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Disponibles</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{stats?.overview.disponibles ?? 0}</p>
                    </div>
                </div>

                {/* Inquilinos Activos */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-violet-600 dark:bg-violet-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-violet-600/20 group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Inquilinos Activos</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{stats?.overview.inquilinos_activos ?? 0}</p>
                    </div>
                </div>

                {/* Tickets Abiertos */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-amber-600 dark:bg-amber-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-600/20 group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Tickets Abiertos</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{stats?.overview.tickets_abiertos ?? 0}</p>
                    </div>
                </div>

                {/* Tickets Urgentes */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-rose-200/80 dark:border-rose-900/50 bg-gradient-to-br from-white to-rose-50/40 dark:from-slate-900 dark:to-rose-950/20 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-rose-600 dark:bg-rose-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/20 group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-rose-400 dark:text-rose-500 uppercase tracking-widest leading-none mb-1.5">Tickets Urgentes</p>
                        <p className="text-2xl font-black text-rose-600 dark:text-rose-400 leading-none">{stats?.overview.tickets_urgentes ?? 0}</p>
                    </div>
                </div>
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
                                        const colors: Record<string, string> = {
                                            DRAFT: '#94a3b8',
                                            OPEN: '#f59e0b',
                                            ACCEPTED: '#3b82f6',
                                            IN_PROGRESS: '#6366f1',
                                            REJECTED: '#f43f5e',
                                            CLOSED: '#10b981',
                                        };
                                        return Object.entries(stats?.tickets_by_status || {}).map(([status, count], i) => {
                                            const percentage = (count / total) * 100;
                                            const dash = `${percentage} ${100 - percentage}`;
                                            const res = <circle key={i} cx="18" cy="18" r="15.915" fill="none" stroke={colors[status] || '#94a3b8'} strokeWidth="3" strokeDasharray={dash} strokeDashoffset={-offset}></circle>;
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
                                { label: 'Borrador',    key: 'DRAFT',       color: 'bg-slate-400' },
                                { label: 'Abierto',     key: 'OPEN',        color: 'bg-amber-500' },
                                { label: 'Aceptado',    key: 'ACCEPTED',    color: 'bg-blue-500' },
                                { label: 'En proceso',  key: 'IN_PROGRESS', color: 'bg-indigo-500' },
                                { label: 'Rechazado',   key: 'REJECTED',    color: 'bg-rose-500' },
                                { label: 'Cerrado',     key: 'CLOSED',      color: 'bg-emerald-500' },
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
                            { label: 'Leve',       key: 'LOW',    color: 'bg-slate-400' },
                            { label: 'Importante', key: 'MEDIUM', color: 'bg-orange-500' },
                            { label: 'Urgente',    key: 'HIGH',   color: 'bg-rose-600' },
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
                                            ticket.prioridad === 'HIGH' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' : 
                                            ticket.prioridad === 'MEDIUM' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                            <div className={`w-1 h-1 rounded-full ${
                                                ticket.prioridad === 'HIGH' ? 'bg-rose-600' : 
                                                ticket.prioridad === 'MEDIUM' ? 'bg-orange-500' : 'bg-slate-400'
                                            }`}></div>
                                            {ticket.prioridad_label || ticket.prioridad}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tight ${
                                            ticket.estado === 'CLOSED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                            ticket.estado === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' :
                                            ticket.estado === 'ACCEPTED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                                            ticket.estado === 'REJECTED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400' :
                                            ticket.estado === 'DRAFT' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                                            'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                        }`}>
                                            {ticket.estado_label || ticket.estado}
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
