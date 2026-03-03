'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NuevoInmueble() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Multiples imágenes
    const [imagenes, setImagenes] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [portadaIndex, setPortadaIndex] = useState<number>(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        titulo: '',
        precio: '',
        direccion: '',
        descripcion: '',
        estado: 'en_oferta'
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
        const { name, value } = e.target;
        if (name === 'precio') {
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
        setLoading(true);

        try {
            const data = new FormData();
            data.append('titulo', formData.titulo);
            data.append('precio', formData.precio.replace(/['',]/g, ''));
            data.append('direccion', formData.direccion);
            data.append('descripcion', formData.descripcion);
            data.append('estado', formData.estado);

            // Agregar todas las imágenes
            imagenes.forEach((imagen) => {
                data.append('imagenes', imagen);
            });
            data.append('portada_index', portadaIndex.toString());

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/api/v1/inmuebles/`, {
                method: 'POST',
                body: data,
            });

            if (response.ok) {
                router.push('/dashboard/inmuebles');
            } else {
                const errorData = await response.text();
                console.error("Error al guardar:", errorData);
                alert("Hubo un error al registrar el inmueble.");
            }
        } catch (error) {
            console.error("Error de red:", error);
            alert("Error de conexión con el servidor.");
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

            <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-3xl p-8 transition-colors">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">Título de la Propiedad</label>
                            <input name="titulo" value={formData.titulo} onChange={handleInputChange} type="text" required placeholder="Ej. Casa campestre..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">Precio Mensual ($)</label>
                            <input name="precio" value={formData.precio} onChange={handleInputChange} type="text" required placeholder="0" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">Dirección Exacta</label>
                            <input name="direccion" value={formData.direccion} onChange={handleInputChange} type="text" required placeholder="Ej. Calle 123..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">Estado de la Propiedad</label>
                            <div className="relative">
                                <select name="estado" value={formData.estado} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white transition-all appearance-none cursor-pointer">
                                    <option value="en_oferta">En Oferta</option>
                                    <option value="arrendada">Arrendada (Requiere asignar inquilino al guardar si fuera edición, aunque en creación mejor en oferta)</option>
                                    <option value="en_mantenimiento">En Mantenimiento</option>
                                    <option value="inactiva">Inactiva</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">Descripción Detallada</label>
                        <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} required rows={4} placeholder="Características principales, habitaciones, baños..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white transition-all"></textarea>
                    </div>

                    <div className="space-y-2 relative">
                        <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">Galería de Imágenes</label>

                        <div
                            className={`mt-1 flex flex-col justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${dragActive ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={onBoxClick}
                        >
                            <svg className="mx-auto h-10 w-10 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center mt-2">
                                <span className="font-medium text-rose-500 hover:text-rose-600">Subir múltiples archivos</span>
                                <span className="ml-1">o arrastrar y soltar</span>
                            </div>
                            <input ref={fileInputRef} onChange={handleChange} name="imagenes" type="file" multiple className="hidden" accept="image/*" />
                        </div>

                        {/* Image Previews */}
                        {previews.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                                {previews.map((src, index) => (
                                    <div key={index} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                        <img src={src} alt={`Preview ${index}`} className="w-full h-24 object-cover" />

                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 flex justify-between items-center opacity-0 group-hover:opacity-100 transition">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setPortadaIndex(index); }} className={`px-2 py-0.5 text-xs font-bold rounded ${portadaIndex === index ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900'}`}>
                                                {portadaIndex === index ? 'Portada' : 'Elegir'}
                                            </button>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(index); }} className="text-white bg-rose-500 rounded-full p-1 hover:bg-rose-600">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>

                                        {portadaIndex === index && (
                                            <div className="absolute top-1 right-1 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                PORTADA
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Link href="/dashboard/inmuebles" className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                            Cancelar
                        </Link>
                        <button disabled={loading} type="submit" className="px-6 py-3 bg-rose-500 text-white font-semibold rounded-xl hover:bg-rose-600 transition shadow-lg shadow-rose-500/30">
                            {loading ? 'Guardando...' : 'Guardar Inmueble'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
