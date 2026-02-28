'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Imagen {
    id: number;
    imagen: string;
    es_portada: boolean;
}

interface Inquilino {
    id: number;
    nombre: string;
    identificacion: string;
}

export default function EditarInmueble() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Multiples imágenes locales
    const [dragActive, setDragActive] = useState(false);
    const [imagenes, setImagenes] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [portadaIndex, setPortadaIndex] = useState<number>(0);
    // Imágenes previas de la base de datos que se renderizan si no se reemplazan
    const [remoteImages, setRemoteImages] = useState<Imagen[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
    const [formData, setFormData] = useState({
        titulo: '',
        precio: '',
        direccion: '',
        descripcion: '',
        estado: 'en_oferta',
        inquilinoId: '',
        fechaInicio: ''
    });

    useEffect(() => {
        const fetchDatos = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

                // Cargar inmueble
                const resInm = await fetch(`${API_URL}/api/v1/inmuebles/${id}/`);
                if (resInm.ok) {
                    const data = await resInm.json();
                    setFormData(prev => ({
                        ...prev,
                        titulo: data.titulo,
                        precio: data.precio,
                        direccion: data.direccion,
                        descripcion: data.descripcion,
                        estado: data.estado
                    }));
                    if (data.imagenes) setRemoteImages(data.imagenes);
                }

                // Cargar inquilinos por si acaso edita a estado 'Arrendada'
                const resInq = await fetch(`${API_URL}/api/v1/inquilinos/`);
                if (resInq.ok) {
                    setInquilinos(await resInq.json());
                }
            } catch (error) {
                console.error("Error al cargar:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDatos();
    }, [id]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const handleFiles = (files: File[]) => {
        const validFiles = files.filter(f => f.type.startsWith('image/'));
        if (validFiles.length === 0) return;
        setImagenes(prev => [...prev, ...validFiles]);
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setPreviews(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImagenes(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
        if (portadaIndex === index) setPortadaIndex(0);
        else if (portadaIndex > index) setPortadaIndex(portadaIndex - 1);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (formData.estado === 'arrendada' && (!formData.inquilinoId || !formData.fechaInicio)) {
            alert('Has marcado el inmueble como ocupado. Por favor, selecciona un inquilino y la fecha de inicio del alquiler para continuar.');
            return;
        }

        setSaving(true);

        try {
            const data = new FormData();
            data.append('titulo', formData.titulo);
            data.append('precio', formData.precio);
            data.append('direccion', formData.direccion);
            data.append('descripcion', formData.descripcion);
            data.append('estado', formData.estado);

            // Imágenes nuevas
            if (imagenes.length > 0) {
                data.append('reemplazar_imagenes', 'true');
                imagenes.forEach((imagen) => {
                    data.append('imagenes', imagen);
                });
                data.append('portada_index', portadaIndex.toString());
            }

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/api/v1/inmuebles/${id}/`, {
                method: 'PATCH',
                body: data,
            });

            if (response.ok) {
                // Si el inmueble fue puesto en 'arrendada' e ingresaron un inquilino
                if (formData.estado === 'arrendada' && formData.inquilinoId) {
                    await fetch(`${API_URL}/api/v1/historial_alquiler/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            inmueble: id,
                            inquilino: formData.inquilinoId,
                            fecha_inicio: formData.fechaInicio,
                            esta_activo: true
                        })
                    });
                }
                router.push(`/dashboard/inmuebles/${id}`);
            } else {
                alert("Hubo un error al actualizar el inmueble.");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión con el servidor.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <Link href={`/dashboard/inmuebles/${id}`} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-slate-500 hover:text-rose-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Editar Inmueble</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Modifica la información, fotos o estado general.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-3xl p-8 transition-colors">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">Título de la Propiedad</label>
                            <input name="titulo" value={formData.titulo} onChange={handleInputChange} type="text" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">Precio Mensual ($)</label>
                            <input name="precio" value={formData.precio} onChange={handleInputChange} type="number" step="0.01" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">Dirección Exacta</label>
                            <input name="direccion" value={formData.direccion} onChange={handleInputChange} type="text" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">Estado de la Propiedad</label>
                            <div className="relative">
                                <select name="estado" value={formData.estado} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white transition-all appearance-none cursor-pointer">
                                    <option value="en_oferta">En Oferta</option>
                                    <option value="arrendada">Arrendada (Ya está ocupado)</option>
                                    <option value="en_mantenimiento">En Mantenimiento</option>
                                    <option value="inactiva">Inactiva</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {formData.estado === 'arrendada' && (
                        <div className="p-5 border-2 border-indigo-200 bg-indigo-50 dark:border-indigo-900/40 dark:bg-indigo-900/10 rounded-2xl">
                            <h3 className="text-indigo-800 dark:text-indigo-400 font-bold mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Se requiere información de Inquilino
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-indigo-700 dark:text-indigo-300">Seleccionar Inquilino</label>
                                    <select name="inquilinoId" value={formData.inquilinoId} onChange={handleInputChange} required className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-lg outline-none text-sm dark:text-white form-select">
                                        <option value="">-- Elige un Inquilino --</option>
                                        {inquilinos.map(inq => (
                                            <option key={inq.id} value={inq.id}>{inq.nombre} ({inq.identificacion})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-indigo-700 dark:text-indigo-300">Fecha de Inicio</label>
                                    <input name="fechaInicio" value={formData.fechaInicio} onChange={handleInputChange} type="date" required className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-lg outline-none text-sm dark:text-white" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">Descripción Detallada</label>
                        <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} required rows={4} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white transition-all"></textarea>
                    </div>

                    {/* Imágenes Actuales si no se suben nuevas */}
                    {remoteImages.length > 0 && previews.length === 0 && (
                        <div className="space-y-2 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                            <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">Galería Actual</label>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                {remoteImages.map((img) => (
                                    <div key={img.id} className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 h-20">
                                        <img src={img.imagen} alt="Inmueble" className="w-full h-full object-cover" />
                                        {img.es_portada && (
                                            <span className="absolute bottom-0 inset-x-0 bg-emerald-500 text-white text-[10px] text-center font-bold px-1 py-0.5">PORTADA</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">NOTA: Si subes imágenes nuevas, se reemplazarán enteramente las actuales del servidor.</p>
                        </div>
                    )}

                    <div className="space-y-2 relative mt-4">
                        <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                            {previews.length === 0 && remoteImages.length > 0 ? 'Subir Nuevas Imágenes (Sobrescribir)' : 'Subir Imágenes'}
                        </label>

                        <div
                            className={`mt-1 flex flex-col justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${dragActive ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
                        >
                            <svg className="mx-auto h-10 w-10 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center mt-2">
                                <span className="font-medium text-rose-500 hover:text-rose-600">Subir múltiples archivos</span>
                                <span className="ml-1">o arrastrar y soltar</span>
                            </div>
                            <input ref={fileInputRef} onChange={handleChange} name="imagenes" type="file" multiple className="hidden" accept="image/*" />
                        </div>

                        {previews.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                                {previews.map((src, index) => (
                                    <div key={index} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                        <img src={src} alt="Preview" className="w-full h-24 object-cover" />
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 flex justify-between items-center opacity-0 group-hover:opacity-100 transition">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setPortadaIndex(index); }} className={`px-2 py-0.5 text-xs font-bold rounded ${portadaIndex === index ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900'}`}>
                                                {portadaIndex === index ? 'Portada' : 'Elegir'}
                                            </button>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(index); }} className="text-white bg-rose-500 rounded-full p-1">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                        <Link href={`/dashboard/inmuebles/${id}`} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                            Cancelar
                        </Link>
                        <button disabled={saving} type="submit" className="px-6 py-3 bg-rose-500 text-white font-semibold rounded-xl hover:bg-rose-600 transition shadow-lg shadow-rose-500/30 flex items-center gap-2">
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
