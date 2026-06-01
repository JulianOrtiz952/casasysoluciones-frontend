'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Ticket {
    id: number;
    public_code: string;
    title: string;
    description: string;
    damage_type: string;
    damage_type_display: string;
    damage_type_other: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    priority_display: string;
    status: 'DRAFT' | 'OPEN' | 'ACCEPTED' | 'IN_PROGRESS' | 'REJECTED' | 'CLOSED';
    status_display: string;
    created_at: string;
    updated_at: string;
    rejection_reason?: string;
    assigned_contractor_name?: string;
    attachments: Array<{
        id: number;
        image_url: string;
        uploaded_at: string;
    }>;
}

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reportingProblem, setReportingProblem] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Roles and Admin update fields
    const [userRole, setUserRole] = useState<string>('');
    const [adminStatus, setAdminStatus] = useState<string>('OPEN');
    const [adminContractor, setAdminContractor] = useState<string>('');

    const fetchTicketDetails = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/v1/tickets/${params.id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTicket(data);
                setAdminStatus(data.status);
                setAdminContractor(data.assigned_contractor_name || '');
            } else {
                setError('No se pudo encontrar el ticket especificado.');
            }
        } catch (err) {
            console.error('Error fetching ticket details:', err);
            setError('Error de comunicación con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Decode token to get user role
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const decoded = JSON.parse(jsonPayload);
                const role = decoded.role || decoded.rol;
                if (role) {
                    setUserRole(role);
                }
            } catch (e) {
                console.error('Error decoding token:', e);
            }
        }

        if (params.id) {
            fetchTicketDetails();
        }
    }, [params.id]);

    const handleConfirmRepair = async () => {
        setActionLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/v1/tickets/${params.id}/confirm/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const updated = await res.json();
                setTicket(updated);
                setAdminStatus(updated.status);
                setAdminContractor(updated.assigned_contractor_name || '');
                alert('Reparación confirmada con éxito. El ticket ha sido cerrado.');
            } else {
                alert('Ocurrió un error al confirmar la reparación.');
            }
        } catch (err) {
            console.error('Error confirming repair:', err);
            alert('Error de conexión con el servidor.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReportProblem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectionReason.trim()) {
            alert('Por favor describe el inconveniente antes de enviar.');
            return;
        }

        setActionLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/v1/tickets/${params.id}/report-problem/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason: rejectionReason.trim() })
            });
            if (res.ok) {
                const updated = await res.json();
                setTicket(updated);
                setAdminStatus(updated.status);
                setAdminContractor(updated.assigned_contractor_name || '');
                setReportingProblem(false);
                setRejectionReason('');
                alert('Reporte de inconveniente enviado. El ticket ha sido actualizado.');
            } else {
                alert('Ocurrió un error al enviar el reporte.');
            }
        } catch (err) {
            console.error('Error reporting problem:', err);
            alert('Error de conexión.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAdminUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/v1/tickets/${params.id}/update-status/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: adminStatus,
                    assigned_contractor_name: adminContractor
                })
            });
            if (res.ok) {
                const updated = await res.json();
                setTicket(updated);
                setAdminStatus(updated.status);
                setAdminContractor(updated.assigned_contractor_name || '');
                alert('El ticket ha sido actualizado exitosamente.');
            } else {
                const errData = await res.json();
                alert(errData.error || 'Ocurrió un error al actualizar el ticket.');
            }
        } catch (err) {
            console.error('Error updating ticket:', err);
            alert('Error de conexión.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400 font-medium animate-pulse">
                Cargando detalles del ticket...
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 p-6 rounded-3xl text-center max-w-xl mx-auto space-y-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <p className="font-bold">{error || 'El ticket no está disponible.'}</p>
                <Link href="/dashboard/tickets" className="inline-block px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:bg-rose-500 transition-all">
                    Volver a tickets
                </Link>
            </div>
        );
    }

    // Dynamic color classes based on status
    const statusBadges = {
        DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        OPEN: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30',
        ACCEPTED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30',
        IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30',
        REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30',
        CLOSED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30',
    };

    const priorityBadges = {
        LOW: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400',
        MEDIUM: 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400',
        HIGH: 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400',
    };

    // Timeline calculations
    const getTimeline = () => {
        const list = [
            {
                title: 'Abierto',
                date: new Date(ticket.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                desc: 'Ticket creado por el inquilino.',
                done: true,
            }
        ];

        if (ticket.status !== 'DRAFT' && ticket.status !== 'OPEN') {
            list.push({
                title: 'En proceso',
                date: new Date(ticket.updated_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                desc: 'Soporte técnico asignado. Reparación en curso.',
                done: true,
            });
        }

        if (ticket.status === 'CLOSED') {
            list.push({
                title: 'Cerrado',
                date: ticket.updated_at ? new Date(ticket.updated_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
                desc: 'El inquilino ha confirmado que la reparación fue satisfactoria.',
                done: true,
            });
        }

        return list;
    };

    const timelineSteps = getTimeline();

    // Messages calculations
    const getMessages = () => {
        const msgs = [
            {
                sender: 'Admin',
                date: new Date(ticket.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                text: 'Hola, hemos recibido tu reporte. Estaremos revisándolo para programar una inspección técnica.',
                isAdmin: true
            }
        ];

        if (ticket.status === 'IN_PROGRESS' || ticket.status === 'ACCEPTED') {
            msgs.push({
                sender: 'Soporte',
                date: new Date(ticket.updated_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                text: 'Hemos asignado un técnico y la visita está programada. Una vez completado, confírmanos la solución.',
                isAdmin: true
            });
        }

        if (ticket.rejection_reason) {
            msgs.push({
                sender: 'Inquilino (Reporte de problema)',
                date: new Date(ticket.updated_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                text: ticket.rejection_reason,
                isAdmin: false
            });
        }

        return msgs;
    };

    const messages = getMessages();

    const isStaff = userRole === 'ADMIN' || userRole === 'ASSISTANT';

    // Check if confirming action is available for tenant
    const showActionRequired = (ticket.status === 'IN_PROGRESS' || ticket.status === 'ACCEPTED') && userRole === 'TENANT';

    const getFullImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        return `${API_URL}${path}`;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <nav className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Link href="/dashboard/tickets" className="hover:text-rose-600 transition-colors">Tickets</Link>
                        <span>&gt;</span>
                        <span className="text-slate-600 dark:text-slate-300">Detalle</span>
                    </nav>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                            Ticket #{ticket.public_code || ticket.id.toString().padStart(5, '0')}
                        </h1>
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-tight rounded-xl ${statusBadges[ticket.status]}`}>
                            {ticket.status_display}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                    </svg>
                    Imprimir
                </button>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Main Left Columns */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Problem Description Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-start gap-4">
                        <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                {ticket.title}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
                                {ticket.description}
                            </p>
                        </div>
                    </div>

                    {/* Evidences Section */}
                    {ticket.attachments && ticket.attachments.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                </svg>
                                Evidencias
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {ticket.attachments.map((att) => (
                                    <div
                                        key={att.id}
                                        onClick={() => setLightboxImage(getFullImageUrl(att.image_url))}
                                        className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-32 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group shadow-sm"
                                    >
                                        <img
                                            src={getFullImageUrl(att.image_url)}
                                            alt="Evidencia"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Progress Timeline */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                            Progreso
                        </h3>
                        <div className="relative pl-6 space-y-8 border-l border-slate-200 dark:border-slate-800">
                            {timelineSteps.map((step, idx) => (
                                <div key={idx} className="relative">
                                    {/* Circle dot on line */}
                                    <span className="absolute -left-[31px] top-0.5 w-4.5 h-4.5 bg-rose-500 border-4 border-white dark:border-slate-900 rounded-full flex items-center justify-center shrink-0 shadow-sm" />
                                    
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-baseline gap-2.5">
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                {step.title}
                                            </h4>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                                                {step.date}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Messages Comments section */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                            Mensajes
                        </h3>
                        
                        <div className="space-y-4">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-2xl flex flex-col gap-1 text-xs ${
                                        msg.isAdmin
                                            ? 'bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60'
                                            : 'bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100/30 dark:border-rose-950/20'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                            {msg.sender}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold">{msg.date}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed mt-1">
                                        {msg.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Sidebar Columns */}
                <div className="space-y-6">
                    
                    {/* Details Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3">
                            Detalles
                        </h3>
                        <div className="space-y-3.5 text-xs font-semibold">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 uppercase tracking-wider text-[10px]">Estado</span>
                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg ${statusBadges[ticket.status]}`}>
                                    {ticket.status_display}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 uppercase tracking-wider text-[10px]">Prioridad</span>
                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg ${priorityBadges[ticket.priority]}`}>
                                    {ticket.priority_display}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 uppercase tracking-wider text-[10px]">Tipo</span>
                                <span className="text-slate-700 dark:text-slate-200 font-bold uppercase tracking-tight">
                                    {ticket.damage_type === 'OTHER' ? ticket.damage_type_other : ticket.damage_type_display}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 uppercase tracking-wider text-[10px]">Fecha de reporte</span>
                                <span className="text-slate-700 dark:text-slate-200 font-bold">
                                    {new Date(ticket.created_at).toLocaleDateString('es-ES')}
                                </span>
                            </div>
                            {ticket.assigned_contractor_name && (
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 uppercase tracking-wider text-[10px]">Contratista</span>
                                    <span className="text-slate-700 dark:text-slate-200 font-bold">
                                        {ticket.assigned_contractor_name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Required Card */}
                    {showActionRequired && (
                        <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                                <div className="w-9 h-9 bg-rose-100 dark:bg-rose-900/40 rounded-xl flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest">
                                    Acción Requerida
                                </h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                Una vez finalizada la reparación, por favor confirma si el resultado fue satisfactorio.
                            </p>

                            {!reportingProblem ? (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                                        ¿La reparación fue satisfactoria?
                                    </p>
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={handleConfirmRepair}
                                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                        Confirmar
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() => setReportingProblem(true)}
                                        className="w-full py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                        </svg>
                                        Reportar problema
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleReportProblem} className="space-y-3.5 pt-2 border-t border-rose-100 dark:border-rose-950/20">
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                            Describe el inconveniente *
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Detalla qué falló o sigue roto..."
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setReportingProblem(false)}
                                            className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={actionLoading}
                                            className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-rose-600/10 cursor-pointer"
                                        >
                                            Enviar
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {isStaff && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-3 text-slate-800 dark:text-white">
                                <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest">
                                    Gestión del Ticket
                                </h3>
                            </div>
                            
                            <form onSubmit={handleAdminUpdate} className="space-y-4 pt-2">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                        Estado del Ticket *
                                    </label>
                                    <select
                                        value={adminStatus}
                                        onChange={(e) => setAdminStatus(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-rose-500 transition-all text-slate-800 dark:text-white"
                                    >
                                        <option value="DRAFT">Borrador</option>
                                        <option value="OPEN">Abierto</option>
                                        <option value="ACCEPTED">Aceptado</option>
                                        <option value="IN_PROGRESS">En proceso</option>
                                        <option value="REJECTED">Rechazado</option>
                                        <option value="CLOSED">Cerrado</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                        Contratista Asignado
                                    </label>
                                    <input
                                        type="text"
                                        value={adminContractor}
                                        onChange={(e) => setAdminContractor(e.target.value)}
                                        placeholder="Ej. Juan Pérez (Plomero)"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-rose-500 transition-all text-slate-800 dark:text-white"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-rose-600/10 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {actionLoading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </form>
                        </div>
                    )}

                </div>

            </div>

            {/* Lightbox / Modal for enlarged evidence images */}
            {lightboxImage && (
                <div
                    onClick={() => setLightboxImage(null)}
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300 cursor-zoom-out"
                >
                    <div className="max-w-4xl max-h-[85vh] relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center">
                        <img
                            src={lightboxImage}
                            alt="Lightbox"
                            className="max-w-full max-h-[85vh] object-contain select-none"
                        />
                        <button
                            onClick={() => setLightboxImage(null)}
                            className="absolute top-4 right-4 p-2 bg-slate-950/60 hover:bg-slate-950 text-white rounded-xl transition-colors border border-white/10"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
