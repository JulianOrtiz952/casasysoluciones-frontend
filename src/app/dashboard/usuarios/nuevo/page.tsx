'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NuevoUsuario() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        documentoTipo: 'CC',
        documentoNumero: '',
        rol: 'ASSISTANT',
        password: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validaciones
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/;
        if (!nameRegex.test(formData.nombre.trim())) {
            alert("El nombre no debe contener caracteres especiales, solo letras, espacios y tildes.");
            return;
        }
        if (!nameRegex.test(formData.apellido.trim())) {
            alert("El apellido no debe contener caracteres especiales, solo letras, espacios y tildes.");
            return;
        }
        if (formData.email.trim() && !formData.email.includes('@')) {
            alert("El correo electrónico debe contener '@'.");
            return;
        }
        if (formData.telefono.trim() && !/^\d{10}$/.test(formData.telefono.trim())) {
            alert("El teléfono celular debe tener exactamente 10 dígitos numéricos.");
            return;
        }
        if (formData.documentoNumero.trim() && !/^\d{8,11}$/.test(formData.documentoNumero.trim())) {
            alert("El número de identificación debe tener entre 8 y 11 dígitos.");
            return;
        }

        setLoading(true);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');

            const payload: Record<string, any> = {
                first_name: formData.nombre.trim(),
                last_name: formData.apellido.trim(),
                email: formData.email.trim(),
                phone: formData.telefono.trim(),
                document_type: formData.documentoTipo,
                document_number: formData.documentoNumero.trim() || null,
                role: formData.rol,
                is_active: true
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            const response = await fetch(`${API_URL}/api/v1/usuarios/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                router.push('/dashboard/usuarios');
            } else {
                const errorData = await response.json();
                console.error("Error al guardar usuario:", errorData);
                
                let errorMsg = "Hubo un error al registrar el usuario.";
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
                alert(errorMsg);
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
                <Link href="/dashboard/usuarios" className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-slate-500 hover:text-rose-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Registrar Usuario de Staff</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Añade los datos de un nuevo miembro del equipo administrativo.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-3xl p-8 transition-colors">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Nombre</label>
                            <input name="nombre" value={formData.nombre} onChange={handleInputChange} type="text" required placeholder="Ej. Juan" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm text-sm" />
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Apellido</label>
                            <input name="apellido" value={formData.apellido} onChange={handleInputChange} type="text" required placeholder="Ej. Pérez" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Correo Corporativo</label>
                            <input name="email" value={formData.email} onChange={handleInputChange} type="email" required placeholder="correo@casasysoluciones.com" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm text-sm" />
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Teléfono Celular</label>
                            <input name="telefono" value={formData.telefono} onChange={handleInputChange} type="text" required placeholder="Ej. 3100000000" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Tipo de Documento</label>
                            <select name="documentoTipo" value={formData.documentoTipo} onChange={handleInputChange} required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm text-sm">
                                <option value="CC">Cédula de ciudadanía</option>
                                <option value="CE">Cédula de extranjería</option>
                                <option value="PASSPORT">Pasaporte</option>
                                <option value="NIT">NIT</option>
                            </select>
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Nº de Identificación</label>
                            <input name="documentoNumero" value={formData.documentoNumero} onChange={handleInputChange} type="text" required placeholder="Ej. 10203040" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Rol en el Sistema</label>
                            <select name="rol" value={formData.rol} onChange={handleInputChange} required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm text-sm">
                                <option value="ASSISTANT">Asistente Administrativo</option>
                                <option value="ADMIN">Administrador</option>
                            </select>
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Contraseña (Opcional)</label>
                            <input name="password" value={formData.password} onChange={handleInputChange} type="password" placeholder="Por defecto será el Nº de Identificación" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm text-sm" />
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800 mt-8 flex justify-end gap-3">
                        <Link href="/dashboard/usuarios" className="px-6 py-3 bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition text-sm">
                            Cancelar
                        </Link>
                        <button disabled={loading} type="submit" className="px-8 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] flex items-center gap-2 active:scale-95 text-sm">
                            {loading ? 'Registrando...' : 'Registrar Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
