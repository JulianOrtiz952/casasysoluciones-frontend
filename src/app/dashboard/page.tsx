export default function DashboardSummary() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Resumen General</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Monitorea el estado de tus propiedades e inquilinos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1 */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition">
                    <div className="w-14 h-14 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Inmuebles</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">12</p>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Disponibles</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">4</p>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition">
                    <div className="w-14 h-14 bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inquilinos Activos</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">8</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
