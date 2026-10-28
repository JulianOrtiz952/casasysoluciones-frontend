export function propertyAddress(value?: string | null): string {
  const address = value?.trim() || "";
  return /^(?:Google Maps|Ver enlace de Google Maps adjunto|Ubicación por confirmar(?:\s*\(.*\))?)$/i.test(address) ? "" : address;
}
