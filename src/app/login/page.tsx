'use client';

import { notifySessionChange } from '@/app/browser-state';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const LOGIN_DEVICE_STORAGE_KEY = 'casasysoluciones.login-device-id';
const LOGIN_BLOCKED_UNTIL_STORAGE_KEY = 'casasysoluciones.login-blocked-until';

function getLoginDeviceId() {
    const existing = localStorage.getItem(LOGIN_DEVICE_STORAGE_KEY);
    if (existing) return existing;

    const deviceId = crypto.randomUUID();
    localStorage.setItem(LOGIN_DEVICE_STORAGE_KEY, deviceId);
    return deviceId;
}

function formatRemainingTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    useEffect(() => {
        const restoreBlock = () => {
            const storedValue = Number(localStorage.getItem(LOGIN_BLOCKED_UNTIL_STORAGE_KEY));
            const seconds = Math.max(0, Math.ceil((storedValue - Date.now()) / 1000));

            if (Number.isFinite(storedValue) && seconds > 0) {
                setBlockedUntil(storedValue);
                setRemainingSeconds(seconds);
                return;
            }

            localStorage.removeItem(LOGIN_BLOCKED_UNTIL_STORAGE_KEY);
            setBlockedUntil(null);
            setRemainingSeconds(0);
        };

        restoreBlock();
        window.addEventListener('storage', restoreBlock);
        return () => window.removeEventListener('storage', restoreBlock);
    }, []);

    useEffect(() => {
        if (!blockedUntil) return;

        const updateCountdown = () => {
            const seconds = Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000));
            setRemainingSeconds(seconds);

            if (seconds === 0) {
                localStorage.removeItem(LOGIN_BLOCKED_UNTIL_STORAGE_KEY);
                setBlockedUntil(null);
                setErrorMsg('');
            }
        };

        updateCountdown();
        const intervalId = window.setInterval(updateCountdown, 1000);
        return () => window.clearInterval(intervalId);
    }, [blockedUntil]);

    const activateServerBlock = (data: unknown, retryAfterHeader: string | null) => {
        const response = data as { error?: { details?: { locked_until?: string } } } | null;
        const lockedUntilValue = response?.error?.details?.locked_until;
        const serverTimestamp = lockedUntilValue ? Date.parse(lockedUntilValue) : Number.NaN;
        const retryAfterSeconds = Number(retryAfterHeader);
        const fallbackTimestamp = Number.isFinite(retryAfterSeconds)
            ? Date.now() + Math.max(1, retryAfterSeconds) * 1000
            : Number.NaN;
        // Retry-After es relativo y evita depender de que el reloj del dispositivo esté sincronizado.
        const timestamp = Number.isFinite(fallbackTimestamp) ? fallbackTimestamp : serverTimestamp;

        if (!Number.isFinite(timestamp) || timestamp <= Date.now()) return;

        localStorage.setItem(LOGIN_BLOCKED_UNTIL_STORAGE_KEY, String(timestamp));
        setBlockedUntil(timestamp);
        setRemainingSeconds(Math.max(1, Math.ceil((timestamp - Date.now()) / 1000)));
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading || (blockedUntil !== null && blockedUntil > Date.now())) return;

        setErrorMsg('');
        setLoading(true);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${API_URL}/api/v1/auth/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Device-ID': getLoginDeviceId(),
                },
                body: JSON.stringify({ email, password })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.access);
                localStorage.setItem('refreshToken', data.refresh);
                notifySessionChange();
                router.push('/dashboard');
            } else {
                const data = await res.json().catch(() => null);
                if (res.status === 429) {
                    activateServerBlock(data, res.headers.get('Retry-After'));
                }
                setErrorMsg(data?.error?.message || 'Usuario o contraseña incorrectos');
            }
        } catch {
            setErrorMsg('Fallo de conexión con el servidor');
        }
        setLoading(false);
    };

    return (
        <main className="min-h-svh flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans px-4 py-24 sm:py-20 relative overflow-hidden transition-colors duration-300">
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

            <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden border border-slate-100 dark:border-slate-800 p-6 sm:p-10 relative z-10 transition-all duration-300">
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
                    <div aria-live="polite" className="bg-rose-50/80 border border-rose-200 text-rose-600 rounded-xl p-3.5 text-center mb-8 text-sm font-semibold tracking-wide">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2 group">
                        <label htmlFor="email" className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                            Correo Electrónico
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                id="email"
                                name="email"
                                autoComplete="username"
                                required
                                placeholder="tu@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white text-slate-800 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label htmlFor="password" className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                autoComplete="current-password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-5 pr-14 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white text-slate-800 transition-all shadow-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((visible) => !visible)}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                aria-pressed={showPassword}
                                aria-controls="password"
                                className="absolute right-1 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                            >
                                {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || remainingSeconds > 0}
                            aria-disabled={loading || remainingSeconds > 0}
                            className={`w-full text-white font-semibold rounded-xl py-4 shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 ${loading || remainingSeconds > 0 ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]'}`}
                        >
                            {loading
                                ? 'Ingresando...'
                                : remainingSeconds > 0
                                    ? `Intenta de nuevo en ${formatRemainingTime(remainingSeconds)}`
                                    : 'Iniciar Sesión'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
