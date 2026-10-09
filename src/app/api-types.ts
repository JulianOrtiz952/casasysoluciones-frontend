export interface PropertyImage {
    id: number;
    image: string;
    is_cover: boolean;
}

export interface TenantSummary {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    document_number?: string;
    public_code?: string;
}

export interface RentalHistory {
    id: number;
    inmueble: number;
    esta_activo: boolean;
}

export interface InventoryPhoto {
    id: number;
    image_url: string;
    thumbnail_url?: string | null;
    description?: string | null;
}

export interface InventorySpace {
    id?: number;
    space_name: string;
    condition: 'GOOD' | 'REGULAR' | 'BAD';
    condition_display?: string;
    observations: string | null;
    quantity?: number;
    photos?: InventoryPhoto[];
}

export function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message || fallback : fallback;
}

export interface Paginated<T> {
    results: T[];
    count: number;
}

export function listResults<T>(data: T[] | Paginated<T>): T[] {
    return Array.isArray(data) ? data : data.results || [];
}

export async function fetchApiJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json() as Promise<T>;
}
