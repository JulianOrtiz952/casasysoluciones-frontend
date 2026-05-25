'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Property {
    id: number;
    code: string;
    address: string;
    city: string;
}

export default function NuevoTicketPage() {
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<string>('');
    const [damageType, setDamageType] = useState<string>('PLUMBING');
    const [damageTypeOther, setDamageTypeOther] = useState<string>('');
    const [priority, setPriority] = useState<string>('MEDIUM');
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingProperties, setFetchingProperties] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const damageTypes = [
        { id: 'PLUMBING', label: 'Plomería', icon: '💧', desc: 'Fugas, grifos, tuberías' },
        { id: 'ELECTRICITY', label: 'Electricidad', icon: '⚡', desc: 'Cortos, bombillos, enchufes' },
        { id: 'STRUCTURE', label: 'Estructural', icon: '🧱', desc: 'Paredes, techos, humedad' },
        { id: 'APPLIANCE', label: 'Electrodoméstico', icon: '🔌', desc: 'Estufa, nevera, calentador' },
        { id: 'OTHER', label: 'Otro', icon: '💬', desc: 'Cerrajería, pintura, otros' },
    ];

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/v1/properties/mine/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.results || []);
                    setProperties(list);
                    if (list.length > 0) {
                        setSelectedProperty(list[0].id.toString());
                    }
                } else {
                    setError('No se pudieron cargar tus inmuebles asociados.');
                }
            } catch (err) {
                console.error('Error fetching properties:', err);
                setError('Error al conectar con el servidor.');
            } finally {
                setFetchingProperties(false);
            }
        };

        fetchProperties();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            // Limit to 5 attachments max
            if (attachments.length + filesArray.length > 5) {
                alert('Puedes subir un máximo de 5 fotos.');
                return;
            }
            setAttachments(prev => [...prev, ...filesArray]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const submitTicket = async (isDraft: boolean) => {
        if (!selectedProperty) {
            setError('Debes seleccionar un inmueble afectado.');
            return;
        }
        if (!title.trim()) {
            setError('El título del problema es obligatorio.');
            return;
        }
        if (!description.trim()) {
            setError('La descripción detallada es obligatoria.');
            return;
        }
        if (damageType === 'OTHER' && !damageTypeOther.trim()) {
            setError('Por favor especifica el tipo de daño.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');

            // 1. Create the ticket
            const endpoint = isDraft ? `${API_URL}/api/v1/tickets/draft/` : `${API_URL}/api/v1/tickets/`;
            const payload = {
                property_id: parseInt(selectedProperty),
                title: title.trim(),
                description: description.trim(),
                damage_type: damageType,
                damage_type_other: damageType === 'OTHER' ? damageTypeOther.trim() : '',
                priority: priority,
            };

            const ticketRes = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!ticketRes.ok) {
                const errorData = await ticketRes.json();
                throw new Error(errorData.message || 'Error al guardar el ticket.');
            }

            const ticketData = await ticketRes.json();
            const ticketId = ticketData.id;

            // 2. Upload attachments if any
            if (attachments.length > 0) {
                for (const file of attachments) {
                    const formData = new FormData();
                    formData.append('image', file);

                    const uploadRes = await fetch(`${API_URL}/api/v1/tickets/${ticketId}/attachments/`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData,
                    });

                    if (!uploadRes.ok) {
                        console.error('Error uploading file:', file.name);
                    }
                }
            }

            // 3. Redirect to the detail view
            router.push(`/dashboard/tickets/${ticketId}`);
        } catch (err: any) {
            console.error('Error creating ticket:', err);
            setError(err.message || 'Ocurrió un error inesperado al guardar el ticket.');
            setLoading(false);
        }
    };

    if (fetchingProperties) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400 font-medium animate-pulse">
                Cargando formulario...
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
            {/* Breadcrumb & Title */}
            <div>
                <nav className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Link href="/dashboard/tickets" className="hover:text-rose-600 transition-colors">Tickets</Link>
                    <span>&gt;</span>
                    <span className="text-slate-600 dark:text-slate-300">Nuevo Ticket</span>
                </nav>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Reportar daño</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
                    Completa los detalles a continuación para que podamos ayudarte lo antes posible.
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Main Form container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
                {/* 1. Affected Property */}
                <div className="space-y-3">
                    <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                        Inmueble afectado
                    </label>
                    {properties.length === 0 ? (
                        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/40">
                            No tienes ningún inmueble activo registrado.
                        </p>
                    ) : (
                        <select
                            value={selectedProperty}
                            onChange={(e) => setSelectedProperty(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all text-slate-800 dark:text-white"
                        >
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.address} ({p.city})
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* 2. Damage Type Grid */}
                <div className="space-y-4">
                    <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest block">
                        Tipo de daño
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                        {damageTypes.map((type) => {
                            const isSelected = damageType === type.id;
                            return (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setDamageType(type.id)}
                                    className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-2.5 transition-all group hover:scale-[1.02] cursor-pointer ${
                                        isSelected
                                            ? 'border-rose-500 bg-rose-500/[0.04] dark:bg-rose-500/[0.08] text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20 dark:ring-rose-500/30'
                                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                                    }`}
                                >
                                    <span className={`text-2xl transition-transform duration-200 group-hover:scale-110 ${isSelected ? 'scale-110' : ''}`}>
                                        {type.icon}
                                    </span>
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-tight">{type.label}</p>
                                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-tight mt-0.5">{type.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Specifier for OTHER */}
                    {damageType === 'OTHER' && (
                        <div className="animate-in slide-in-from-top-2 duration-300 space-y-2 mt-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                                Especificar tipo de daño *
                            </label>
                            <input
                                type="text"
                                value={damageTypeOther}
                                onChange={(e) => setDamageTypeOther(e.target.value)}
                                placeholder="Ej: Cerrajería de puerta principal rota"
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all text-slate-800 dark:text-white"
                            />
                        </div>
                    )}
                </div>

                {/* 3. Priority Selection */}
                <div className="space-y-3">
                    <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest block">
                        Prioridad
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { id: 'LOW', label: 'Baja', color: 'bg-emerald-500', bgHover: 'hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', activeBg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400' },
                            { id: 'MEDIUM', label: 'Media', color: 'bg-amber-500', bgHover: 'hover:bg-amber-500/10 dark:hover:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', activeBg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-700 dark:text-amber-400' },
                            { id: 'HIGH', label: 'Alta', color: 'bg-rose-500', bgHover: 'hover:bg-rose-500/10 dark:hover:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-400', activeBg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-700 dark:text-rose-400' },
                        ].map((prio) => {
                            const isSelected = priority === prio.id;
                            return (
                                <button
                                    key={prio.id}
                                    type="button"
                                    onClick={() => setPriority(prio.id)}
                                    className={`px-5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                                        isSelected
                                            ? prio.activeBg + ' border ring-1 ring-' + prio.id.toLowerCase() + '-500/20 shadow-sm'
                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 ' + prio.bgHover
                                    }`}
                                >
                                    <span className={`w-2.5 h-2.5 rounded-full ${prio.color}`} />
                                    <span>{prio.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 4. Title Input */}
                <div className="space-y-3">
                    <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest block">
                        Título del problema
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: Fuga de agua en lavabo del baño principal"
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-semibold outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all text-slate-800 dark:text-white"
                    />
                </div>

                {/* 5. Description Input */}
                <div className="space-y-3">
                    <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest block">
                        Descripción detallada
                    </label>
                    <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe el problema, desde cuándo ocurre y cualquier otro detalle relevante..."
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all text-slate-800 dark:text-white"
                    />
                </div>

                {/* 6. Evidencia fotográfica */}
                <div className="space-y-4">
                    <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest block">
                        Evidencia fotográfica <span className="text-slate-400 font-normal">(Opcional, max 5 fotos)</span>
                    </label>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Image Uploader Card */}
                        {attachments.length < 5 && (
                            <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-rose-500 hover:bg-rose-500/[0.02] dark:hover:bg-rose-500/[0.04] transition-all rounded-2xl h-32 flex flex-col items-center justify-center gap-2 cursor-pointer text-slate-400 hover:text-rose-500">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Subir Foto</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                        )}

                        {/* Thumbnails of already attached photos */}
                        {attachments.map((file, idx) => (
                            <div key={idx} className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-32 group">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Adjunto ${idx + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(idx)}
                                        className="p-2 bg-rose-600 text-white rounded-xl hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/30 cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Actions Sticky bar */}
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-2 cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    Anterior
                </button>

                <div className="flex gap-3">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => submitTicket(true)}
                        className="px-6 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-55"
                    >
                        Guardar borrador
                    </button>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => submitTicket(false)}
                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-55"
                    >
                        {loading ? 'Creando...' : 'Siguiente paso'}
                        {!loading && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
