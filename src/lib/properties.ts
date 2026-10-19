export interface PropertyImage {
  id: number;
  image: string;
  thumbnail?: string | null;
  is_cover: boolean;
}

export interface PropertyPhoto {
  src: string;
  previewSrc?: string;
}

export interface Property {
  id: number;
  code: string;
  address: string;
  city: string;
  building_name: string;
  unit_label: string;
  type: "APARTMENT" | "HOUSE" | "LOCAL" | "WAREHOUSE";
  type_display: string;
  status: "AVAILABLE";
  status_display: string;
  price: string;
  rooms: number | null;
  bathrooms: number | null;
  living_rooms: number | null;
  kitchens: number | null;
  garages: number | null;
  is_commercial: boolean;
  in_complex: boolean;
  admin_included: boolean;
  admin_value: string | null;
  cover_image: string | null;
  images: PropertyImage[];
  description?: string | null;
  created_at: string;
  updated_at: string;
}

interface PaginatedProperties {
  count: number;
  next: string | null;
  results: Property[];
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://casasysoluciones.co").replace(/\/$/, "");
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
const API_TIMEOUT_MS = 5000;

export const TYPE_SLUGS: Record<Property["type"], string> = {
  APARTMENT: "apartamentos",
  HOUSE: "casas",
  LOCAL: "locales",
  WAREHOUSE: "bodegas",
};

export const TYPE_NAMES: Record<Property["type"], string> = {
  APARTMENT: "Apartamento",
  HOUSE: "Casa",
  LOCAL: "Local comercial",
  WAREHOUSE: "Bodega",
};

export const TYPE_PLURALS: Record<Property["type"], string> = {
  APARTMENT: "Apartamentos",
  HOUSE: "Casas",
  LOCAL: "Locales comerciales",
  WAREHOUSE: "Bodegas",
};

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function propertyLocation(property: Property): string {
  return property.city?.trim() || "Norte de Santander";
}

export function propertyTitle(property: Property): string {
  const type = TYPE_NAMES[property.type] || property.type_display || "Inmueble";
  const rooms = property.rooms && !property.is_commercial
    ? ` de ${property.rooms} ${property.rooms === 1 ? "habitación" : "habitaciones"}`
    : "";
  return `${type}${rooms} en arriendo en ${propertyLocation(property)}`;
}

export function propertySlug(property: Property): string {
  const location = property.city || property.building_name || property.address;
  return `${slugify(TYPE_NAMES[property.type] || "inmueble")}-en-arriendo-${slugify(location)}-${property.id}`;
}

export function propertyPath(property: Property): string {
  return `/inmuebles/${propertySlug(property)}`;
}

export function categoryPath(city: string, type: Property["type"]): string {
  return `/arriendos/${slugify(city)}/${TYPE_SLUGS[type]}`;
}

export function imageUrl(value: string | null | undefined): string {
  if (!value) return "";
  if (/^https?:\/\//.test(value)) return value;
  return `${API_URL}${value.startsWith("/") ? "" : "/"}${value}`;
}

export function propertyPhotos(property: Property): PropertyPhoto[] {
  if (property.images?.length) {
    return [...property.images]
      .sort((a, b) => Number(b.is_cover) - Number(a.is_cover))
      .map((image) => ({
        src: imageUrl(image.image),
        previewSrc: image.thumbnail ? imageUrl(image.thumbnail) : undefined,
      }));
  }
  return property.cover_image ? [{ src: imageUrl(property.cover_image) }] : [];
}

export function propertyImages(property: Property): string[] {
  return propertyPhotos(property).map((photo) => photo.src);
}

export function propertyDescription(property: Property): string {
  const details = [
    property.rooms ? `${property.rooms} ${property.rooms === 1 ? "habitación" : "habitaciones"}` : null,
    property.bathrooms ? `${property.bathrooms} ${property.bathrooms === 1 ? "baño" : "baños"}` : null,
    property.garages ? `${property.garages} ${property.garages === 1 ? "garaje" : "garajes"}` : null,
  ].filter(Boolean);
  const realDescription = property.description?.replace(/\s+/g, " ").trim();
  const fallback = `${propertyTitle(property)}${details.length ? ` con ${details.join(", ")}` : ""}. Consulta sus características, fotografías y precio.`;
  return (realDescription || fallback).slice(0, 160);
}

function publicPropertiesUrl(params?: URLSearchParams): string {
  const query = params?.toString();
  return `${API_URL}/api/v1/properties/${query ? `?${query}` : ""}`;
}

export async function getProperty(id: number): Promise<Property | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  try {
    const response = await fetch(`${API_URL}/api/v1/properties/${id}/`, {
      cache: "no-store",
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    if (response.status === 404 || response.status === 403) {
      const publicProperties = await getProperties();
      return publicProperties.find((property) => property.id === id) || null;
    }
    if (!response.ok) throw new Error(`Property API returned ${response.status}`);
    return (await response.json()) as Property;
  } catch (error) {
    console.error("No fue posible consultar el inmueble público", error);
    const publicProperties = await getProperties();
    return publicProperties.find((property) => property.id === id) || null;
  }
}

export async function getProperties(filters: { city?: string; type?: Property["type"] } = {}): Promise<Property[]> {
  const params = new URLSearchParams({ page_size: "100" });
  if (filters.city) params.set("city", filters.city);
  if (filters.type) params.set("type", filters.type);

  try {
    const properties: Property[] = [];
    let nextUrl: string | null = publicPropertiesUrl(params);
    const configuredApi = new URL(API_URL);
    while (nextUrl) {
      const target: URL = new URL(nextUrl, API_URL);
      if (target.hostname !== configuredApi.hostname) throw new Error("Property API pagination returned an unexpected host");
      target.protocol = configuredApi.protocol;
      target.port = configuredApi.port;
      const response: Response = await fetch(target, {
        cache: "no-store",
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`Property API returned ${response.status}`);
      const data = (await response.json()) as PaginatedProperties | Property[];
      if (Array.isArray(data)) return [...properties, ...data];
      properties.push(...data.results);
      nextUrl = data.next;
    }
    return properties;
  } catch (error) {
    console.error("No fue posible consultar el catálogo público", error);
    return [];
  }
}

export function typeFromSlug(slug: string): Property["type"] | null {
  const entry = Object.entries(TYPE_SLUGS).find(([, value]) => value === slug);
  return (entry?.[0] as Property["type"] | undefined) || null;
}
