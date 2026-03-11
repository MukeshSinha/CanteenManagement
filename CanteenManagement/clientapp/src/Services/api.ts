export const apiCall = async (url: string, options?: RequestInit) => {
    
    const base = document.querySelector("base")?.getAttribute("href") || "/";

    // Final URL
    const fullUrl = `${base}${url}`.replace(/\/\//g, '/'); 

    console.log(`Making API call to: ${fullUrl}`);

    const res = await fetch(fullUrl, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });

    console.log(`Received response:`, res);

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
};