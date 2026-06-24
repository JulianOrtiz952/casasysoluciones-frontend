'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

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
    owner_name: string;
    cover_image?: string | null;
    rooms?: number | null;
    bathrooms?: number | null;
    living_rooms?: number | null;
    kitchens?: number | null;
    garages?: number | null;
    is_commercial?: boolean;
    in_complex?: boolean;
    admin_included?: boolean;
    admin_value?: string | null;
    google_maps_link?: string | null;
    description?: string | null;
    observations?: string | null;
    has_active_closure_request?: boolean;
    active_closure_ticket_id?: number | null;
    is_active?: boolean;
}

const statusTags: Record<string, { label: string, color: string, bg: string }> = {
    'AVAILABLE': { label: 'Disponible', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30' },
    'RENTED': { label: 'Arrendado', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30' },
    'MAINTENANCE': { label: 'Mantenimiento', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30' },
};

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

export default function InmueblesPage() {
    const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'disponible' | 'ocupado'>('all');
    const [userRole, setUserRole] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [userId, setUserId] = useState<number | null>(null);
    const [cancelingLease, setCancelingLease] = useState(false);
    const [includeInactive, setIncludeInactive] = useState(false);

    // Múltiples propiedades y estados de modal
    const [selectedPropIndex, setSelectedPropIndex] = useState(0);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [propertyToCancel, setPropertyToCancel] = useState<Inmueble | null>(null);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    const getImageUrl = (url: string | null | undefined) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        return `${API_URL}${url}`;
    };

    useEffect(() => {
        setMounted(true);
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = parseJwt(token);
            if (decoded) {
                const role = decoded.role || decoded.rol;
                setUserRole(role || '');
            }

            // Fetch me to get modern User ID for associations
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            fetch(`${API_URL}/api/v1/auth/me/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => {
                if (res.ok) return res.json();
            }).then(data => {
                if (data) {
                    setUserId(data.id);
                }
            }).catch(err => console.error("Error fetching user profile:", err));
        }
    }, []);

    useEffect(() => {
        if (!userRole) return;

        const fetchInmuebles = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const token = localStorage.getItem('token');
                let endpoint = userRole === 'TENANT'
                    ? `${API_URL}/api/v1/properties/mine/`
                    : `${API_URL}/api/v1/properties/`;

                if (userRole !== 'TENANT' && includeInactive) {
                    endpoint += '?include_inactive=true';
                }

                const res = await fetch(endpoint, {
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
    }, [userRole, includeInactive]);

    const openCancelModal = (prop: Inmueble) => {
        setPropertyToCancel(prop);
        setCancelError(null);
        setShowCancelModal(true);
    };

    const handleCancelarArrendamiento = async (prop: Inmueble) => {
        if (!userId || !prop) return;
        setCancelingLease(true);
        setCancelError(null);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');

            // 1. Dissociate in modern system
            const res1 = await fetch(`${API_URL}/api/v1/tenants/${userId}/properties/${prop.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res1.ok) {
                const errData = await res1.json().catch(() => null);
                throw new Error(errData?.error?.message || errData?.message || 'Error al desasociar en el sistema moderno.');
            }

            const data1 = await res1.json().catch(() => ({}));
            if (data1.error === 'initial_inventory_not_signed') {
                setCancelError(data1.message);
                return;
            }
            if (data1.status === 'request_created') {
                // For tenants, cancellation only creates a ticket and keeps them associated.
                // Do not deactivate legacy HistorialAlquiler yet.
                setShowCancelModal(false);
                window.location.reload();
                return;
            }

            // 2. Dissociate in legacy system (HistorialAlquiler)
            const resHist = await fetch(`${API_URL}/api/v1/historial_alquiler/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resHist.ok) {
                const dataHist = await resHist.json();
                const allHist = Array.isArray(dataHist) ? dataHist : (dataHist.results || []);
                const activeHist = allHist.find((h: any) => h.inmueble === prop.id && h.esta_activo);
                if (activeHist) {
                    const res2 = await fetch(`${API_URL}/api/v1/historial_alquiler/${activeHist.id}/`, {
                        method: 'PATCH',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            esta_activo: false,
                            fecha_fin: new Date().toISOString().split('T')[0]
                        })
                    });
                    if (!res2.ok) {
                        console.warn("No se pudo actualizar el historial de alquiler legacy.");
                    }
                }
            }

            setShowCancelModal(false);
            window.location.reload();
        } catch (error: any) {
            setCancelError(error.message || "Error al cancelar el arrendamiento.");
        } finally {
            setCancelingLease(false);
        }
    };

    const filteredInmuebles = inmuebles.filter(inv => {
        // Apply status filter for admin
        if (userRole !== 'TENANT') {
            if (filter === 'disponible') return inv.status === 'AVAILABLE';
            if (filter === 'ocupado') return inv.status === 'RENTED';
        }
        // Apply search query
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            return (
                inv.address.toLowerCase().includes(query) ||
                inv.code.toLowerCase().includes(query) ||
                inv.owner_name.toLowerCase().includes(query) ||
                (inv.city && inv.city.toLowerCase().includes(query))
            );
        }
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400 font-medium animate-pulse">
                Cargando información...
            </div>
        );
    }

    // --- CLIENT (TENANT) VIEW ---
    if (userRole === 'TENANT') {
        if (inmuebles.length === 0) {
            return (
                <div className="max-w-2xl mx-auto text-center space-y-6 py-12 animate-in fade-in duration-500">
                    <div className="w-24 h-24 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Sin propiedad asociada</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm font-medium leading-relaxed">
                            Actualmente no tienes ningún inmueble activo registrado bajo tu cuenta de arrendatario.
                        </p>
                    </div>
                    <div className="pt-2">
                        <Link href="/dashboard/tickets" className="px-6 py-3 bg-slate-900 text-white dark:bg-rose-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md hover:scale-105 active:scale-95">
                            Ver mis tickets
                        </Link>
                    </div>
                </div>
            );
        }

        const prop = inmuebles[selectedPropIndex] || inmuebles[0];
        return (
            <>
                <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Mi Espacio Rentado</span>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase mt-1">Mi Propiedad</h1>
                    </div>
                    {inmuebles.length > 1 && (
                        <div className="flex flex-wrap gap-2 pt-2 sm:pt-0">
                            {inmuebles.map((p, idx) => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPropIndex(idx)}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                                        selectedPropIndex === idx 
                                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/10' 
                                        : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800'
                                    }`}
                                >
                                    {p.code}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* Left Panel: Property Showcase */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Showcase Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
                            {/* Image Header */}
                            <div className="h-64 sm:h-80 w-full relative bg-slate-100 dark:bg-slate-800">
                                {prop.cover_image ? (
                                    <img src={getImageUrl(prop.cover_image)} alt="Vista de propiedad" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 gap-2">
                                        <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        <span className="text-xs font-black uppercase tracking-wider">Imagen de Referencia</span>
                                    </div>
                                )}
                                {/* Overlay Badges */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className="px-3 py-1 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
                                        {prop.code}
                                    </span>
                                    <span className="px-3 py-1 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
                                        {prop.type_display}
                                    </span>
                                </div>
                            </div>

                            {/* Property Main Specs */}
                            <div className="p-6 sm:p-8 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        <span className="text-xs font-bold uppercase tracking-wider">{prop.city}</span>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                                        {prop.address}
                                    </h2>
                                </div>

                                {/* Distribution Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    {[
                                        { val: prop.rooms, label: 'Habitaciones', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                                        { val: prop.bathrooms, label: 'Baños', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                                        { val: prop.living_rooms, label: 'Salas', icon: 'M4 6h16M4 18h16M4 12h16' },
                                        { val: prop.kitchens, label: 'Cocina', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
                                        { val: prop.garages, label: 'Garajes', icon: 'M5 10l7-7 7 7M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10' },
                                    ].map((spec, i) => (
                                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex flex-col items-center text-center justify-center border border-slate-100/50 dark:border-slate-800/50 shadow-sm transition-all hover:scale-[1.03]">
                                            <svg className="w-5 h-5 text-rose-500 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={spec.icon}></path>
                                            </svg>
                                            <span className="text-sm font-black text-slate-800 dark:text-white leading-none">{spec.val ?? 0}</span>
                                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1 tracking-wider">{spec.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Description */}
                                {prop.description && (
                                    <div className="space-y-2 pt-2">
                                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Descripción del Inmueble</h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
                                            {prop.description}
                                        </p>
                                    </div>
                                )}

                                {/* Admin Observations */}
                                {prop.observations && (
                                    <div className="p-4 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100/40 dark:border-amber-900/20 rounded-2xl space-y-1">
                                        <h4 className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest">Observaciones del Administrador</h4>
                                        <p className="text-slate-600 dark:text-slate-400 text-xs font-medium leading-relaxed">
                                            {prop.observations}
                                        </p>
                                    </div>
                                )}

                            </div>
                        </div>

                    </div>

                    {/* Right Panel: Financial Card and Actions */}
                    <div className="space-y-6">

                        {/* Financial Information Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3">
                                Detalles de Renta
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Canon de Arrendamiento</span>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                        ${Number(prop.price).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                                        <span className="text-xs font-bold text-slate-400 tracking-normal ml-1">/ mes</span>
                                    </p>
                                </div>

                                <div className="space-y-2.5 text-xs font-semibold pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 uppercase tracking-wider text-[10px]">Administración</span>
                                        <span className="text-slate-700 dark:text-slate-200 font-bold">
                                            {prop.admin_included ? 'Incluida en el canon' : 'No incluida'}
                                        </span>
                                    </div>
                                    {!prop.admin_included && prop.admin_value && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Valor Administración</span>
                                            <span className="text-slate-700 dark:text-slate-200 font-bold">
                                                ${Number(prop.admin_value).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 uppercase tracking-wider text-[10px]">Administrador a cargo</span>
                                        <span className="text-slate-700 dark:text-slate-200 font-bold truncate max-w-[150px]">
                                            {prop.owner_name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                Acciones Rápidas
                            </h3>

                            <div className="flex flex-col gap-3">
                                <Link 
                                    href="/dashboard/tickets/nuevo" 
                                    className="w-full p-4 bg-slate-900 dark:bg-rose-600 hover:bg-slate-800 dark:hover:bg-rose-500 text-white rounded-2xl transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black uppercase tracking-wider">Reportar Daño</p>
                                            <p className="text-[9px] text-white/70 font-semibold mt-0.5">Crear un ticket de asistencia</p>
                                        </div>
                                    </div>
                                    <svg className="w-4 h-4 text-white/50 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
                                </Link>

                                <Link 
                                    href="/dashboard/inventarios" 
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-rose-600 dark:bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
                                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Ver Inventarios</p>
                                            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Revisar actas y firmas</p>
                                        </div>
                                    </div>
                                    <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
                                </Link>

                                {prop.google_maps_link && (
                                    <a 
                                        href={prop.google_maps_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Google Maps</p>
                                                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Ver ubicación en mapa</p>
                                            </div>
                                        </div>
                                        <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
                                    </a>
                                )}

                                {prop.has_active_closure_request ? (
                                    <div className="w-full p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-amber-600/10 flex items-center justify-center text-amber-600">
                                                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-black uppercase tracking-wider">Cancelación en Trámite</p>
                                                <p className="text-[9px] text-amber-500/70 font-semibold mt-0.5">
                                                    {prop.active_closure_ticket_id ? `Ticket #TK-${prop.active_closure_ticket_id.toString().padStart(5, '0')} abierto para inventario final` : 'Procesando entrega...'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        disabled={cancelingLease}
                                        onClick={() => openCancelModal(prop)}
                                        className="w-full p-4 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-200/50 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-rose-600 dark:bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
                                                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-black uppercase tracking-wider">Solicitar Inventario Final</p>
                                                <p className="text-[9px] text-rose-500/70 font-semibold mt-0.5">{cancelingLease ? 'Solicitando...' : 'Solicitar revisión y entrega del inmueble'}</p>
                                            </div>
                                        </div>
                                        <svg className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
                                    </button>
                                )}

                            </div>
                        </div>

                    </div>

                </div>

            </div>

            {/* Modal de confirmación personalizado para cancelación */}
                {showCancelModal && propertyToCancel && mounted && createPortal(
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center border transition-colors ${
                                cancelError
                                    ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-100 dark:border-amber-900/40"
                                    : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-100 dark:border-rose-900/40"
                            }`}>
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight">Solicitar Inventario Final</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    ¿Está seguro de que desea solicitar el inventario final para la propiedad <span className="font-bold text-slate-800 dark:text-slate-200">{propertyToCancel.code}</span> ({propertyToCancel.address.split(',')[0]})? Se creará una solicitud de entrega y revisión final.
                                </p>
                            </div>

                            {cancelError && (
                                <div className="w-full p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/20 rounded-2xl text-left">
                                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Aviso</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 font-medium">{cancelError}</p>
                                </div>
                            )}

                            <div className="w-full flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        setPropertyToCancel(null);
                                        setCancelError(null);
                                    }}
                                    className="flex-1 py-3.5 bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    No, mantener
                                </button>
                                <button
                                    type="button"
                                    disabled={cancelingLease}
                                    onClick={() => handleCancelarArrendamiento(propertyToCancel)}
                                    className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-rose-600/10 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {cancelingLease ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Solicitando...
                                        </>
                                    ) : (
                                        'Sí, solicitar'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </>
        );
    }

    // --- ADMINISTRATIVE (STAFF/ADMIN) VIEW ---
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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Mostrar desactivados
                            </span>
                            <button
                                type="button"
                                onClick={() => setIncludeInactive(!includeInactive)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    includeInactive ? 'bg-rose-600' : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        includeInactive ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>
                        <button className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 hover:text-rose-600 transition-colors shadow-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid */}
            {filteredInmuebles.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 font-medium">
                    No se encontraron inmuebles registrados
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredInmuebles.map((inv) => {
                        const status = statusTags[inv.status] || { label: inv.status, color: 'text-slate-500', bg: 'bg-slate-100' };
                        return (
                            <div key={inv.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col gap-5">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center text-white overflow-hidden relative shadow-lg shadow-blue-600/20 shrink-0">
                                            {inv.cover_image ? (
                                                <img src={getImageUrl(inv.cover_image)} alt={inv.owner_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter line-clamp-1">{inv.owner_name}</h3>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{inv.code} • {inv.type_display}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <span className={`px-2.5 py-1 ${status.bg} ${status.color} rounded-lg text-[10px] font-black uppercase tracking-tight`}>
                                            {status.label}
                                        </span>
                                        {inv.is_active === false && (
                                            <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30 rounded-lg text-[10px] font-black uppercase tracking-tight">
                                                Desactivado
                                            </span>
                                        )}
                                    </div>
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
                                    <Link 
                                        href={`/dashboard/inmuebles/${inv.id}`} 
                                        className={`${inv.active_tenant && inv.status === 'RENTED' ? 'col-span-2' : 'col-span-4'} py-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white text-[11px] font-black uppercase tracking-widest text-center rounded-xl hover:bg-slate-100 transition-colors`}
                                    >
                                        Ver detalle
                                    </Link>
                                    {inv.active_tenant && inv.status === 'RENTED' && (
                                        <Link href={`/dashboard/inventarios/nuevo?property=${inv.id}`} className="col-span-2 py-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white text-[11px] font-black uppercase tracking-widest text-center rounded-xl hover:bg-slate-100 transition-colors">
                                            Inventario
                                        </Link>
                                    )}
                                    <button className="col-span-1 p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:text-rose-600 transition-colors">
                                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
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
