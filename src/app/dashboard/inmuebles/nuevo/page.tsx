'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NuevoInmueble() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState('');

    const showError = (msg: string) => {
        setErrorModalMessage(msg);
        setShowErrorModal(true);
    };

    // Multiples imágenes
    const [imagenes, setImagenes] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [portadaIndex, setPortadaIndex] = useState<number>(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        owner_name: '',
        price: '',
        address: '',
        description: '',
        type: 'APARTMENT',
        rooms: '',
        bathrooms: '',
        living_rooms: '',
        kitchens: '',
        garages: '',
        is_commercial: false,
        in_complex: false,
        admin_included: false,
        admin_value: '',
        google_maps_link: ''
    });

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const handleFiles = (files: File[]) => {
        const validFiles = files.filter(file => file.type.startsWith('image/'));
        if (validFiles.length === 0) return;

        setImagenes(prev => [...prev, ...validFiles]);

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImagenes(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
        if (portadaIndex === index) {
            setPortadaIndex(0);
        } else if (portadaIndex > index) {
            setPortadaIndex(portadaIndex - 1);
        }
    };

    const onBoxClick = () => {
        fileInputRef.current?.click();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
            return;
        }

        if (name === 'price' || name === 'admin_value') {
            const rawValue = value.replace(/[^0-9]/g, '');
            if (!rawValue) {
                setFormData(prev => ({ ...prev, [name]: '' }));
                return;
            }
            let formatted = rawValue;
            if (rawValue.length > 6) {
                const millions = rawValue.slice(0, -6).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                const thousands = rawValue.slice(-6, -3);
                const hundreds = rawValue.slice(-3);
                formatted = `${millions}'${thousands},${hundreds}`;
            } else if (rawValue.length > 3) {
                const thousands = rawValue.slice(0, -3);
                const hundreds = rawValue.slice(-3);
                formatted = `${thousands},${hundreds}`;
            }
            setFormData(prev => ({ ...prev, [name]: formatted }));
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.address && !formData.google_maps_link) {
            showError('Por favor provee la Dirección Exacta o un Enlace de Google Maps.');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('owner_name', formData.owner_name);
            data.append('price', formData.price.replace(/['',]/g, ''));
            data.append('address', formData.address || 'Ver enlace de Google Maps adjunto');
            data.append('description', formData.description);
            data.append('type', formData.type);

            if (formData.rooms) data.append('rooms', formData.rooms);
            if (formData.bathrooms) data.append('bathrooms', formData.bathrooms);
            if (formData.living_rooms) data.append('living_rooms', formData.living_rooms);
            if (formData.kitchens) data.append('kitchens', formData.kitchens);
            if (formData.garages) data.append('garages', formData.garages);
            data.append('is_commercial', formData.is_commercial ? 'true' : 'false');
            data.append('in_complex', formData.in_complex ? 'true' : 'false');
            data.append('admin_included', formData.admin_included ? 'true' : 'false');
            if (formData.admin_value) data.append('admin_value', formData.admin_value.replace(/['',]/g, ''));
            if (formData.google_maps_link) data.append('google_maps_link', formData.google_maps_link);

            // Agregar todas las imágenes
            if (imagenes.length > 0) {
               data.append('cover_image', imagenes[portadaIndex]);
            }

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/api/v1/properties/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data,
            });

            if (response.ok) {
                router.push('/dashboard/inmuebles');
            } else {
                let errorMsg = "Hubo un error al registrar el inmueble.";
                try {
                    const errorData = await response.json();
                    console.error("Error al guardar:", errorData);
                    if (errorData && typeof errorData === 'object') {
                        if (errorData.error) {
                            const err = errorData.error;
                            if (typeof err === 'string') {
                                errorMsg = err;
                            } else if (typeof err === 'object') {
                                if (err.details && typeof err.details === 'object' && Object.keys(err.details).length > 0) {
                                    errorMsg = Object.entries(err.details)
                                        .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                                        .join('\n');
                                } else if (err.message) {
                                    errorMsg = err.message;
                                }
                            }
                        } else if (errorData.detail) {
                            errorMsg = errorData.detail;
                        } else {
                            errorMsg = Object.entries(errorData)
                                .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                                .join('\n');
                        }
                    }
                } catch (jsonErr) {
                    try {
                        const rawText = await response.text();
                        console.error("Error al guardar (texto):", rawText);
                        if (rawText) {
                            errorMsg = rawText;
                        }
                    } catch (textErr) {
                        console.error("Error parsing response text:", textErr);
                    }
                }
                showError(errorMsg);
            }
        } catch (error) {
            console.error("Error de red:", error);
            showError("Error de conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="flex items-center space-x-4 mb-6">
                <Link href="/dashboard/inmuebles" className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-slate-500 hover:text-rose-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Registrar Inmueble</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Añade una nueva propiedad a tu catálogo con su galería.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 rounded-3xl p-8 sm:p-10 transition-colors">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Título</label>
                            <input name="owner_name" value={formData.owner_name} onChange={handleInputChange} type="text" required placeholder="Ej. Casa linda..." className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm" />
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Precio Mensual ($)</label>
                            <input name="price" value={formData.price} onChange={handleInputChange} type="text" required placeholder="0" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Dirección Exacta (Opcional si usas el mapa)</label>
                            <input name="address" value={formData.address} onChange={handleInputChange} type="text" placeholder="Ej. Calle 123..." className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm" />
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Enlace de Google Maps (Opcional)</label>
                            <input name="google_maps_link" value={formData.google_maps_link} onChange={handleInputChange} type="url" placeholder="Ej. https://maps.google.com/..." className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm" />
                        </div>
                        <div className="space-y-2 group relative">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Estado de la Propiedad</label>
                            <div className="relative">
                                <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all appearance-none cursor-pointer shadow-sm">
                                    <option value="APARTMENT">Apartamento</option>
                                    <option value="HOUSE">Casa</option>
                                    <option value="LOCAL">Local comercial</option>
                                    <option value="WAREHOUSE">Bodega</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Características Adicionales */}
                    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Características Adicionales</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Habitaciones</label>
                                <input name="rooms" value={formData.rooms} onChange={handleInputChange} type="number" min="0" placeholder="0" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm" />
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Baños</label>
                                <input name="bathrooms" value={formData.bathrooms} onChange={handleInputChange} type="number" min="0" placeholder="0" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm" />
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Salas</label>
                                <input name="living_rooms" value={formData.living_rooms} onChange={handleInputChange} type="number" min="0" placeholder="0" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm" />
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Cocinas</label>
                                <input name="kitchens" value={formData.kitchens} onChange={handleInputChange} type="number" min="0" placeholder="0" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm" />
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Garajes</label>
                                <input name="garages" value={formData.garages} onChange={handleInputChange} type="number" min="0" placeholder="0" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm" />
                            </div>
                        </div>
                        <div className="mt-8 flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:space-x-8">
                            <label className="flex items-center space-x-3 cursor-pointer group w-max">
                                <input
                                    name="is_commercial"
                                    type="checkbox"
                                    checked={formData.is_commercial}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 rounded border-slate-300 text-slate-900 dark:text-slate-400 focus:ring-slate-900 cursor-pointer shadow-sm"
                                />
                                <span className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300 select-none group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                    ¿Es de tipo comercial?
                                </span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer group w-max">
                                <input
                                    name="in_complex"
                                    type="checkbox"
                                    checked={formData.in_complex}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 rounded border-slate-300 text-slate-900 dark:text-slate-400 focus:ring-slate-900 cursor-pointer shadow-sm"
                                />
                                <span className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300 select-none group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                    ¿Está en conjunto cerrado?
                                </span>
                            </label>
                        </div>

                        {formData.in_complex && (
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/30 p-6 border border-slate-200 dark:border-slate-700/50 rounded-2xl transition-all">
                                <div className="space-y-2 group">
                                    <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Valor Administración Mensual ($)</label>
                                    <input name="admin_value" value={formData.admin_value} onChange={handleInputChange} type="text" placeholder="0" className="w-full px-5 py-3.5 bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm" />
                                </div>
                                <label className="flex items-center md:mt-8 space-x-3 cursor-pointer group w-max">
                                    <input
                                        name="admin_included"
                                        type="checkbox"
                                        checked={formData.admin_included}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer bg-white shadow-sm"
                                    />
                                    <span className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300 select-none group-hover:text-emerald-600 transition-colors">
                                        ¿El valor del alquiler incluye esta administración?
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 group mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Descripción Detallada</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={4} placeholder="Características principales, estado del inmueble, reglas especiales..." className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm font-light leading-relaxed"></textarea>
                    </div>

                    <div className="space-y-2 relative">
                        <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Galería de Imágenes</label>

                        <div
                            className={`mt-2 flex flex-col justify-center px-6 py-10 border-2 border-dashed rounded-2xl transition-colors cursor-pointer ${dragActive ? 'border-slate-900 bg-slate-100 dark:border-rose-500 dark:bg-slate-800' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-800/30'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={onBoxClick}
                        >
                            <svg className="mx-auto h-12 w-12 text-slate-400 mb-3" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                                <span className="font-semibold text-slate-900 dark:text-rose-400 hover:underline">Sube tus archivos</span>
                                <span className="ml-1">o arrástralos y suéltalos aquí</span>
                            </div>
                            <input ref={fileInputRef} onChange={handleChange} name="imagenes" type="file" multiple className="hidden" accept="image/*" />
                        </div>

                        {/* Image Previews */}
                        {previews.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                                {previews.map((src, index) => (
                                    <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <img src={src} alt={`Preview ${index}`} className="w-full h-28 object-cover" />

                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 to-transparent p-2 pt-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setPortadaIndex(index); }} className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded shadow-sm transition-colors ${portadaIndex === index ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'}`}>
                                                {portadaIndex === index ? 'Portada' : 'Elegir'}
                                            </button>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(index); }} className="text-white bg-rose-500/90 rounded-full p-1.5 hover:bg-rose-600 backdrop-blur-sm transition-colors">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>

                                        {portadaIndex === index && (
                                            <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] tracking-widest font-bold px-2 py-1 rounded shadow-sm border border-emerald-400">
                                                PORTADA
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-8 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                        <Link href="/dashboard/inmuebles" className="px-6 py-3.5 bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm tracking-wide">
                            Cancelar
                        </Link>
                        <button disabled={loading} type="submit" className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] text-sm tracking-wide">
                            {loading ? 'Guardando...' : 'Guardar Inmueble'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Error Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-8 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center text-rose-500 mb-4 border border-rose-100 dark:border-rose-900/40">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-950 dark:text-white mb-2">Error</h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 whitespace-pre-wrap">{errorModalMessage}</p>
                        <button
                            type="button"
                            onClick={() => setShowErrorModal(false)}
                            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-md focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
