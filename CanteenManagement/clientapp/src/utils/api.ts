// src/utils/api.ts   (ya jahan tumhare API calls define hain)

function getApiBase(): string {
    const pathname = window.location.pathname;

    // pathname ko clean parts mein tod do (empty strings hata do)
    const parts = pathname.split('/').filter(part => part.length > 0);

    // Agar koi sub-directory hai (pehla part folder name hai)
    if (parts.length > 0) {
        const firstPart = parts[0];

        // Yeh check karte hain ki pehla part '/api' jaisa API path to nahi hai
        // (agar pathname mein '/api/' already shuru se hai to prepend mat karo)
        if (!pathname.toLowerCase().startsWith('/api/')) {
            return `/${firstPart}/api`;
        }
    }

    // Root pe ya agar pehla part already API related lag raha hai
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