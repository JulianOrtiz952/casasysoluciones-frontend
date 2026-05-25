'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Property {
    id: number;
    code: string;
    address: string;
    city: string;
    type_display: string;
}

interface Tenant {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Space {
    space_name: string;
    condition: 'GOOD' | 'REGULAR' | 'BAD';
    observations: string;
    items: {
        name: string;
        checked: boolean;
    }[];
}

export default function NuevoInventarioPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [inventoryId, setInventoryId] = useState<number | null>(null);

    // Data for Step 1
    const [properties, setProperties] = useState<Property[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [formData, setFormData] = useState({
        property_id: '',
        tenant_id: '',
        delivery_date: new Date().toISOString().split('T')[0],
        observations: '',
        inventory_type: 'INITIAL'
    });

    // Data for Step 2
    const defaultItems = [
        { name: 'Paredes y pintura', checked: true },
        { name: 'Pisos y zócalos', checked: true },
        { name: 'Puertas y cerraduras', checked: false },
        { name: 'Ventanas y persianas', checked: false },
        { name: 'Iluminación', checked: true }
    ];

    const [spaces, setSpaces] = useState<Space[]>([
        { space_name: 'Sala / Comedor', condition: 'GOOD', observations: '', items: [...defaultItems] },
        { space_name: 'Cocina', condition: 'GOOD', observations: '', items: [...defaultItems] },
        { space_name: 'Habitación principal', condition: 'GOOD', observations: '', items: [...defaultItems] },
        { space_name: 'Baños', condition: 'GOOD', observations: '', items: [...defaultItems] }
    ]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            const [propRes, tenantRes] = await Promise.all([
                fetch(`${API_URL}/api/v1/properties/`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/v1/usuarios/`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (propRes.ok) {
                const data = await propRes.json();
                setProperties(Array.isArray(data) ? data : (data.results || []));
            }
            if (tenantRes.ok) {
                const data = await tenantRes.json();
                const allUsers = Array.isArray(data) ? data : (data.results || []);
                setTenants(allUsers.filter((u: any) => u.role === 'TENANT'));
            }
        } catch (error) {
            console.error("Error loading initial data:", error);
        }
    };

    const handleCreateInventory = async () => {
        setLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/v1/inventarios/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const data = await res.json();
                setInventoryId(data.id);
                setStep(2);
            } else {
                const err = await res.json();
                alert(err.message || "Error al crear el inventario. Verifica que el arrendatario esté asociado al inmueble.");
            }
        } catch (error) {
            console.error("Error creating inventory:", error);
            alert("Error de conexión.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSpaces = async () => {
        if (!inventoryId) return;
        setLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/v1/inventarios/${inventoryId}/step/2/spaces/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    spaces: spaces.map((s, idx) => ({
                        space_name: s.space_name,
                        condition: s.condition,
                        observations: s.observations,
                        order: idx
                    }))
                })
            });

            if (res.ok) {
                const data = await res.json();
                // Actualizar espacios con IDs del backend
                const updatedSpaces = spaces.map((s, idx) => ({
                    ...s,
                    id: data.spaces[idx].id,
                    photos: data.spaces[idx].photos || []
                }));
                // @ts-ignore
                setSpaces(updatedSpaces);
                setStep(3);
            }
        } catch (error) {
            console.error("Error saving spaces:", error);
        } finally {
            setLoading(false);
        }
    };

    const [activeSpaceIdx, setActiveSpaceIdx] = useState(0);

    const handleUploadPhoto = async (spaceId: number, file: File) => {
        setLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('image', file);

            const res = await fetch(`${API_URL}/api/v1/inventarios/${inventoryId}/spaces/${spaceId}/photos/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                const newPhoto = await res.json();
                const newSpaces = spaces.map(s => {
                    // @ts-ignore
                    if (s.id === spaceId) {
                        // @ts-ignore
                        return { ...s, photos: [...(s.photos || []), newPhoto] };
                    }
                    return s;
                });
                // @ts-ignore
                setSpaces(newSpaces);
            }
        } catch (error) {
            console.error("Error uploading photo:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePhoto = async (spaceId: number, photoId: number) => {
        setLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/v1/inventarios/${inventoryId}/spaces/${spaceId}/photos/${photoId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const newSpaces = spaces.map(s => {
                    // @ts-ignore
                    if (s.id === spaceId) {
                        // @ts-ignore
                        return { ...s, photos: s.photos.filter((p: any) => p.id !== photoId) };
                    }
                    return s;
                });
                // @ts-ignore
                setSpaces(newSpaces);
            }
        } catch (error) {
            console.error("Error deleting photo:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async () => {
        if (!inventoryId) return;
        setLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/v1/inventarios/${inventoryId}/finalize/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setStep(5);
            }
        } catch (error) {
            console.error("Error finalizing inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!inventoryId) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/v1/inventarios/${inventoryId}/pdf/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
            }
        } catch (error) {
            console.error("Error downloading PDF:", error);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header and Stepper */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {step === 1 && "Datos Generales"}
                        {step === 2 && "Espacios"}
                        {step === 3 && "Evidencias Fotográficas"}
                        {step === 4 && "Comparación"}
                        {step === 5 && "Documento Final"}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Completa los pasos para generar el reporte de inventario.</p>
                </div>
                
                {/* Stepper UI */}
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                step === s ? 'bg-rose-600 text-white scale-110 shadow-lg shadow-rose-600/20' : 
                                step > s ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}>
                                {step > s ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> : s}
                            </div>
                            {s < 5 && <div className={`w-6 h-0.5 mx-1 rounded-full ${step > s ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'}`} />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Content */}
                <div className="lg:col-span-2 space-y-6">
                    {step === 1 && (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Propiedad</label>
                                    <select 
                                        value={formData.property_id}
                                        onChange={(e) => setFormData({...formData, property_id: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-rose-500/20 transition-all dark:text-white"
                                    >
                                        <option value="">Seleccionar propiedad...</option>
                                        {properties.map(p => <option key={p.id} value={p.id}>{p.code} - {p.address}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arrendatario</label>
                                    <select 
                                        value={formData.tenant_id}
                                        onChange={(e) => setFormData({...formData, tenant_id: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-rose-500/20 transition-all dark:text-white"
                                    >
                                        <option value="">Seleccionar arrendatario...</option>
                                        {tenants.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">¿Es el inventario inicial?</label>
                                <div className="flex gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, inventory_type: 'INITIAL'})}
                                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border transition-all ${
                                            formData.inventory_type === 'INITIAL' 
                                                ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-500 text-rose-600' 
                                                : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        Sí, Inicial (Asociar inquilino)
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, inventory_type: 'FINAL'})}
                                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border transition-all ${
                                            formData.inventory_type === 'FINAL' 
                                                ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-500 text-rose-600' 
                                                : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        No, Final
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha de Registro</label>
                                <input 
                                    type="date" 
                                    value={formData.delivery_date}
                                    onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-rose-500/20 transition-all dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Observaciones Generales</label>
                                <textarea 
                                    placeholder="Detalles adicionales sobre el estado general..."
                                    value={formData.observations}
                                    onChange={(e) => setFormData({...formData, observations: e.target.value})}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-rose-500/20 transition-all dark:text-white resize-none"
                                />
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button 
                                    onClick={handleCreateInventory}
                                    disabled={loading || !formData.property_id || !formData.tenant_id}
                                    className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-rose-600/20 uppercase tracking-widest disabled:opacity-50 disabled:grayscale"
                                >
                                    {loading ? 'Iniciando...' : 'Siguiente paso'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            {spaces.map((s, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden group transition-all hover:border-slate-300 dark:hover:border-slate-700">
                                    <div className="p-6 flex items-center justify-between cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                            </div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">{s.space_name}</h3>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                                            s.condition === 'GOOD' ? 'bg-emerald-50 text-emerald-600' :
                                            s.condition === 'REGULAR' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                        }`}>
                                            {s.condition === 'GOOD' ? 'Bueno' : s.condition === 'REGULAR' ? 'Regular' : 'Deteriorado'}
                                        </span>
                                    </div>
                                    <div className="px-8 pb-8 space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado general</label>
                                            <div className="flex gap-4">
                                                {(['GOOD', 'REGULAR', 'BAD'] as const).map(c => (
                                                    <button 
                                                        key={c}
                                                        onClick={() => {
                                                            const newSpaces = [...spaces];
                                                            newSpaces[i].condition = c;
                                                            setSpaces(newSpaces);
                                                        }}
                                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                            s.condition === c ? 'bg-slate-900 text-white dark:bg-rose-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                                                        }`}
                                                    >
                                                        {c === 'GOOD' ? 'Bueno' : c === 'REGULAR' ? 'Regular' : 'Malo'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Elementos revisados</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {s.items.map((item, itemIdx) => (
                                                    <label key={itemIdx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={item.checked}
                                                            onChange={(e) => {
                                                                const newSpaces = [...spaces];
                                                                newSpaces[i].items[itemIdx].checked = e.target.checked;
                                                                setSpaces(newSpaces);
                                                            }}
                                                            className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                                        />
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4 pt-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Observaciones adicionales</label>
                                            <textarea 
                                                value={s.observations}
                                                onChange={(e) => {
                                                    const newSpaces = [...spaces];
                                                    newSpaces[i].observations = e.target.value;
                                                    setSpaces(newSpaces);
                                                }}
                                                placeholder="Añade cualquier detalle extra..."
                                                rows={3}
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none text-sm font-medium focus:ring-2 focus:ring-rose-500/20 transition-all dark:text-white resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-4 flex justify-between gap-4">
                                <button onClick={() => setStep(1)} className="px-6 py-3 border border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] font-black rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 uppercase tracking-widest transition-all flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                                    Anterior
                                </button>
                                <button 
                                    onClick={handleSaveSpaces}
                                    disabled={loading}
                                    className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black rounded-xl transition-all shadow-lg shadow-rose-600/20 uppercase tracking-widest disabled:opacity-50"
                                >
                                    {loading ? 'Guardando...' : 'Siguiente paso'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8">
                             {/* Selector de Ambiente para Fotos */}
                             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {spaces.map((s, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setActiveSpaceIdx(idx)}
                                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                            activeSpaceIdx === idx ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {s.space_name}
                                        {/* @ts-ignore */}
                                        <span className="ml-2 opacity-50">({s.photos?.length || 0})</span>
                                    </button>
                                ))}
                             </div>

                             <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-4 hover:border-rose-500/50 transition-colors group relative">
                                <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        // @ts-ignore
                                        if (spaces[activeSpaceIdx]?.id) {
                                            files.forEach(file => {
                                                // @ts-ignore
                                                handleUploadPhoto(spaces[activeSpaceIdx].id, file);
                                            });
                                        }
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mx-auto text-rose-600 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 20M7 14H22M9 5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Sube fotos de {spaces[activeSpaceIdx].space_name}</h3>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1">Haz clic o arrastra para subir evidencias</p>
                                </div>
                             </div>

                             {/* @ts-ignore */}
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {/* @ts-ignore */}
                                {spaces[activeSpaceIdx].photos?.map((photo: any) => (
                                    <div key={photo.id} className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden relative group border border-slate-200 dark:border-slate-800">
                                        <img src={photo.thumbnail_url || photo.image_url} alt={photo.description} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button 
                                                // @ts-ignore
                                                onClick={() => handleDeletePhoto(spaces[activeSpaceIdx].id, photo.id)}
                                                className="p-2 bg-rose-600 text-white rounded-lg hover:scale-110 transition-transform"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                             </div>

                             <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <button onClick={() => setStep(2)} className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                                    Volver
                                </button>
                                <button 
                                    onClick={() => setStep(4)} 
                                    className="px-8 py-3 bg-rose-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
                                >
                                    Siguiente paso
                                </button>
                             </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                            <div className="p-12 text-center space-y-4">
                                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Inventario Completo</h3>
                                <p className="text-slate-500 max-w-sm mx-auto text-sm font-medium leading-relaxed">
                                    Has completado el registro de ambientes y evidencias. Ya puedes revisar el documento preliminar y enviarlo para firma.
                                </p>
                                <button 
                                    onClick={handleFinalize}
                                    disabled={loading}
                                    className="px-10 py-3.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl uppercase tracking-widest shadow-xl shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Finalizando...' : 'Generar Reporte Final'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-10">
                            {/* Summary Document UI */}
                            <div className="space-y-8">
                                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-8">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Documento de Inventario</h2>
                                        <p className="text-xs font-bold text-slate-400 mt-1">Ref: INV-{inventoryId?.toString().padStart(4, '0')}</p>
                                    </div>
                                    <div className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest">Listo para firma</div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 text-xs">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="font-bold text-slate-400 uppercase tracking-widest mb-1 text-[10px]">Inmueble</p>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">
                                                {properties.find(p => p.id === Number(formData.property_id))?.address || '---'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-400 uppercase tracking-widest mb-1 text-[10px]">Arrendatario</p>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">
                                                {tenants.find(t => t.id === Number(formData.tenant_id))?.first_name} {tenants.find(t => t.id === Number(formData.tenant_id))?.last_name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="font-bold text-slate-400 uppercase tracking-widest mb-1 text-[10px]">Fecha</p>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">{formData.delivery_date}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-400 uppercase tracking-widest mb-1 text-[10px]">Tipo</p>
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest">Inicial</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-10 border-t border-slate-100 dark:border-slate-800">
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Resumen de Ambientes</h3>
                                    <div className="space-y-3">
                                        {spaces.map((s, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{s.space_name}</span>
                                                <div className="flex items-center gap-3">
                                                    {/* @ts-ignore */}
                                                    <span className="text-[10px] font-bold text-slate-400">{s.photos?.length || 0} fotos</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                        s.condition === 'GOOD' ? 'text-emerald-600' :
                                                        s.condition === 'REGULAR' ? 'text-amber-600' : 'text-rose-600'
                                                    }`}>
                                                        {s.condition === 'GOOD' ? 'Bueno' : s.condition === 'REGULAR' ? 'Regular' : 'Malo'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-16 grid grid-cols-2 gap-20">
                                    <div className="text-center space-y-12">
                                        <div className="h-0.5 bg-slate-200 dark:bg-slate-800" />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Firma Operativo Administrador</p>
                                            <p className="text-[9px] font-medium text-slate-400 uppercase mt-1">CASAS Y SOLUCIONES</p>
                                        </div>
                                    </div>
                                    <div className="text-center space-y-12">
                                        <div className="h-0.5 bg-slate-200 dark:bg-slate-800" />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Firma Arrendatario</p>
                                            <p className="text-[9px] font-medium text-slate-400 uppercase mt-1">{tenants.find(t => t.id === Number(formData.tenant_id))?.first_name} {tenants.find(t => t.id === Number(formData.tenant_id))?.last_name}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 flex justify-end gap-4">
                                <button 
                                    onClick={handleDownloadPDF}
                                    className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                    Descargar PDF
                                </button>
                                <button 
                                    onClick={() => router.push('/dashboard/inventarios')}
                                    className="px-10 py-3 bg-rose-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-xl shadow-rose-600/20 active:scale-95 transition-all"
                                >
                                    Finalizar y Salir
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Summary */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 sticky top-8">
                        <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Resumen del Inventario</h2>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Propiedad</p>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-40">
                                        {properties.find(p => p.id === Number(formData.property_id))?.address || '---'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Arrendatario</p>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {tenants.find(t => t.id === Number(formData.tenant_id))?.first_name || '---'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progreso</span>
                                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{Math.round((step / 5) * 100)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-600 transition-all duration-500" style={{ width: `${(step / 5) * 100}%` }} />
                            </div>
                            <p className="text-[9px] font-medium text-slate-400 text-center mt-2">{step} de 5 etapas completadas</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
