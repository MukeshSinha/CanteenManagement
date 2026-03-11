export const apiCall = async (url: string, options?: RequestInit) => {
    const base = import.meta.env.BASE_URL;
    console.log(`Making API call to: ${base}${url}`);

    const res = await fetch(`${base}${url}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    console.log(`Received response:${res}`);

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
};