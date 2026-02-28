'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface Inquilino {
    id: number;
    nombre: string;
    identificacion: string;
}

interface Imagen {
    id: number;
    imagen: string;
    es_portada: boolean;
}

interface Inmueble {
    id: number;
    titulo: string;
    descripcion: string;
    precio: string;
    direccion: string;
    imagen: string | null;
    imagenes?: Imagen[];
    estado: 'arrendada' | 'en_oferta' | 'en_mantenimiento' | 'inactiva';
}

interface Historial {
    id: number;
    fecha_inicio: string;
    fecha_fin: string | null;
    esta_activo: boolean;
    inquilino_detalle: Inquilino;
    inmueble: number;
}

const estadoInfo: Record<string, { label: string, colorClass: string }> = {
    'arrendada': { label: 'Arrendada', colorClass: 'bg-indigo-500/90 text-white' },
    'en_oferta': { label: 'En Oferta', colorClass: 'bg-emerald-500/90 text-white' },
    'en_mantenimiento': { label: 'En Mantenimiento', colorClass: 'bg-amber-500/90 text-white' },
    'inactiva': { label: 'Inactiva', colorClass: 'bg-slate-500/90 text-white' },
};

export default function DashboardInmuebleDetail() {
    const { id } = useParams();
    const router = useRouter();

    const [inmueble, setInmueble] = useState<Inmueble | null>(null);
    const [historial, setHistorial] = useState<Historial[]>([]);
    const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Formulario de asignación
    const [inquilinoSeleccionado, setInquilinoSeleccionado] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

                // Fetch Inmueble
                const resInm = await fetch(`${API_URL}/api/v1/inmuebles/${id}/`);
                if (resInm.ok) setInmueble(await resInm.json());
                else { router.push('/dashboard/inmuebles'); return; }

                // Fetch Historial (filtramos los de este inmueble en frontend por simplicidad)
                const resHist = await fetch(`${API_URL}/api/v1/historial_alquiler/`);
                if (resHist.ok) {
                    const allHist: Historial[] = await resHist.json();
                    setHistorial(allHist.filter(h => h.inmueble === Number(id)));
                }

                // Fetch Inquilinos para el select
                const resInq = await fetch(`${API_URL}/api/v1/inquilinos/`);
                if (resInq.ok) setInquilinos(await resInq.json());

            } catch (error) {
                console.error("Error al cargar datos:", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id, router]);

    const handleAsignar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inquilinoSeleccionado || !fechaInicio || !inmueble) return;
        setSaving(true);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            // 1. Crear el historial
            const resHistorial = await fetch(`${API_URL}/api/v1/historial_alquiler/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inmueble: inmueble.id,
                    inquilino: inquilinoSeleccionado,
                    fecha_inicio: fechaInicio,
                    esta_activo: true
                })
            });

            if (resHistorial.ok) {
                // 2. Cambiar el estado de la casa automáticamente a "Arrendada" si no lo estaba
                if (inmueble.estado !== 'arrendada') {
                    await fetch(`${API_URL}/api/v1/inmuebles/${id}/`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ estado: 'arrendada' })
                    });
                }
                // Refrescar página para ver cambios
                window.location.reload();
            } else {
                alert("Error al asignar inquilino.");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-64 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
            </div>
        );
    }

    if (!inmueble) return null;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            <div className="flex items-center space-x-4 mb-6">
                <Link href="/dashboard/inmuebles" className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-slate-500 hover:text-rose-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Admin: {inmueble.titulo}</h1>
                        <Link href={`/dashboard/inmuebles/editar/${id}`} className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            Editar
                        </Link>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gesti&oacute;n y asignaciones del inmueble.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna Izquierda: Info de Inmueble */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                        <div className="h-48 relative bg-slate-100 dark:bg-slate-800">
                            {(() => {
                                const mainImg = inmueble.imagenes?.find(img => img.es_portada)?.imagen || (inmueble.imagenes?.length ? inmueble.imagenes[0].imagen : inmueble.imagen);
                                return mainImg ? (
                                    <img src={mainImg} alt="Inmueble" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex w-full h-full items-center justify-center text-slate-400">Sin foto</div>
                                );
                            })()}
                            <div className="absolute top-4 right-4">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-md shadow-sm ${estadoInfo[inmueble.estado]?.colorClass}`}>
                                    {estadoInfo[inmueble.estado]?.label}
                                </span>
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">{inmueble.direccion}</h3>
                            <p className="text-xl font-black text-rose-500 mb-4">${parseFloat(inmueble.precio).toLocaleString()}</p>

                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-4">{inmueble.descripcion}</p>

                            <Link href={`/inmuebles/${inmueble.id}`} target="_blank" className="mt-6 flex justify-center w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition text-sm text-center">
                                Ver como Cliente Público
                            </Link>

                            {inmueble.imagenes && inmueble.imagenes.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Galería</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {inmueble.imagenes.map(img => (
                                            <div key={img.id} className="relative rounded-lg overflow-hidden h-16 border border-slate-200 dark:border-slate-700">
                                                <img src={img.imagen} alt="Galería" className="w-full h-full object-cover" />
                                                {img.es_portada && <span className="absolute bottom-0 inset-x-0 bg-emerald-500 text-white text-[8px] text-center font-bold px-1">PORTADA</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Asignaciones e Historial */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Tarjeta de Asignación */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Asignar Nuevo Inquilino</h2>
                        <form onSubmit={handleAsignar} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Seleccionar Inquilino</label>
                                <select
                                    required
                                    value={inquilinoSeleccionado}
                                    onChange={(e) => setInquilinoSeleccionado(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">-- Elige --</option>
                                    {inquilinos.map(inq => (
                                        <option key={inq.id} value={inq.id}>{inq.nombre} ({inq.identificacion})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Fecha de Inicio</label>
                                <input
                                    required
                                    type="date"
                                    value={fechaInicio}
                                    onChange={(e) => setFechaInicio(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white transition-all"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <button disabled={saving} type="submit" className="w-full px-4 py-3 bg-rose-500 text-white font-semibold rounded-xl hover:bg-rose-600 transition shadow-lg shadow-rose-500/30">
                                    {saving ? 'Guardando' : 'Asignar'}
                                </button>
                            </div>
                            {inquilinos.length === 0 && (
                                <p className="md:col-span-5 text-sm text-rose-500 mt-2">
                                    No tienes inquilinos creados. Ve a la <Link href="/dashboard/inquilinos/nuevo" className="underline">página de Inquilinos</Link> para registrar uno primero.
                                </p>
                            )}
                        </form>
                    </div>

                    {/* Historial */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Historial de Ocupación</h2>

                        {historial.length === 0 ? (
                            <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                <p className="text-slate-500 dark:text-slate-400">Este inmueble no ha tenido inquilinos asignados aún.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {historial.map((hist) => (
                                    <div key={hist.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl border ${hist.esta_activo ? 'border-rose-200 bg-rose-50 dark:border-rose-900/30 dark:bg-rose-900/10' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'}`}>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{hist.inquilino_detalle.nombre}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">CC: {hist.inquilino_detalle.identificacion}</p>
                                        </div>
                                        <div className="mt-3 sm:mt-0 text-left sm:text-right">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Inicio:</span>
                                                <span className="text-sm text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md">{hist.fecha_inicio}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Fin:</span>
                                                {hist.fecha_fin ? (
                                                    <span className="text-sm text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md">{hist.fecha_fin}</span>
                                                ) : (
                                                    <span className="text-sm text-rose-500 font-medium">Actualmente habitando</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
