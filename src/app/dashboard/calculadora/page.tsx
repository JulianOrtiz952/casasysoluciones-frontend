'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CalculadoraArriendos() {
    const [modo, setModo] = useState<'normal' | 'inverso'>('normal');
    const [monto, setMonto] = useState<number | ''>(1000000);
    const [aplicaAseguradora, setAplicaAseguradora] = useState<boolean>(false);
    const [aplicaIvaArrendatario, setAplicaIvaArrendatario] = useState<boolean>(false);

    const montoNumber = typeof monto === 'number' ? monto : 0;

    // Calcular factor de descuentos (10% + 1.9% IVA = 11.9% fijo) y aseguradora si aplica
    const factorDescuento = 0.119 + (aplicaAseguradora ? 0.0238 : 0);
    const factorRemanente = 1 - factorDescuento;

    // Si modo 'normal', la base es el monto. Si 'inverso', calculamos qué base da el neto objetivo.
    const baseNumber = modo === 'normal' ? montoNumber : Math.round(montoNumber / factorRemanente);

    // Obligatorios ("siempre") fijos sobre la base (redondeados para consistencia visual)
    const valFijo10 = Math.round(baseNumber * 0.10);
    const valIVAFijo19 = Math.round(valFijo10 * 0.19); // IVA 19% del 10% fijo

    // Aseguradora (Opcional)
    const valAseguradora = aplicaAseguradora ? Math.round(baseNumber * 0.02) : 0;
    const valIVAAseguradora = aplicaAseguradora ? Math.round(valAseguradora * 0.19) : 0; // IVA 19% del 2%

    // IVA Arrendatario (Responsabilidad del Inquilino)
    const valIvaArrendatario = aplicaIvaArrendatario ? Math.round(baseNumber * 0.19) : 0;

    // Totales: Se descuenta todo de la base y se suma el IVA que el inquilino paga y va al propietario
    const netoPropietarioSinIva = baseNumber - valFijo10 - valIVAFijo19 - valAseguradora - valIVAAseguradora;
    const netoPropietario = netoPropietarioSinIva + valIvaArrendatario;

    const totalInquilinoSinIva = baseNumber;
    const totalInquilino = totalInquilinoSinIva + valIvaArrendatario;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center space-x-4 mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Calculadora de Arriendos</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Cotizador rápido para el valor de administración y arriendo.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Controles */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium text-xs sm:text-sm shadow-inner">
                        <button
                            onClick={() => setModo('normal')}
                            className={`flex-1 py-2 sm:py-2.5 rounded-lg transition-all ${modo === 'normal' ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Calcular Neto
                        </button>
                        <button
                            onClick={() => setModo('inverso')}
                            className={`flex-1 py-2 sm:py-2.5 rounded-lg transition-all ${modo === 'inverso' ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Calcular Cobro
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                            {modo === 'normal' ? 'Valor a cobrar al Inquilino' : 'Neto Deseado por el Propietario'}
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                            <input
                                type="number"
                                value={monto}
                                onChange={(e) => setMonto(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-rose-400 dark:text-white transition-all text-lg font-bold"
                                placeholder="1000000"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                        <label className="flex items-center space-x-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={aplicaIvaArrendatario}
                                onChange={(e) => setAplicaIvaArrendatario(e.target.checked)}
                                className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500 cursor-pointer"
                            />
                            <span className="text-slate-700 dark:text-slate-300 font-medium select-none group-hover:text-rose-500 transition">¿El arrendatario es responsable de IVA (19%)?</span>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer group mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={aplicaAseguradora}
                                    onChange={(e) => setAplicaAseguradora(e.target.checked)}
                                />
                                <div className={`block w-14 h-8 rounded-full transition ${aplicaAseguradora ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${aplicaAseguradora ? 'translate-x-6' : ''}`}></div>
                            </div>
                            <span className="text-slate-700 dark:text-slate-300 font-medium select-none group-hover:text-rose-500 transition">¿Aplica servicio de aseguradora?</span>
                        </label>
                    </div>
                </div>

                {/* Resultados */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Desglose del Arriendo</h3>

                    <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                                {modo === 'normal' ? 'Valor Base' : 'Neto Deseado'}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-white">
                                ${modo === 'normal' ? baseNumber.toLocaleString() : netoPropietarioSinIva.toLocaleString()}
                            </span>
                        </div>

                        {aplicaAseguradora && (
                            <>
                                <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                    <span className="text-amber-600 dark:text-amber-400 font-medium">{modo === 'normal' ? '-' : '+'} Aseguradora (2%)</span>
                                    <span className="font-bold text-amber-600 dark:text-amber-400">{modo === 'normal' ? '-' : '+'}${valAseguradora.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                    <span className="text-amber-600 dark:text-amber-400 font-medium">{modo === 'normal' ? '-' : '+'} IVA Aseguradora (19%)</span>
                                    <span className="font-bold text-amber-600 dark:text-amber-400">{modo === 'normal' ? '-' : '+'}${valIVAAseguradora.toLocaleString()}</span>
                                </div>
                            </>
                        )}

                        <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                            <span className="text-amber-600 dark:text-amber-400 font-medium">{modo === 'normal' ? '-' : '+'} Deducción Fija (10%)</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">{modo === 'normal' ? '-' : '+'}${valFijo10.toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                            <span className="text-amber-600 dark:text-amber-400 font-medium">{modo === 'normal' ? '-' : '+'} IVA de la Deducción Fija (19%)</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">{modo === 'normal' ? '-' : '+'}${valIVAFijo19.toLocaleString()}</span>
                        </div>

                        {aplicaIvaArrendatario && (
                            <div className="flex justify-between items-center bg-sky-50 dark:bg-sky-900/10 p-3 rounded-lg border border-sky-100 dark:border-sky-900/30 mt-4">
                                <span className="text-sky-600 dark:text-sky-400 font-medium">
                                    + IVA Inquilino (19%)
                                </span>
                                <span className="font-bold text-sky-600 dark:text-sky-400">
                                    +${valIvaArrendatario.toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
                        {aplicaIvaArrendatario && (
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="block text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                                        {modo === 'normal' ? 'Total Neto a Recibir (Sin IVA)' : 'Total a Cobrar al Inquilino (Sin IVA)'}
                                    </span>
                                    <span className="text-slate-400 dark:text-slate-500 text-sm">
                                        {modo === 'normal' ? 'Base - Descuentos' : 'Neto + Gastos'}
                                    </span>
                                </div>
                                <span className={`text-3xl font-black ${modo === 'normal' && netoPropietarioSinIva < 0 ? 'text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                    ${modo === 'normal' ? netoPropietarioSinIva.toLocaleString() : totalInquilinoSinIva.toLocaleString()}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-end">
                            <div>
                                <span className="block text-xs uppercase font-bold text-rose-500 tracking-wider">
                                    {modo === 'normal' ? 'Total Neto a Recibir' : 'Total a Cobrar al Inquilino'}
                                    {aplicaIvaArrendatario && <span className="text-rose-400 ml-1">(Con IVA)</span>}
                                </span>
                                <span className="text-slate-500 text-sm">
                                    {modo === 'normal' ? `Base - Descuentos${aplicaIvaArrendatario ? ' + IVA' : ''}` : `Neto + Gastos${aplicaIvaArrendatario ? ' + IVA' : ''}`}
                                </span>
                            </div>
                            <span className={`text-3xl font-black ${modo === 'normal' && netoPropietario < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                                ${modo === 'normal' ? netoPropietario.toLocaleString() : totalInquilino.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
