import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PropertyCard } from "./components/PropertyCard";
import { categoryPath, getProperties, propertyPath, SITE_URL, TYPE_PLURALS, type Property } from "@/lib/properties";

export const dynamic = "force-dynamic";

const HOME_TITLE = "Arriendos en Cúcuta y Norte de Santander | Casas y Soluciones";
const HOME_DESCRIPTION =
  "Encuentra casas, apartamentos, locales y bodegas en arriendo en Cúcuta y Norte de Santander. Consulta precios, ubicaciones y fotografías actualizadas.";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "/",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    siteName: "Casas y Soluciones",
    images: [{ url: "/logo.jpeg", width: 781, height: 301, alt: "Casas y Soluciones" }],
  },
  twitter: { card: "summary_large_image", title: HOME_TITLE, description: HOME_DESCRIPTION, images: ["/logo.jpeg"] },
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
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-center px-4 py-2.5 sm:min-h-20 sm:justify-start sm:px-6 sm:py-3 lg:justify-between lg:px-8">
          <Link href="/" aria-label="Casas y Soluciones, inicio" className="group flex max-w-full min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 sm:gap-3">
            <Image width={781} height={301} src="/logo.jpeg" alt="" priority sizes="(max-width: 640px) 94px, 114px" className="h-9 w-auto shrink-0 rounded-lg border border-slate-100 bg-white p-1 shadow-sm transition-shadow group-hover:shadow-md sm:h-11" />
            <div className="min-w-0 leading-tight">
              <span className="block truncate text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">Casas<span className="text-rose-600">y</span>Soluciones</span>
              <span className="mt-0.5 block truncate text-[10px] font-medium text-slate-500 sm:text-xs">Inmuebles en Norte de Santander</span>
            </div>
          </Link>
          <div className="hidden items-center gap-3 border-l border-slate-200 pl-5 dark:border-slate-700 lg:flex" aria-label="Cobertura inmobiliaria">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 ring-1 ring-rose-100 dark:bg-rose-950/40 dark:ring-rose-900/60" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]" />
            </span>
            <div className="text-right leading-tight">
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-rose-600">Propiedades en arriendo</span>
              <span className="mt-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Cúcuta · Norte de Santander</span>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 pb-28 pt-24 text-center sm:pb-32">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-rose-100/50 blur-3xl" />
        <div className="relative mx-auto max-w-4xl">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white md:text-6xl">Inmuebles en arriendo en <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Cúcuta y Norte de Santander</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300 md:text-xl">Consulta propiedades disponibles con fotografías, características y precios actualizados por Casas y Soluciones.</p>
        </div>
      </section>

      <section aria-labelledby="properties-title" className="mx-auto -mt-12 max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-8"><h2 id="properties-title" className="text-2xl font-bold text-slate-900 dark:text-white">Propiedades disponibles</h2><p className="mt-2 text-slate-600 dark:text-slate-400">{properties.length ? `${properties.length} ${properties.length === 1 ? "inmueble disponible" : "inmuebles disponibles"}.` : "La oferta de inmuebles se está actualizando."}</p></div>
        {properties.length ? <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">{properties.map((property, index) => <PropertyCard key={property.id} property={property} priority={index < 3} />)}</div> : <div className="rounded-2xl border border-rose-50 bg-white/80 p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900/80"><h2 className="text-2xl font-bold">Próximamente más oportunidades</h2><p className="mt-2 text-slate-500">No hay propiedades disponibles públicamente en este momento.</p></div>}
      </section>

      {categories.length > 0 && <section aria-labelledby="zonas-title" className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><h2 id="zonas-title" className="text-2xl font-bold">Explora por zona y tipo</h2><div className="mt-5 flex flex-wrap gap-3">{categories.map((category) => <Link key={`${category.city}-${category.type}`} href={categoryPath(category.city, category.type)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold hover:border-rose-400 hover:text-rose-600 dark:border-slate-700">{TYPE_PLURALS[category.type]} en arriendo en {category.city} ({category.count})</Link>)}</div></div></section>}

      <footer className="border-t border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/70"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><div><p className="text-sm font-semibold">Casas y Soluciones</p><p className="mt-1 text-xs text-slate-500">Gestión y oferta inmobiliaria en Norte de Santander.</p></div><Link href="/login" rel="nofollow" className="text-xs text-slate-500 hover:underline">Acceso al equipo</Link></div></footer>
    </main>
  );
}
