export const apiCall = async (url: string, options?: RequestInit) => {
    // 1. Current URL se subroot nikalne ka sabse simple tarika
    const path = window.location.pathname;
    const subroot = path.split('/')[1];

    // Agar subroot 'api' hai ya khali hai, toh root maano, nahi toh subroot use karo
    const prefix = (subroot && subroot !== 'api' && !subroot.includes('.'))
        ? `/${subroot}`
        : '';

    // 2. URL ko join karein
    const fullUrl = `${prefix}${url.startsWith('/') ? url : '/' + url}`;

    console.log("Final Testing URL:", fullUrl);

    try {
        const res = await fetch(fullUrl, {
            headers: { "Content-Type": "application/json" },
            ...options
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("API Error:", err);
        throw err;
    }
};