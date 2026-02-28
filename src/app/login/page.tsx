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
        <main className="min-h-screen flex items-center justify-center bg-rose-50 dark:bg-slate-950 font-sans p-4 relative overflow-hidden transition-colors duration-300">
            {/* Círculos decorativos de fondo */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-200 dark:bg-rose-900/20 rounded-full blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-200 dark:bg-pink-900/20 rounded-full blur-3xl opacity-50 transform -translate-x-1/2 translate-y-1/2"></div>

            <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-rose-100 dark:border-slate-800 p-8 sm:p-10 relative z-10 transition-all duration-300">
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center justify-center mb-4 text-rose-500 hover:text-rose-600 dark:text-rose-400 transition">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </Link>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Acceso Admin</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Gestiona tus propiedades</p>
                </div>

                {errorMsg && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-lg p-3 text-center mb-6 text-sm font-medium">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2 group">
                        <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
                            Usuario
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="ej. admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-5 py-3.5 bg-rose-50/50 dark:bg-slate-800 border border-rose-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white text-slate-800 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-3.5 bg-rose-50/50 dark:bg-slate-800 border border-rose-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white text-slate-800 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white font-semibold rounded-xl py-3.5 shadow-lg transition-all duration-300 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30 hover:-translate-y-1 active:scale-[0.98]'}`}
                        >
                            {loading ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
