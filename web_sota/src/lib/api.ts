const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "http://127.0.0.1:11052";

export { API_BASE };
export default API_BASE;
