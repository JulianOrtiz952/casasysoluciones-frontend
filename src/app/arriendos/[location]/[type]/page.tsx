import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyCard } from "@/app/components/PropertyCard";
import { categoryPath, getProperties, propertyPath, SITE_URL, slugify, typeFromSlug, TYPE_PLURALS } from "@/lib/properties";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ location: string; type: string }> };

async function categoryData(params: PageProps["params"]) {
  const { location, type } = await params;
  const propertyType = typeFromSlug(type);
  if (!propertyType) return null;
  const all = await getProperties();
  const properties = all.filter((property) => property.type === propertyType && slugify(property.city) === location);
  if (properties.length < 2) return null;
  return { properties, propertyType, city: properties[0].city };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await categoryData(params);
  if (!data) return { title: "Inmuebles no disponibles", robots: { index: false, follow: true } };
  const plural = TYPE_PLURALS[data.propertyType];
  const title = `${plural} en arriendo en ${data.city}`;
  const description = `Consulta ${plural.toLocaleLowerCase("es-CO")} disponibles en arriendo en ${data.city}, Norte de Santander. Fotografías, características y precios actualizados.`;
  const canonical = categoryPath(data.city, data.propertyType);
  return { title, description, alternates: { canonical }, openGraph: { type: "website", locale: "es_CO", url: canonical, title: `${title} | Casas y Soluciones`, description, siteName: "Casas y Soluciones" }, twitter: { card: "summary", title, description } };
}

export default async function CategoryPage({ params }: PageProps) {
  const data = await categoryData(params);
  if (!data) notFound();
  const plural = TYPE_PLURALS[data.propertyType];
  const title = `${plural} en arriendo en ${data.city}`;
  const canonical = categoryPath(data.city, data.propertyType);
  const jsonLd = { "@context": "https://schema.org", "@type": "CollectionPage", name: title, url: `${SITE_URL}${canonical}`, mainEntity: { "@type": "ItemList", numberOfItems: data.properties.length, itemListElement: data.properties.map((property, index) => ({ "@type": "ListItem", position: index + 1, url: `${SITE_URL}${propertyPath(property)}` })) } };

  return <main className="min-h-screen bg-slate-50 pb-20 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8"><Link href="/" className="font-semibold hover:text-rose-600">Casas y Soluciones</Link></div></header>
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Migas de pan" className="text-sm text-slate-500"><Link href="/" className="hover:text-rose-600">Inicio</Link> <span aria-hidden="true">/</span> <span aria-current="page">{title}</span></nav>
      <h1 className="mt-6 text-4xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-4 max-w-3xl text-lg text-slate-600 dark:text-slate-300">Explora {data.properties.length} propiedades disponibles, con información real de precio, ubicación, características y fotografías.</p>
      <section aria-labelledby="resultados" className="mt-10"><h2 id="resultados" className="mb-6 text-2xl font-bold">Inmuebles disponibles</h2><div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{data.properties.map((property, index) => <PropertyCard key={property.id} property={property} priority={index < 3} />)}</div></section>
    </div>
  </main>;
}
