import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { PropertyGallery } from "@/app/components/PropertyGallery";
import { getProperty, propertyDescription, propertyImages, propertyPath, propertyPhotos, propertyTitle, SITE_URL, TYPE_NAMES } from "@/lib/properties";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

function propertyId(value: string): number | null {
  const match = value.match(/(?:^|-)(\d+)$/);
  return match ? Number(match[1]) : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const numericId = propertyId(id);
  const property = numericId ? await getProperty(numericId) : null;
  if (!property) return { title: "Inmueble no disponible", robots: { index: false, follow: true } };

  const title = propertyTitle(property);
  const description = propertyDescription(property);
  const canonical = propertyPath(property);
  const images = propertyImages(property);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", locale: "es_CO", url: canonical, title: `${title} | Casas y Soluciones`, description, siteName: "Casas y Soluciones", images: images[0] ? [{ url: images[0], alt: title }] : undefined },
    twitter: { card: images[0] ? "summary_large_image" : "summary", title: `${title} | Casas y Soluciones`, description, images: images[0] ? [images[0]] : undefined },
  };
}

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default async function PropertyDetail({ params }: PageProps) {
  const { id } = await params;
  const numericId = propertyId(id);
  if (!numericId) notFound();
  const property = await getProperty(numericId);
  if (!property) notFound();
  const canonicalPath = propertyPath(property);
  if (`/inmuebles/${id}` !== canonicalPath) permanentRedirect(canonicalPath);

  const title = propertyTitle(property);
  const description = propertyDescription(property);
  const images = propertyImages(property);
  const photos = propertyPhotos(property);
  const features = [
    property.rooms != null ? ["Habitaciones", property.rooms] : null,
    property.bathrooms != null ? ["Baños", property.bathrooms] : null,
    property.living_rooms != null ? ["Salas", property.living_rooms] : null,
    property.kitchens != null ? ["Cocinas", property.kitchens] : null,
    property.garages != null ? ["Garajes", property.garages] : null,
  ].filter(Boolean) as [string, number][];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: title,
    description,
    url: `${SITE_URL}${canonicalPath}`,
    image: images,
    datePosted: property.created_at,
    dateModified: property.updated_at,
    offers: { "@type": "Offer", price: Number(property.price), priceCurrency: "COP", availability: "https://schema.org/InStock", url: `${SITE_URL}${canonicalPath}` },
    about: {
      "@type": property.type === "HOUSE" ? "House" : property.type === "APARTMENT" ? "Apartment" : "Place",
      name: title,
      address: { "@type": "PostalAddress", streetAddress: property.address, addressLocality: property.city || undefined, addressRegion: "Norte de Santander", addressCountry: "CO" },
      numberOfRooms: property.rooms || undefined,
    },
  };

  return (
    <main className="min-h-screen bg-rose-50/30 pb-20 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="border-b border-rose-100 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"><div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8"><Link href="/" className="font-medium text-slate-600 hover:text-rose-600 dark:text-slate-300">← Volver al inicio</Link></div></header>
      <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Migas de pan" className="mb-4 text-sm text-slate-500"><ol className="flex flex-wrap gap-2"><li><Link href="/" className="hover:text-rose-600">Inicio</Link></li><li aria-hidden="true">/</li><li aria-current="page" className="line-clamp-1">{property.code}</li></ol></nav>
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <PropertyGallery images={photos} title={title} />
          <div className="p-6 sm:p-10">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
              <div><p className="text-xs font-bold uppercase tracking-widest text-rose-600">{TYPE_NAMES[property.type]} en arriendo · {property.code}</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{title}</h1><p className="mt-3 text-slate-600 dark:text-slate-300">{property.address}{property.building_name ? ` · ${property.building_name}` : ""}{property.unit_label ? ` · ${property.unit_label}` : ""}</p></div>
              <div className="shrink-0 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Canon mensual</span><p className="mt-1 text-3xl font-black text-rose-600">{money.format(Number(property.price))}</p>{property.in_complex && <p className="mt-1 text-xs text-slate-500">Administración {property.admin_included ? "incluida" : property.admin_value ? money.format(Number(property.admin_value)) : "por consultar"}</p>}</div>
            </div>

            {features.length > 0 && <section aria-labelledby="caracteristicas" className="mt-10"><h2 id="caracteristicas" className="text-2xl font-bold">Características del inmueble</h2><dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{features.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 p-4 text-center dark:border-slate-700"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-2xl font-bold">{value}</dd></div>)}</dl></section>}

            <section aria-labelledby="descripcion" className="mt-10"><h2 id="descripcion" className="text-2xl font-bold">Descripción</h2><p className="mt-4 whitespace-pre-line leading-7 text-slate-600 dark:text-slate-300">{property.description?.trim() || description}</p></section>
            <section aria-labelledby="ubicacion" className="mt-10"><h2 id="ubicacion" className="text-2xl font-bold">Ubicación</h2><p className="mt-4 text-slate-600 dark:text-slate-300">{property.address}{property.city ? `, ${property.city}` : ", Norte de Santander"}</p></section>
          </div>
        </article>
      </div>
    </main>
  );
}
