import type { MetadataRoute } from "next";
import { categoryPath, getProperties, imageUrl, propertyPath, SITE_URL, slugify, type Property } from "@/lib/properties";

export const dynamic = "force-dynamic";

function stableImageUrl(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const url = imageUrl(value);
  try {
    const parsed = new URL(url);
    const isTemporary = parsed.searchParams.has("X-Amz-Signature") || parsed.searchParams.has("X-Amz-Expires");
    const isPublicHttps = parsed.protocol === "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1";
    return isTemporary || !isPublicHttps ? undefined : [url];
  } catch {
    return undefined;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getProperties();
  const routes: MetadataRoute.Sitemap = [{ url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 }];
  for (const property of properties) {
    routes.push({ url: `${SITE_URL}${propertyPath(property)}`, lastModified: new Date(property.updated_at), changeFrequency: "weekly", priority: 0.8, images: stableImageUrl(property.cover_image) });
  }

  const groups = new Map<string, { city: string; type: Property["type"]; count: number; updated: string }>();
  for (const property of properties) {
    if (!property.city?.trim()) continue;
    const key = `${slugify(property.city)}:${property.type}`;
    const current = groups.get(key);
    groups.set(key, { city: property.city, type: property.type, count: (current?.count || 0) + 1, updated: current && current.updated > property.updated_at ? current.updated : property.updated_at });
  }
  for (const group of groups.values()) {
    if (group.count < 2) continue;
    routes.push({ url: `${SITE_URL}${categoryPath(group.city, group.type)}`, lastModified: new Date(group.updated), changeFrequency: "weekly", priority: 0.7 });
  }
  return routes;
}
