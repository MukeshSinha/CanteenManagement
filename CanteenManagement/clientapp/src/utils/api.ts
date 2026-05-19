// src/utils/api.ts   (ya jahan tumhare API calls define hain)

function getApiBase(): string {
    // 1. If the C# backend has injected the real base href (e.g. "/" or "/canteen/"), use it!
    const baseHref = (window as any).__BASE_HREF__;
    if (baseHref) {
        const cleanBase = baseHref.endsWith('/') ? baseHref : baseHref + '/';
        return cleanBase + 'api';
    }

    // 2. Fallback to extracting base path, but ignore common React routes to avoid errors
    const pathname = window.location.pathname;
    const parts = pathname.split('/').filter(part => part.length > 0);

    // List of known top-level React routes that are NOT subdirectories
    const reactRoutes = ['login', 'password', 'masters', 'reports', 'settings', 'profile'];

    if (parts.length > 0) {
        const firstPart = parts[0].toLowerCase();

        // If the first part is not an API path and not a known React route, it might be a real sub-directory (like IIS virtual dir)
        if (firstPart !== 'api' && !reactRoutes.includes(firstPart)) {
            return `/${parts[0]}/api`;
        }
    }

    // Default fallback
    return '/api';
}

export const API_BASE = getApiBase();

// Debug logs (development ke time dekhne ke liye – production mein comment out kar sakte ho)
console.log('Current pathname:', window.location.pathname);
console.log('Detected first part (subdir):', window.location.pathname.split('/')[1] || 'none (root)');
console.log('Chosen API_BASE:', API_BASE);

// Fetch helper function
export async function apiFetch(endpoint: string, options?: RequestInit) {
    const cleanEndpoint = endpoint.replace(/^\//, '');
    const fullUrl = `${API_BASE}/${cleanEndpoint}`;

    console.log('Fetching:', fullUrl);

    const response = await fetch(fullUrl, options);

    if (!response.ok) {
        console.error('API call failed:', response.status, fullUrl);
        throw new Error(`API error: ${response.status} - ${endpoint}`);
    }

    return response.json();
}