export const apiCall = async (url: string, options?: RequestInit) => {

    const baseUrl = window.location.origin;
    // https://localhost:7263

    const fullUrl = `${baseUrl}${url}`;

    console.log("API URL:", fullUrl);

    try {
        const res = await fetch(fullUrl, {
            headers: {
                "Content-Type": "application/json"
            },
            ...options
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        return await res.json();

    } catch (err) {
        console.error("API Error:", err);
        throw err;
    }
};