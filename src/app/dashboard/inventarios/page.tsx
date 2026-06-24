'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

interface Inventario {
    id: number;
    inventory_type: string;
    inventory_type_display: string;
    property: {
        address: string;
        code: string;
    };
    created_at: string;
    delivery_date: string;
    tenant: {
        first_name: string;
        last_name: string;
    };
    status: string;
    status_display: string;
    spaces_count: number;
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

export default function InventariosPage() {
    const [inventarios, setInventarios] = useState<Inventario[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [showObsModal, setShowObsModal] = useState(false);
    const [selectedInvId, setSelectedInvId] = useState<number | null>(null);
    const [obsText, setObsText] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Custom notification states replacing alerts & confirms
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'confirm_sign';
        title: string;
        message: string;
        onConfirm?: () => void;
    } | null>(null);

    // View detail modal states
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailInventory, setDetailInventory] = useState<any | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('es-ES');
    };

    const fetchInventarios = async (page = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/v1/inventarios/?page=${page}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setInventarios(data);
                    setTotalPages(1);
                } else {
                    setInventarios(data.results || []);
                    const count = data.count || 0;
                    setTotalPages(Math.ceil(count / 10) || 1);
                }
                setCurrentPage(page);
            }
        } catch (error) {
            console.error("Error fetching inventarios:", error);
        } finally {
            setLoading(false);
        }
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
        }
        fetchInventarios(1);
    }, []);

    const handleDownloadPDF = async (inventoryId: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/v1/inventarios/${inventoryId}/pdf/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `inventario-${inventoryId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                const errData = await res.json().catch(() => null);
                setNotification({
                    type: 'error',
                    title: 'Error al generar PDF',
                    message: errData?.message || 'Error al generar el PDF del inventario.'
                });
            }
        } catch (error) {
            console.error("Error downloading PDF:", error);
            setNotification({
                type: 'error',
                title: 'Error de Descarga',
                message: 'Error de red al intentar descargar el PDF.'
            });
        }
    };

    const executeSignInventory = async (inventoryId: number) => {
        setNotification(null);
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/v1/inventarios/${inventoryId}/sign/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setNotification({
                    type: 'success',
                    title: 'Firma Exitosa',
                    message: 'Inventario firmado digitalmente con éxito.'
                });
                fetchInventarios(currentPage);
            } else {
                const errData = await res.json().catch(() => null);
                setNotification({
                    type: 'error',
                    title: 'Error de Firma',
                    message: errData?.message || 'Error al firmar el inventario.'
                });
            }
        } catch (error) {
            console.error("Error signing inventory:", error);
            setNotification({
                type: 'error',
                title: 'Error de Conexión',
                message: 'No se pudo conectar con el servidor.'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSignInventory = (inventoryId: number) => {
        setNotification({
            type: 'confirm_sign',
            title: 'Firmar Inventario',
            message: '¿Estás seguro de que deseas firmar digitalmente este inventario aceptando el estado del inmueble?',
            onConfirm: () => executeSignInventory(inventoryId)
        });
    };

    const executeApproveInventory = async (inventoryId: number) => {
        setNotification(null);
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/v1/inventarios/${inventoryId}/approve/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setNotification({
                    type: 'success',
                    title: 'Aprobación Exitosa',
                    message: 'Inventario final aprobado con éxito. La propiedad ha sido liberada y el contrato finalizado.'
                });
                fetchInventarios(currentPage);
            } else {
                const errData = await res.json().catch(() => null);
                setNotification({
                    type: 'error',
                    title: 'Error de Aprobación',
                    message: errData?.message || 'Error al aprobar el inventario.'
                });
            }
        } catch (error) {
            console.error("Error approving inventory:", error);
            setNotification({
                type: 'error',
                title: 'Error de Conexión',
                message: 'No se pudo conectar con el servidor.'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleApproveInventory = (inventoryId: number) => {
        setNotification({
            type: 'confirm_sign',
            title: 'Aprobar Inventario Final',
            message: '¿Estás seguro de que deseas aprobar este inventario final? Esta acción finalizará el contrato de arrendamiento, liberará la propiedad y cerrará el ticket de cierre.',
            onConfirm: () => executeApproveInventory(inventoryId)
        });
    };

    const handleSaveObservations = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvId || !obsText.trim()) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/v1/inventarios/${selectedInvId}/observations/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ observation_text: obsText.trim() })
            });

            if (res.ok) {
                setShowObsModal(false);
                setObsText('');
                setSelectedInvId(null);
                setNotification({
                    type: 'success',
                    title: 'Reporte Enviado',
                    message: 'Observaciones registradas con éxito.'
                });
                fetchInventarios(currentPage);
            } else {
                const errData = await res.json().catch(() => null);
                setNotification({
                    type: 'error',
                    title: 'Error al Guardar',
                    message: errData?.message || 'Error al guardar observaciones.'
                });
            }
        } catch (error) {
            console.error("Error registering observations:", error);
            setNotification({
                type: 'error',
                title: 'Error de Conexión',
                message: 'No se pudo conectar con el servidor.'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewDetail = async (inventoryId: number) => {
        setDetailLoading(true);
        setDetailInventory(null);
        setShowDetailModal(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/v1/inventarios/${inventoryId}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDetailInventory(data);
            } else {
                setShowDetailModal(false);
                const errData = await res.json().catch(() => null);
                setNotification({
                    type: 'error',
                    title: 'Error',
                    message: errData?.message || 'No se pudieron cargar los detalles del inventario.'
                });
            }
        } catch (error) {
            console.error("Error fetching inventory detail:", error);
            setShowDetailModal(false);
            setNotification({
                type: 'error',
                title: 'Error de Conexión',
                message: 'No se pudo conectar con el servidor.'
            });
        } finally {
            setDetailLoading(false);
        }
    };

    const filteredInventarios = inventarios.filter(inv => {
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            return (
                inv.property.address.toLowerCase().includes(query) ||
                inv.property.code.toLowerCase().includes(query) ||
                `${inv.tenant.first_name} ${inv.tenant.last_name}`.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const isTenant = userRole === 'TENANT';

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-16">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                        {isTenant ? 'Mis Inventarios' : 'Inventarios de Inmuebles'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        {isTenant ? 'Revisa y firma las actas de estado de tu propiedad rentada.' : 'Control y seguimiento del estado físico de las propiedades.'}
                    </p>
                </div>
                {!isTenant && (
                    <Link
                        href="/dashboard/inventarios/nuevo"
                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 uppercase tracking-widest"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                        Realizar Inventario
                    </Link>
                )}
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input 
                        type="text" 
                        placeholder="Buscar por propiedad o arrendatario..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none text-xs font-medium border border-transparent focus:border-slate-200/60 dark:focus:border-slate-700 transition-all text-slate-700 dark:text-white" 
                    />
                </div>
                <div className="flex justify-end items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Total: {filteredInventarios.length} registros
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inmueble</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha de Registro</th>
                                {!isTenant && <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arrendatario</th>}
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                [1, 2].map(i => (
                                    <tr key={i} className="animate-pulse h-16 bg-slate-50/30 dark:bg-slate-800/20">
                                        <td colSpan={isTenant ? 5 : 6}></td>
                                    </tr>
                                ))
                            ) : filteredInventarios.length === 0 ? (
                                <tr>
                                    <td colSpan={isTenant ? 5 : 6} className="px-8 py-12 text-center text-slate-400 font-medium">
                                        {isTenant ? "Aún no hay inventario registrado para este inmueble." : "No hay inventarios registrados."}
                                    </td>
                                </tr>
                            ) : filteredInventarios.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{inv.property?.address}</p>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Código: {inv.property?.code}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                                        {inv.inventory_type_display}
                                    </td>
                                    <td className="px-8 py-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                                        {formatDate(inv.delivery_date)}
                                    </td>
                                    {!isTenant && (
                                        <td className="px-8 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                                            {inv.tenant?.first_name} {inv.tenant?.last_name}
                                        </td>
                                    )}
                                    <td className="px-8 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                                            inv.status === 'ACCEPTED' || inv.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30' : 
                                            inv.status === 'PENDING_SIGNATURE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30' :
                                            inv.status === 'PENDING_APPROVAL' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30' :
                                            inv.status === 'OBSERVATIONS_PENDING' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/30' :
                                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                        }`}>
                                            {inv.status_display}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex justify-end gap-2.5 items-center">
                                            {!isTenant && (
                                                (inv.inventory_type === 'INITIAL' && ['IN_PROGRESS', 'PENDING_SIGNATURE', 'OBSERVATIONS_PENDING'].includes(inv.status)) ||
                                                (inv.inventory_type === 'FINAL' && inv.status === 'IN_PROGRESS')
                                            ) && (
                                                <Link 
                                                    href={`/dashboard/inventarios/nuevo?id=${inv.id}`}
                                                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all shadow-sm shadow-rose-600/10 active:scale-95"
                                                >
                                                    Editar
                                                </Link>
                                            )}
                                            {!isTenant && inv.inventory_type === 'FINAL' && inv.status === 'PENDING_APPROVAL' && (
                                                <button 
                                                    onClick={() => handleApproveInventory(inv.id)}
                                                    disabled={actionLoading}
                                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all shadow-sm shadow-emerald-600/10 active:scale-95"
                                                >
                                                    Aprobar
                                                </button>
                                            )}
                                            {isTenant && inv.status === 'PENDING_SIGNATURE' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleSignInventory(inv.id)}
                                                        disabled={actionLoading}
                                                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all shadow-sm shadow-emerald-600/10 active:scale-95"
                                                    >
                                                        Firmar
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedInvId(inv.id);
                                                            setShowObsModal(true);
                                                        }}
                                                        disabled={actionLoading}
                                                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all shadow-sm active:scale-95"
                                                    >
                                                        Observar
                                                    </button>
                                                </>
                                            )}
                                            <button 
                                                onClick={() => handleViewDetail(inv.id)}
                                                title="Ver Detalle"
                                                className="p-2 text-slate-400 hover:text-rose-600 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800 rounded-lg"
                                            >
                                                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            {inv.spaces_count > 0 && (
                                                <button 
                                                    onClick={() => handleDownloadPDF(inv.id)}
                                                    title="Descargar PDF"
                                                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800 rounded-lg"
                                                >
                                                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Página {currentPage} de {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchInventarios(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => fetchInventarios(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Observations Modal */}
            {showObsModal && mounted && createPortal(
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Registrar Observaciones</h3>
                            <button 
                                onClick={() => {
                                    setShowObsModal(false);
                                    setObsText('');
                                    setSelectedInvId(null);
                                }}
                                className="text-slate-400 hover:text-rose-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSaveObservations} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detalle de observaciones</label>
                                <textarea
                                    required
                                    placeholder="Describe detalladamente los desacuerdos o comentarios sobre el estado registrado en el inventario..."
                                    rows={5}
                                    value={obsText}
                                    onChange={(e) => setObsText(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-xs font-medium focus:ring-2 focus:ring-rose-500/20 text-slate-700 dark:text-white resize-none"
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setShowObsModal(false);
                                        setObsText('');
                                        setSelectedInvId(null);
                                    }}
                                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={actionLoading || !obsText.trim()}
                                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-rose-600/10 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Guardando...' : 'Enviar Reporte'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Custom Notification Modal (Alert / Confirm) */}
            {notification && mounted && createPortal(
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${
                            notification.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40' :
                            notification.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40' :
                            'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40'
                        }`}>
                            {notification.type === 'success' ? (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                            ) : notification.type === 'error' ? (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            ) : (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight">{notification.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{notification.message}</p>
                        </div>
                        <div className="w-full flex gap-3">
                            {notification.type === 'confirm_sign' ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setNotification(null)}
                                        className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (notification.onConfirm) notification.onConfirm();
                                        }}
                                        className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-600/10"
                                    >
                                        Firmar
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setNotification(null)}
                                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors shadow-md"
                                >
                                    Aceptar
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Custom Detail Inventory Modal */}
            {showDetailModal && mounted && createPortal(
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
                            <div>
                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Detalle de Inventario</span>
                                <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tight mt-0.5">
                                    {detailInventory?.property?.address || 'Cargando...'}
                                </h3>
                            </div>
                            <button 
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setDetailInventory(null);
                                }}
                                className="p-2 text-slate-400 hover:text-rose-600 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800 rounded-xl"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {detailLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                                    <svg className="animate-spin h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p className="text-slate-400 font-medium text-xs">Cargando espacios del inventario...</p>
                                </div>
                            ) : detailInventory ? (
                                <div className="space-y-6">
                                    {/* Inventory Header Specs */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Código</p>
                                            <p className="text-xs font-black text-slate-800 dark:text-white uppercase mt-0.5">{detailInventory.property?.code}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tipo</p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{detailInventory.inventory_type_display}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fecha Entrega</p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{formatDate(detailInventory.delivery_date)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estado</p>
                                            <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5">{detailInventory.status_display}</p>
                                        </div>
                                    </div>

                                    {/* Spaces List */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                                            Estado de los Espacios ({detailInventory.spaces?.length || 0})
                                        </h4>
                                        {(!detailInventory.spaces || detailInventory.spaces.length === 0) ? (
                                            <p className="text-slate-400 text-center text-xs py-4">Este inventario no tiene espacios registrados.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {detailInventory.spaces.map((space: any, idx: number) => (
                                                    <div key={idx} className="p-5 border border-slate-200/70 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <h5 className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                                                                {space.space_name} {space.quantity > 1 ? `(Cantidad: ${space.quantity})` : ''}
                                                            </h5>
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                                                space.condition === 'GOOD' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' :
                                                                space.condition === 'REGULAR' ? 'bg-amber-50 text-amber-600 border border-amber-100/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' :
                                                                'bg-rose-50 text-rose-600 border border-rose-100/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
                                                            }`}>
                                                                {space.condition_display}
                                                            </span>
                                                        </div>

                                                        {space.observations && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100/40 dark:border-slate-800/40">
                                                                <span className="font-bold text-slate-700 dark:text-slate-300">Observaciones:</span> {space.observations}
                                                            </p>
                                                        )}

                                                        {/* Space Photos */}
                                                        {space.photos && space.photos.length > 0 && (
                                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                                                                {space.photos.map((photo: any, pIdx: number) => {
                                                                    const imageUrl = photo.image_url ? (photo.image_url.startsWith('http') ? photo.image_url : `${API_URL}${photo.image_url}`) : '';
                                                                    return (
                                                                        <a 
                                                                            key={pIdx} 
                                                                            href={imageUrl} 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer"
                                                                            className="relative group h-20 rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-800 hover:scale-[1.03] transition-transform shadow-sm bg-slate-100"
                                                                        >
                                                                            <img src={imageUrl} alt={photo.description || 'Foto del espacio'} className="w-full h-full object-cover" />
                                                                            {photo.description && (
                                                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                                                                                    <span className="text-[8px] text-white font-medium line-clamp-2 leading-tight">{photo.description}</span>
                                                                                </div>
                                                                            )}
                                                                        </a>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-center text-xs py-4">No se pudo cargar la información del inventario.</p>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-900/50">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setDetailInventory(null);
                                }}
                                className="px-6 py-2.5 bg-slate-900 dark:bg-rose-600 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
