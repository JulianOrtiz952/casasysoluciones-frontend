import Link from "next/link";

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center dark:bg-slate-950"><div><p className="text-sm font-bold uppercase tracking-widest text-rose-600">Error 404</p><h1 className="mt-3 text-4xl font-extrabold text-slate-900 dark:text-white">Esta página no está disponible</h1><p className="mx-auto mt-4 max-w-lg text-slate-600 dark:text-slate-300">El inmueble pudo haber sido arrendado, retirado del catálogo o la dirección ya no existe.</p><Link href="/" className="mt-8 inline-flex min-h-11 items-center rounded-full bg-slate-900 px-6 font-semibold text-white hover:bg-rose-600">Ver inmuebles disponibles</Link></div></main>;
}
