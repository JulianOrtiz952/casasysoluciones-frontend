type Location = { address?: string | null; city?: string | null; google_maps_link?: string | null };

function mapsUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    const googleHost = /^(?:(?:www|maps)\.)?google\.(?:com|com\.co|es)$/.test(url.hostname);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password || url.port) return null;
    if (!googleHost && url.hostname !== "maps.app.goo.gl" && !(url.hostname === "goo.gl" && url.pathname.startsWith("/maps/"))) return null;
    url.protocol = "https:";
    return url;
  } catch {
    return null;
  }
}

function embedUrl(url: URL): string | null {
  if (url.pathname.startsWith("/maps/embed")) return url.href;
  const coordinates = decodeURIComponent(url.href).match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  const query = coordinates ? `${coordinates[1]},${coordinates[2]}` : url.searchParams.get("query") || url.searchParams.get("q") || url.searchParams.get("destination");
  const place = url.pathname.match(/\/maps\/place\/([^/]+)/)?.[1];
  const cid = url.searchParams.get("cid");
  if (cid && /^\d+$/.test(cid)) return `https://maps.google.com/maps?cid=${cid}&output=embed`;
  const target = query || (place ? decodeURIComponent(place.replace(/\+/g, " ")) : null);
  return target ? `https://maps.google.com/maps?q=${encodeURIComponent(target)}&z=15&output=embed` : null;
}

export async function propertyMap(property: Location, request: typeof fetch = fetch) {
  const link = mapsUrl(property.google_maps_link?.trim() || "");
  if (link) {
    let current: URL | null = link;
    // Resolve shared short links on the server; never follow redirects outside Maps.
    const signal = AbortSignal.timeout(4000);
    try {
      for (let hop = 0; current && hop < 5; hop++) {
        const embed = embedUrl(current);
        if (embed) return { embed, link: link.href };
        const response = await request(current.href, { redirect: "manual", signal });
        const redirect = response.headers.get("location");
        await response.body?.cancel();
        if (response.status < 300 || response.status >= 400 || !redirect) break;
        current = mapsUrl(new URL(redirect, current).href);
      }
    } catch {
      // Keep the exact shared link usable if Google cannot resolve it right now.
    }
    return { embed: null, link: link.href };
  }
  const address = property.address?.trim();
  if (!address || /^(?:Google Maps|Ver enlace de Google Maps adjunto|Ubicación por confirmar(?:\s*\(.*\))?)$/i.test(address)) return { embed: null, link: null };
  const query = [address, property.city?.trim() || "Norte de Santander", "Colombia"].join(", ");
  return { embed: `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`, link: null };
}
