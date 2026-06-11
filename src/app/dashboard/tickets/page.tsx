'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = parseJwt(token);
            if (decoded) {
                setUserRole(decoded.role || decoded.rol || '');
            }
        }
    }, []);

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
        open: tickets.filter(t => t.status?.toUpperCase() === 'OPEN').length,
        in_progress: tickets.filter(t => {
            const s = t.status?.toUpperCase();
            return s === 'IN_PROGRESS' || s === 'ACCEPTED';
        }).length,
        closed: tickets.filter(t => {
            const s = t.status?.toUpperCase();
            return s === 'CLOSED' || s === 'REJECTED';
        }).length,
    };

    const filteredTickets = tickets.filter(t => {
        if (filterStatus === 'all') return true;
        const s = t.status?.toUpperCase();
        if (filterStatus === 'open') return s === 'OPEN';
        if (filterStatus === 'in_progress') return s === 'IN_PROGRESS' || s === 'ACCEPTED';
        if (filterStatus === 'closed') return s === 'CLOSED' || s === 'REJECTED';
        return s === filterStatus.toUpperCase();
    });

    const getStatusPriority = (status: string) => {
        const s = status?.toUpperCase();
        if (s === 'OPEN' || s === 'ACCEPTED' || s === 'IN_PROGRESS') return 1; // Active
        return 2; // Closed / Rejected
    };

    const sortedTickets = [...filteredTickets].sort((a, b) => {
        const pA = getStatusPriority(a.status);
        const pB = getStatusPriority(b.status);
        if (pA !== pB) return pA - pB;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {userRole === 'TECHNICIAN' ? 'Mis Tickets Asignados' : 'Gestión de Tickets'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        {userRole === 'TECHNICIAN'
                            ? 'Visualiza y gestiona los tickets asignados a ti.'
                            : 'Administra las solicitudes y mantenimientos de tus inmuebles.'}
                    </p>
                </div>
                {userRole !== 'TECHNICIAN' && (
                    <Link
                        href="/dashboard/tickets/nuevo"
                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 uppercase tracking-widest"
                    >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                    Nuevo Ticket
                </Link>
                )}
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Tickets', value: stats.total, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
                    { label: 'Abiertos', value: stats.open, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { label: 'En Proceso', value: stats.in_progress, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                    { label: 'Cerrados', value: stats.closed, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
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
                        { id: 'closed', label: 'Cerrados/Rechazados' },
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
                            ) : sortedTickets.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">No se encontraron tickets</td></tr>
                            ) : sortedTickets.map((t) => {
                                const statusUpper = t.status?.toUpperCase();
                                const isActive = statusUpper === 'OPEN' || statusUpper === 'ACCEPTED' || statusUpper === 'IN_PROGRESS';
                                
                                let trClass = "transition-all duration-300 ";
                                let borderClass = "border-l-4 ";
                                if (statusUpper === 'OPEN') {
                                    trClass += "bg-amber-500/[0.02] dark:bg-amber-500/[0.01] hover:bg-amber-500/[0.05] dark:hover:bg-amber-500/[0.03]";
                                    borderClass += "border-l-amber-500";
                                } else if (statusUpper === 'ACCEPTED') {
                                    trClass += "bg-indigo-500/[0.02] dark:bg-indigo-500/[0.01] hover:bg-indigo-500/[0.05] dark:hover:bg-indigo-500/[0.03]";
                                    borderClass += "border-l-indigo-500";
                                } else if (statusUpper === 'IN_PROGRESS') {
                                    trClass += "bg-blue-500/[0.02] dark:bg-blue-500/[0.01] hover:bg-blue-500/[0.05] dark:hover:bg-blue-500/[0.03]";
                                    borderClass += "border-l-blue-500";
                                } else {
                                    trClass += "bg-slate-500/[0.01] dark:bg-slate-500/[0.005] hover:bg-slate-500/[0.03] dark:hover:bg-slate-500/[0.02] opacity-65 hover:opacity-100";
                                    borderClass += "border-l-slate-300 dark:border-l-slate-800";
                                }

                                return (
                                    <tr key={t.id} className={trClass}>
                                        <td className={`px-6 py-4 text-sm font-bold text-slate-900 dark:text-white ${borderClass}`}>
                                            #{t.id.toString().padStart(4, '0')}
                                        </td>
                                        <td className={`px-6 py-4 text-xs font-bold truncate max-w-[150px] ${isActive ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                                            {t.property?.address || t.property?.code}
                                        </td>
                                        <td className={`px-6 py-4 text-xs ${isActive ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                            {t.damage_type_display}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight ${
                                                t.priority === 'urgent' ? 'bg-rose-900 text-white' :
                                                t.priority === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' :
                                                t.priority === 'medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' : 
                                                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                            }`}>
                                                {t.priority_display}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                                                statusUpper === 'CLOSED' || statusUpper === 'REJECTED' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                                                statusUpper === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' :
                                                statusUpper === 'ACCEPTED' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400' :
                                                statusUpper === 'OPEN' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                                                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                            }`}>
                                                {isActive && (
                                                    <span className="relative flex h-2 w-2">
                                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                                            statusUpper === 'OPEN' ? 'bg-amber-400' :
                                                            statusUpper === 'ACCEPTED' ? 'bg-indigo-400' :
                                                            'bg-blue-400'
                                                        }`}></span>
                                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                                            statusUpper === 'OPEN' ? 'bg-amber-500' :
                                                            statusUpper === 'ACCEPTED' ? 'bg-indigo-500' :
                                                            'bg-blue-500'
                                                        }`}></span>
                                                    </span>
                                                )}
                                                {t.status_display}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-xs ${isActive ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                            {new Date(t.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/dashboard/tickets/${t.id}`} className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-bold text-xs uppercase tracking-widest transition-colors">
                                                Ver
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
