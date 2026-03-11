export const apiCall = async (url: string, options?: RequestInit) => {
    const base = import.meta.env.BASE_URL;

    const res = await fetch(`${base}${url}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
};