'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Kpis {
    total_tickets: number;
    tickets_resueltos: number;
    tickets_urgentes: number;
    tasa_resolucion: number;
    tiempo_promedio_dias: number;
}

interface MesData {
    mes: string;
    total: number;
    resueltos: number;
}

interface TipoData {
    tipo: string;
    label: string;
    count: number;
    porcentaje: number;
}

interface InmuebleData {
    inmueble: string;
    codigo: string;
    tickets: number;
}

interface TicketCSV {
    codigo: string;
    inmueble: string;
    tipo: string;
    prioridad: string;
    estado: string;
    inquilino: string;
    fecha: string;
}

interface ReportData {
    periodo: string;
    dias: number;
    kpis: Kpis;
    tickets_por_mes: MesData[];
    tickets_por_tipo: TipoData[];
    top_inmuebles: InmuebleData[];
    estados: Record<string, number>;
    prioridades: Record<string, number>;
    tickets_csv: TicketCSV[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const PERIOD_OPTIONS = [
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Último mes' },
    { value: '90d', label: 'Últimos 3 meses' },
    { value: '365d', label: 'Último año' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    DRAFT:          { label: 'Borrador',           color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',   dot: 'bg-slate-400' },
    OPEN:           { label: 'Abierto',            color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' },
    ACCEPTED:       { label: 'Aceptado',           color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',     dot: 'bg-blue-500' },
    IN_PROGRESS:    { label: 'En proceso',         color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', dot: 'bg-indigo-500' },
    REJECTED:       { label: 'Rechazado',          color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',     dot: 'bg-rose-500' },
    CLOSED:         { label: 'Cerrado',            color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
    PENDING_ADMIN:  { label: 'Pendiente Admin',    color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',   dot: 'bg-purple-500' },
    PENDING_TENANT: { label: 'Pendiente Inquilino', color: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400', dot: 'bg-fuchsia-500' },
};

const STATUS_SVG_COLORS: Record<string, string> = {
    DRAFT: '#94a3b8', OPEN: '#f59e0b', ACCEPTED: '#3b82f6',
    IN_PROGRESS: '#6366f1', REJECTED: '#f43f5e', CLOSED: '#10b981',
    PENDING_ADMIN: '#8b5cf6', PENDING_TENANT: '#d946ef',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, accent }: {
    label: string; value: string | number; sub?: string; icon: string; accent: string;
}) {
    return (
        <div className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group/card`}>
            <div className={`w-12 h-12 ${accent} rounded-xl flex items-center justify-center shrink-0 shadow-lg group-hover/card:scale-110 transition-transform duration-200`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1 truncate">{label}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{value}</p>
                {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function BarChart({ data }: { data: MesData[] }) {
    const maxVal = Math.max(...data.map(d => d.total), 1);
    return (
        <div className="flex items-end justify-between gap-3 h-48 px-2">
            {data.map((d, i) => {
                const heightTotal = `${(d.total / maxVal) * 100}%`;
                const heightRes = `${(d.resueltos / maxVal) * 100}%`;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                            {d.total} total · {d.resueltos} cerrados
                        </div>
                        {/* Bars */}
                        <div className="w-full relative flex items-end gap-0.5 justify-center" style={{ height: heightTotal }}>
                            <div
                                className="flex-1 bg-rose-100 dark:bg-rose-900/30 rounded-t-md transition-all duration-700"
                                style={{ height: '100%' }}
                            />
                            <div
                                className="flex-1 bg-rose-600 dark:bg-rose-500 rounded-t-md transition-all duration-700"
                                style={{ height: heightRes ? `${(d.resueltos / d.total) * 100}%` : '0%' }}
                            />
                        </div>
                        <p className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-tight text-center leading-tight">{d.mes}</p>
                    </div>
                );
            })}
        </div>
    );
}

function DonutChart({ estados }: { data: Record<string, number>; estados: Record<string, number> }) {
    const total = Object.values(estados).reduce((a, b) => a + b, 0) || 1;
    let offset = 0;
    const segments = Object.entries(estados).map(([status, count]) => {
        const pct = (count / total) * 100;
        const seg = { status, count, pct, offset };
        offset += pct;
        return seg;
    });

    return (
        <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-44 h-44 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4" className="dark:stroke-slate-800" />
                    {segments.map((seg, i) => (
                        <circle
                            key={i}
                            cx="18" cy="18" r="14" fill="none"
                            stroke={STATUS_SVG_COLORS[seg.status] || '#94a3b8'}
                            strokeWidth="4"
                            strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                            strokeDashoffset={-seg.offset}
                            className="transition-all duration-700"
                        />
                    ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                        {Object.values(estados).reduce((a, b) => a + b, 0)}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Total</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 flex-1">
                {segments.map((seg, i) => {
                    const cfg = STATUS_CONFIG[seg.status] || { label: seg.status, dot: 'bg-slate-400' };
                    return (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none truncate">{cfg.label}</p>
                                <p className="text-sm font-black text-slate-700 dark:text-slate-200">{seg.count}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ReportesPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [period, setPeriod] = useState('30d');
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const fetchData = useCallback(async (p: string) => {
        setLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/v1/admin/reports/?period=${p}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setData(await res.json());
        } catch (e) {
            console.error('Error fetching reports:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(period); }, [period, fetchData]);

    const exportCSV = () => {
        if (!data?.tickets_csv?.length) return;
        setExporting(true);
        const headers = ['Código', 'Inmueble', 'Tipo', 'Prioridad', 'Estado', 'Inquilino', 'Fecha'];
        const rows = data.tickets_csv.map(t =>
            [t.codigo, `"${t.inmueble}"`, t.tipo, t.prioridad, t.estado, t.inquilino, t.fecha].join(',')
        );
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-tickets-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setTimeout(() => setExporting(false), 1000);
    };

    const topInmueblesMax = Math.max(...(data?.top_inmuebles.map(i => i.tickets) || [1]), 1);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Reportes</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Análisis de actividad y estadísticas de la plataforma</p>
                </div>
                <button
                    id="btn-export-csv"
                    onClick={exportCSV}
                    disabled={exporting || loading || !data}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-sm text-sm"
                >
                    {exporting ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    )}
                    Exportar CSV
                </button>
            </div>

            {/* ── Period Selector ─────────────────────────────────────── */}
            <div className="flex gap-2 flex-wrap">
                {PERIOD_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        id={`period-${opt.value}`}
                        onClick={() => setPeriod(opt.value)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                            period === opt.value
                                ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-rose-300 hover:text-rose-600'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64 text-slate-400 font-medium animate-pulse">
                    Cargando reportes...
                </div>
            ) : !data ? (
                <div className="flex items-center justify-center h-64 text-slate-400 font-medium">
                    No se pudieron cargar los datos
                </div>
            ) : (
                <>
                    {/* ── KPIs ───────────────────────────────────────────── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <KpiCard
                            label="Total Tickets"
                            value={data.kpis.total_tickets}
                            icon="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                            accent="bg-indigo-600 dark:bg-indigo-500 text-white shadow-indigo-600/20"
                        />
                        <KpiCard
                            label="Tickets Cerrados"
                            value={data.kpis.tickets_resueltos}
                            icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            accent="bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-600/20"
                        />
                        <KpiCard
                            label="Tasa Resolución"
                            value={`${data.kpis.tasa_resolucion}%`}
                            icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            accent="bg-sky-600 dark:bg-sky-500 text-white shadow-sky-600/20"
                        />
                        <KpiCard
                            label="Tickets Urgentes"
                            value={data.kpis.tickets_urgentes}
                            icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            accent="bg-rose-600 dark:bg-rose-500 text-white shadow-rose-600/20"
                        />
                        <KpiCard
                            label="Tiempo Promedio"
                            value={`${data.kpis.tiempo_promedio_dias}d`}
                            sub="días en cerrar"
                            icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            accent="bg-amber-600 dark:bg-amber-500 text-white shadow-amber-600/20"
                        />
                    </div>

                    {/* ── Charts Row ─────────────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Barras por mes */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Tickets por mes</h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Últimos 6 meses</p>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded bg-rose-100 dark:bg-rose-900/40 inline-block" />
                                        Creados
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded bg-rose-600 dark:bg-rose-500 inline-block" />
                                        Cerrados
                                    </span>
                                </div>
                            </div>
                            <BarChart data={data.tickets_por_mes} />
                        </div>

                        {/* Donut estados */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                            <div className="mb-6">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Distribución por Estado</h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">Tickets del período seleccionado</p>
                            </div>
                            <DonutChart data={data.estados} estados={data.estados} />
                        </div>
                    </div>

                    {/* ── Bottom Row ─────────────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Tipo de daño */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                            <div className="mb-6">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Tickets por Tipo de Daño</h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">Clasificación de incidencias</p>
                            </div>
                            {data.tickets_por_tipo.length === 0 ? (
                                <p className="text-slate-400 text-sm text-center py-8">Sin datos en este período</p>
                            ) : (
                                <div className="space-y-4">
                                    {data.tickets_por_tipo.map((item, i) => (
                                        <div key={i} className="group">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{item.label}</span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-xs font-black text-slate-500 dark:text-slate-400">{item.count}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{item.porcentaje}%</span>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-rose-500 dark:bg-rose-600 rounded-full transition-all duration-700"
                                                    style={{ width: `${item.porcentaje}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Top inmuebles */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                            <div className="mb-6">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Top Inmuebles con más Tickets</h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">Propiedades con mayor actividad</p>
                            </div>
                            {data.top_inmuebles.length === 0 ? (
                                <p className="text-slate-400 text-sm text-center py-8">Sin datos en este período</p>
                            ) : (
                                <div className="space-y-4">
                                    {data.top_inmuebles.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 group">
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                                                i === 0 ? 'bg-rose-600 text-white' :
                                                i === 1 ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600' :
                                                'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                            }`}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate pr-2">{item.inmueble}</span>
                                                    <span className="text-xs font-black text-slate-500 shrink-0">{item.tickets}</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ${i === 0 ? 'bg-rose-600' : 'bg-slate-400 dark:bg-slate-600'}`}
                                                        style={{ width: `${(item.tickets / topInmueblesMax) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Prioridades ────────────────────────────────────── */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Distribución por Prioridad</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">Urgencia de las solicitudes registradas</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {[
                                { key: 'LOW',    label: 'Leve',      color: 'from-slate-400 to-slate-500',  bg: 'bg-slate-50 dark:bg-slate-800/50',  text: 'text-slate-600 dark:text-slate-300' },
                                { key: 'MEDIUM', label: 'Importante', color: 'from-orange-400 to-amber-500', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300' },
                                { key: 'HIGH',   label: 'Urgente',   color: 'from-rose-500 to-rose-700',    bg: 'bg-rose-50 dark:bg-rose-900/20',    text: 'text-rose-700 dark:text-rose-300' },
                            ].map(item => {
                                const count = data.prioridades[item.key] || 0;
                                const total = Object.values(data.prioridades).reduce((a, b) => a + b, 0) || 1;
                                const pct = Math.round((count / total) * 100);
                                return (
                                    <div key={item.key} className={`${item.bg} rounded-2xl p-5`}>
                                        <p className={`text-xs font-black uppercase tracking-widest ${item.text} mb-3`}>{item.label}</p>
                                        <p className="text-3xl font-black text-slate-900 dark:text-white mb-2">{count}</p>
                                        <div className="h-1.5 bg-white/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-700`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1.5 font-bold">{pct}% del total</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
