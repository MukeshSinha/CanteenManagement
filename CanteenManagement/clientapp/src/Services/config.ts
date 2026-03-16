declare global {
    interface Window {
        __BASE_HREF__?: string;
    }
}

const baseHref = (window.__BASE_HREF__ || '/').replace(/\/$/, '');

export const API_BASE_URL = baseHref;