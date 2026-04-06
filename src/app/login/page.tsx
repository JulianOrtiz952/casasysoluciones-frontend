'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/'}token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.access);
                localStorage.setItem('refreshToken', data.refresh);
                router.push('/dashboard');
            } else {
                setErrorMsg('Usuario o contraseña incorrectos');
            }
        } catch (error) {
            setErrorMsg('Fallo de conexión con el servidor');
        }
        setLoading(false);
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans p-4 relative overflow-hidden transition-colors duration-300">
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-100/40 dark:bg-rose-900/20 rounded-full blur-[80px] opacity-60 mix-blend-multiply transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-[80px] opacity-60 mix-blend-multiply transform -translate-x-1/3 translate-y-1/3"></div>

            {/* Back to Home Button */}
            <Link href="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm font-bold tracking-wide text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors z-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver al Inicio
            </Link>

            <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden border border-slate-100 dark:border-slate-800 p-8 sm:p-10 relative z-10 transition-all duration-300">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center mb-4 text-slate-800 dark:text-slate-200">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Iniciar Sesión</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Gestiona el inventario y propiedades</p>
                </div>

                {errorMsg && (
                    <div className="bg-rose-50/80 border border-rose-200 text-rose-600 rounded-xl p-3.5 text-center mb-8 text-sm font-semibold tracking-wide">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2 group">
                        <label className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                            Usuario
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Ingresa tu usuario"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white text-slate-800 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white text-slate-800 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white font-semibold rounded-xl py-4 shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]'}`}
                        >
                            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
