import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PropertyCard } from "./components/PropertyCard";
import { categoryPath, getProperties, propertyPath, SITE_URL, TYPE_PLURALS, type Property } from "@/lib/properties";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inmuebles en arriendo en Cúcuta y Norte de Santander",
  description: "Consulta casas, apartamentos, locales y bodegas disponibles en arriendo en Cúcuta y municipios de Norte de Santander.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "es_CO", url: "/", title: "Inmuebles en arriendo | Casas y Soluciones", description: "Encuentra inmuebles disponibles en arriendo en Cúcuta y Norte de Santander.", siteName: "Casas y Soluciones" },
  twitter: { card: "summary_large_image", title: "Inmuebles en arriendo | Casas y Soluciones", description: "Encuentra inmuebles disponibles en arriendo en Cúcuta y Norte de Santander." },
};

function categoryLinks(properties: Property[]) {
  const groups = new Map<string, { city: string; type: Property["type"]; count: number }>();
  for (const property of properties) {
    const city = property.city?.trim();
    if (!city) continue;
    const key = `${city.toLocaleLowerCase("es-CO")}:${property.type}`;
    const current = groups.get(key);
    groups.set(key, { city, type: property.type, count: (current?.count || 0) + 1 });
  }
  return [...groups.values()].filter((group) => group.count >= 2);
}

export default async function Home() {
  const properties = await getProperties();
  const categories = categoryLinks(properties);
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Inmuebles disponibles en arriendo",
    numberOfItems: properties.length,
    itemListElement: properties.map((property, index) => ({ "@type": "ListItem", position: index + 1, url: `${SITE_URL}${propertyPath(property)}` })),
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replace(/</g, "\\u003c") }} />
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Casas y Soluciones, inicio" className="flex min-w-0 items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-rose-500">
            <Image width={781} height={301} src="/logo.jpeg" alt="" priority sizes="160px" className="h-10 w-auto rounded-md border border-slate-100 bg-white p-1 shadow-sm" />
            <div><span className="block text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">Casas<span className="text-rose-600">y</span>Soluciones</span><span className="hidden text-xs text-slate-500 sm:block">Inmuebles en Norte de Santander</span></div>
          </Link>
          <nav aria-label="Navegación principal"><a href="#catalogo" className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold hover:border-rose-300 hover:text-rose-600 dark:border-slate-700">Ver inmuebles</a></nav>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 pb-28 pt-24 text-center sm:pb-32">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-rose-100/50 blur-3xl" />
        <div className="relative mx-auto max-w-4xl">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white md:text-6xl">Inmuebles en arriendo en <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Cúcuta y Norte de Santander</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300 md:text-xl">Consulta propiedades disponibles con fotografías, características y precios actualizados por Casas y Soluciones.</p>
        </div>
      </section>

      <section id="catalogo" aria-labelledby="catalogo-title" className="mx-auto -mt-12 max-w-7xl scroll-mt-24 px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-8"><h2 id="catalogo-title" className="text-2xl font-bold text-slate-900 dark:text-white">Propiedades disponibles</h2><p className="mt-2 text-slate-600 dark:text-slate-400">{properties.length ? `${properties.length} ${properties.length === 1 ? "inmueble disponible" : "inmuebles disponibles"}.` : "El catálogo se está actualizando."}</p></div>
        {properties.length ? <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">{properties.map((property, index) => <PropertyCard key={property.id} property={property} priority={index < 3} />)}</div> : <div className="rounded-2xl border border-rose-50 bg-white/80 p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900/80"><h2 className="text-2xl font-bold">Próximamente más oportunidades</h2><p className="mt-2 text-slate-500">No hay propiedades disponibles públicamente en este momento.</p></div>}
      </section>

      {categories.length > 0 && <section aria-labelledby="zonas-title" className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><h2 id="zonas-title" className="text-2xl font-bold">Explora por zona y tipo</h2><div className="mt-5 flex flex-wrap gap-3">{categories.map((category) => <Link key={`${category.city}-${category.type}`} href={categoryPath(category.city, category.type)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold hover:border-rose-400 hover:text-rose-600 dark:border-slate-700">{TYPE_PLURALS[category.type]} en arriendo en {category.city} ({category.count})</Link>)}</div></div></section>}

      <footer className="border-t border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/70"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><div><p className="text-sm font-semibold">Casas y Soluciones</p><p className="mt-1 text-xs text-slate-500">Gestión y oferta inmobiliaria en Norte de Santander.</p></div><Link href="/login" rel="nofollow" className="text-xs text-slate-500 hover:underline">Acceso al equipo</Link></div></footer>
    </main>
  );
}
