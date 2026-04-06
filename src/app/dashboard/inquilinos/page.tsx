'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Inquilino {
    id: number;
    nombre: string;
    email: string;
    telefono: string;
    identificacion: string;
    creado_en: string;
}

export default function InquilinosPage() {
    const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInquilinos = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${API_URL}/api/v1/inquilinos/`);
                if (res.ok) {
                    const data = await res.json();
                    setInquilinos(data);
                }
            } catch (error) {
                console.error("Error al cargar inquilinos", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInquilinos();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Inquilinos</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Directorio de tus arrendatarios registrados.</p>
                </div>
                <Link
                    href="/dashboard/inquilinos/nuevo"
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Añadir Inquilino
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 dark:border-rose-500"></div>
                </div>
            ) : inquilinos.length === 0 ? (
                <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm backdrop-blur-md">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Aún no tienes inquilinos</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto font-light leading-relaxed">Comienza agregando los datos de las personas que arriendan tus propiedades.</p>
                </div>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                                <th className="py-4 px-6 text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Nombre</th>
                                <th className="py-4 px-6 text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Identificación</th>
                                <th className="py-4 px-6 text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Email</th>
                                <th className="py-4 px-6 text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Teléfono</th>
                                <th className="py-4 px-6 text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inquilinos.map((inq) => (
                                <tr key={inq.id} className="border-b border-slate-50 dark:border-slate-800/50 last:border-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="py-4 px-6 font-semibold text-sm text-slate-900 dark:text-white">{inq.nombre}</td>
                                    <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 font-medium">{inq.identificacion}</td>
                                    <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 font-medium">{inq.email}</td>
                                    <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 font-medium">{inq.telefono}</td>
                                    <td className="py-4 px-6 text-right">
                                        <button className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] uppercase tracking-wider font-bold transition-colors">
                                            Ver Historial
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
