'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NuevoInquilino() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        identificacion: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/api/v1/inquilinos/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.push('/dashboard/inquilinos');
            } else {
                const errorData = await response.text();
                console.error("Error al guardar:", errorData);
                alert("Hubo un error al registrar el inquilino.");
            }
        } catch (error) {
            console.error("Error de red:", error);
            alert("Error de conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-10">
            <div className="flex items-center space-x-4 mb-6">
                <Link href="/dashboard/inquilinos" className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-slate-500 hover:text-rose-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Registrar Inquilino</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Añade los datos de un nuevo arrendatario en el sistema.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-3xl p-8 transition-colors">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">Nombre Completo</label>
                            <input name="nombre" value={formData.nombre} onChange={handleInputChange} type="text" required placeholder="Ej. Juan Pérez" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">Nº de Identificación</label>
                            <input name="identificacion" value={formData.identificacion} onChange={handleInputChange} type="text" required placeholder="Cédula, DNI, Pasaporte..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">Correo Electrónico</label>
                            <input name="email" value={formData.email} onChange={handleInputChange} type="email" required placeholder="correo@ejemplo.com" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">Teléfono Celular</label>
                            <input name="telefono" value={formData.telefono} onChange={handleInputChange} type="text" required placeholder="+57 321 000 0000" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white transition-all" />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Link href="/dashboard/inquilinos" className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                            Cancelar
                        </Link>
                        <button disabled={loading} type="submit" className="px-6 py-3 bg-rose-500 text-white font-semibold rounded-xl hover:bg-rose-600 transition shadow-lg shadow-rose-500/30 flex items-center gap-2">
                            {loading ? 'Guardando...' : 'Guardar Inquilino'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
