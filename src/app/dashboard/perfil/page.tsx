'use client';

import { useState } from 'react';

export default function Perfil() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'exito' | 'error' } | null>(null);
    const [cargando, setCargando] = useState(false);

    // Decodificador manual de JWT
    function parseJwt(token: string) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    const cambiarClave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMensaje(null);

        if (newPassword !== confirmPassword) {
            setMensaje({ texto: "Las contraseñas nuevas no coinciden.", tipo: 'error' });
            return;
        }

        if (newPassword.length < 8) {
            setMensaje({ texto: "La nueva contraseña debe tener al menos 8 caracteres.", tipo: 'error' });
            return;
        }

        setCargando(true);
        try {
            const token = localStorage.getItem('token');
            let currentUsername = 'admin';
            if (token) {
                const decoded = parseJwt(token);
                if (decoded && decoded.username) {
                    currentUsername = decoded.username;
                }
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/'}auth/change-password/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: currentUsername,
                    old_password: oldPassword,
                    new_password: newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMensaje({ texto: "¡Contraseña actualizada con éxito!", tipo: 'exito' });
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMensaje({ texto: data.error || "Ocurrió un error al intentar cambiar la contraseña", tipo: 'error' });
            }
        } catch (error) {
            setMensaje({ texto: "Fallo de conexión. Revisa tu internet o la URL del backend.", tipo: 'error' });
        }
        setCargando(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-6">Configurar Perfil</h1>

            <div className="bg-white dark:bg-slate-900 overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="p-6 sm:p-8">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6">Cambiar Contraseña</h2>

                    {mensaje && (
                        <div className={`p-4 mb-6 rounded-xl border ${mensaje.tipo === 'exito' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 text-rose-700 dark:text-rose-400'}`}>
                            {mensaje.texto}
                        </div>
                    )}

                    <form onSubmit={cambiarClave} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contraseña Actual *</label>
                            <input
                                type="password"
                                required
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:focus:ring-rose-500 text-slate-900 dark:text-white transition-all"
                                placeholder="Escribe tu contraseña actual"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nueva Contraseña *</label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:focus:ring-rose-500 text-slate-900 dark:text-white transition-all"
                                placeholder="Mínimo 8 caracteres"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirmar Nueva Contraseña *</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:focus:ring-rose-500 text-slate-900 dark:text-white transition-all"
                                placeholder="Vuelve a escribir la nueva contraseña"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={cargando}
                                className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all shadow-md active:scale-95 flex justify-center items-center ${cargando ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600 hover:shadow-rose-500/25'}`}
                            >
                                {cargando ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Actualizar Contraseña'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
