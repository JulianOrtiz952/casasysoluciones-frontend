'use client';

import { useState, useEffect } from 'react';

interface UserProfile {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    document_type: string;
    document_number: string;
    role: string;
    role_display: string;
}

export default function ConfiguracionPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        document_type: 'CC',
        document_number: '',
        password: '',
        confirm_password: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/v1/auth/me/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setProfile(data);
                setFormData({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    phone: data.phone || '',
                    document_type: data.document_type || 'CC',
                    document_number: data.document_number || '',
                    password: '',
                    confirm_password: ''
                });
            } else {
                console.error("Error al obtener el perfil.");
            }
        } catch (error) {
            console.error("Error de red:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validaciones
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/;
        if (!nameRegex.test(formData.first_name.trim())) {
            alert("El nombre no debe contener caracteres especiales, solo letras, espacios y tildes.");
            return;
        }
        if (!nameRegex.test(formData.last_name.trim())) {
            alert("El apellido no debe contener caracteres especiales, solo letras, espacios y tildes.");
            return;
        }
        if (formData.phone && !/^\d{10}$/.test(formData.phone.trim())) {
            alert("El teléfono celular debe tener exactamente 10 dígitos numéricos.");
            return;
        }
        if (formData.document_number && !/^\d{8,11}$/.test(formData.document_number.trim())) {
            alert("El número de identificación debe tener entre 8 y 11 dígitos.");
            return;
        }
        if (formData.password) {
            if (formData.password.length < 8) {
                alert("La nueva contraseña debe tener al menos 8 caracteres.");
                return;
            }
            if (formData.password !== formData.confirm_password) {
                alert("Las contraseñas no coinciden.");
                return;
            }
        }

        setSubmitting(true);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');

            const payload: Record<string, any> = {
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                phone: formData.phone.trim(),
                document_type: formData.document_type,
                document_number: formData.document_number.trim() || null
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            const response = await fetch(`${API_URL}/api/v1/auth/me/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Perfil actualizado exitosamente.");
                fetchProfile();
            } else {
                const errorData = await response.json();
                console.error("Error al actualizar perfil:", errorData);
                
                let errorMsg = "Hubo un error al actualizar el perfil.";
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
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-1/3"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-1/2"></div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="space-y-2">
                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 animate-pulse"></div>
                                <div className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto pb-10 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mi Configuración</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Actualiza tu información personal y administra tu contraseña.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-3xl p-8 transition-colors">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Nombre</label>
                            <input
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                type="text"
                                required
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-500 dark:text-white transition-all shadow-sm text-sm"
                            />
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Apellido</label>
                            <input
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                type="text"
                                required
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-500 dark:text-white transition-all shadow-sm text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group opacity-75">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Email (No modificable)</label>
                            <input
                                name="email"
                                value={profile?.email || ''}
                                disabled
                                type="email"
                                className="w-full px-5 py-3.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-500 dark:text-slate-400 cursor-not-allowed text-sm shadow-sm"
                            />
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Teléfono Celular</label>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                type="text"
                                required
                                placeholder="Ej. 3100000000"
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-500 dark:text-white transition-all shadow-sm text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Tipo de Documento</label>
                            <select
                                name="document_type"
                                value={formData.document_type}
                                onChange={handleInputChange}
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-500 dark:text-white transition-all shadow-sm text-sm"
                            >
                                <option value="CC">Cédula de ciudadanía</option>
                                <option value="CE">Cédula de extranjería</option>
                                <option value="PASSPORT">Pasaporte</option>
                                <option value="NIT">NIT</option>
                            </select>
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Nº de Identificación</label>
                            <input
                                name="document_number"
                                value={formData.document_number}
                                onChange={handleInputChange}
                                type="text"
                                required
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-500 dark:text-white transition-all shadow-sm text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight mb-4 uppercase">Cambiar Contraseña</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 group">
                                <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Nueva Contraseña (Mín. 8 caracteres)</label>
                                <input
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    type="password"
                                    placeholder="Dejar vacío para no cambiar"
                                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-500 dark:text-white transition-all shadow-sm text-sm"
                                />
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Confirmar Nueva Contraseña</label>
                                <input
                                    name="confirm_password"
                                    value={formData.confirm_password}
                                    onChange={handleInputChange}
                                    type="password"
                                    placeholder="Confirmar nueva contraseña"
                                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-500 dark:text-white transition-all shadow-sm text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={fetchProfile}
                            className="px-6 py-3 bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition text-sm"
                        >
                            Descartar
                        </button>
                        <button
                            disabled={submitting}
                            type="submit"
                            className="px-8 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] flex items-center gap-2 active:scale-95 text-sm"
                        >
                            {submitting ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
