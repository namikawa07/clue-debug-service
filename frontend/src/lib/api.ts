import { API_URL } from "@/config";
/**
 * API Client for fetching from FastAPI Backend with automatic JWT injection.
 */


let tokenCache: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Fetches one-time JWT from Next.js Auth Bridge and exchanges it for a FastAPI JWT
 */
async function fetchToken() {
    const isServer = typeof window === 'undefined';

    // On the server (SSR), we cannot reliably use the Auth Bridge because relative fetches hang
    // and we cannot import server-only cookies/headers here as this file is used in client bundles.
    if (isServer) {
        return null;
    }

    if (tokenCache && tokenExpiry && Date.now() < tokenExpiry) {
        return tokenCache;
    }

    try {
        let supabaseToken: string | null = null;
        let user_id: string | null = null;

        // Client-side: Fetch Supabase JWT from /api/auth/jwt bridge
        console.log("[AuthBridge] Client: Fetching session from /api/auth/jwt...");
        const response = await fetch("/api/auth/jwt");
        if (!response.ok) {
            const errorText = await response.text();
            console.error("[AuthBridge] JWT Bridge failed:", response.status, errorText);
            throw new Error(`Auth Bridge error: ${response.status}`);
        }
        const data = await response.json();
        supabaseToken = data.jwt;
        user_id = data.user_id;
        console.log(`[AuthBridge] Client: Received JWT for ${user_id}`);

        if (!supabaseToken) {
            throw new Error("No token returned from Auth Bridge");
        }

        // 2. Exchange Supabase JWT for FastAPI JWT
        console.log("[AuthBridge] Client: Exchanging for FastAPI token...");
        const exchangeStartTime = Date.now();
        const exchangeResponse = await fetch(`${API_URL}/auth/exchange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ supabase_token: supabaseToken })
        });

        if (!exchangeResponse.ok) {
            const errorData = await exchangeResponse.json().catch(() => ({}));
            console.error("[AuthBridge] FastAPI Exchange failed:", exchangeResponse.status, errorData);
            throw new Error(errorData.detail || `Exchange failed: ${exchangeResponse.status}`);
        }

        const { access_token, expires_in } = await exchangeResponse.json();
        console.log(`[AuthBridge] Client: Exchange successful in ${Date.now() - exchangeStartTime}ms`);

        tokenCache = access_token;
        tokenExpiry = Date.now() + (access_token ? (expires_in - 60) * 1000 : 0); // Buffer of 60s

        return access_token;
    } catch (error: any) {
        console.error("[AuthBridge] Bridge Error:", error.message);
        throw error; // Re-throw so the caller knows auth failed
    }
}

interface ApiOptions {
    params?: Record<string, string>;
    headers?: Record<string, string>;
}

export const api = {
    async request<T>(endpoint: string, options: RequestInit & { params?: Record<string, string> } = {}): Promise<T> {
        const isServer = typeof window === 'undefined';
        const startTime = Date.now();
        if (isServer) {
            console.log(`[SSR] [API] Request Start: ${options.method || 'GET'} ${endpoint} at ${new Date().toISOString()}`);
        }

        let token: string | null = null;
        try {
            token = await fetchToken();
        } catch (authError: any) {
            console.error(`[API] Auth failed for ${endpoint}:`, authError.message);
            throw new Error(`Authentication failed: ${authError.message}`);
        }

        let url = `${API_URL}${endpoint}`;
        if (options.params) {
            const searchParams = new URLSearchParams(options.params);
            url += `?${searchParams.toString()}`;
        }

        const isFormData = options.body instanceof FormData;

        const headers = {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (isServer) {
                console.log(`[SSR] [API] Request Finish: ${options.method || 'GET'} ${endpoint} in ${Date.now() - startTime}ms (Status: ${response.status})`);
            }

            if (response.status === 401) {
                tokenCache = null;
                tokenExpiry = null;
            }

            if (response.status === 204) return null as any;

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`[API] ${options.method || 'GET'} ${endpoint} failed:`, response.status, errorData);
                throw new Error(errorData.detail || `API Request Failed: ${response.status}`);
            }

            return response.json();
        } catch (error: any) {
            if (isServer) {
                console.error(`[SSR] [API] Request Error: ${options.method || 'GET'} ${endpoint} in ${Date.now() - startTime}ms:`, error);
            }
            throw error;
        }
    },

    async get<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
        return this.request<T>(endpoint, { method: "GET", ...options });
    },

    async post<T>(endpoint: string, body: any = {}, options: ApiOptions = {}): Promise<T> {
        const isFormData = body instanceof FormData;
        return this.request<T>(endpoint, {
            method: "POST",
            body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
            ...options,
        });
    },

    async patch<T>(endpoint: string, body: any = {}, options: ApiOptions = {}): Promise<T> {
        return this.request<T>(endpoint, {
            method: "PATCH",
            body: body ? JSON.stringify(body) : undefined,
            ...options,
        });
    },

    async delete<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
        return this.request<T>(endpoint, {
            method: "DELETE",
            ...options,
        });
    },
};
