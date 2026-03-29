import axios, { InternalAxiosRequestConfig } from "axios";
import { getCookie, removeCookie } from "./utils";

declare module "axios" {
    export interface InternalAxiosRequestConfig {
        _retry?: boolean;
    }
}

const isBrowser = typeof window !== "undefined";

const getAccessToken = () => {
    if (!isBrowser) return null;
    return localStorage.getItem("accessToken") ?? getCookie("bandhucare-token");
};

const setAccessToken = (token: string) => {
    if (!isBrowser) return;
    localStorage.setItem("accessToken", token);
};

const setRefreshToken = (token: string) => {
    if (!isBrowser) return;
    localStorage.setItem("refreshToken", token);
};

const clearTokens = () => {
    if (!isBrowser) return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    removeCookie("bandhucare-token");
};

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
});

const refreshApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;

type QueueItem = {
    resolve: (token: string) => void;
    reject: (error: any) => void;
};

let failedQueue: QueueItem[] = [];

const processQueue = (error: any, token: string | null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token!);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error?.config as InternalAxiosRequestConfig;
        const status = error?.response?.status;
        if (status !== 401 || !originalRequest) {
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({
                    resolve: (token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    },
                    reject,
                });
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const refreshToken = isBrowser
                ? localStorage.getItem("refreshToken")
                : null;

            const response = await refreshApi.get("/api/auth/refresh-token", {
                headers: {
                    "x-refresh-token": `Bearer ${refreshToken}`,
                },
            });

            const accessToken =
                response?.data?.data?.accessToken ?? response?.data?.accessToken;

            const newRefreshToken =
                response?.data?.data?.refreshToken ?? response?.data?.refreshToken;

            if (!accessToken) throw new Error("Refresh token failed");

            setAccessToken(accessToken);
            if (newRefreshToken) setRefreshToken(newRefreshToken);

            api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
            processQueue(null, accessToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
        } catch (err) {
            processQueue(err, null);
            clearTokens();
            if (isBrowser) {
                window.location.href = "/sign-in";
            }

            return Promise.reject(err);
        } finally {
            isRefreshing = false;
        }
    },
);

export default api;

export const signUp = async (name: string, email_number: string, password: string) => {
    const response = await api.post(
        `/api/auth/sign-up`,
        {
            name,
            email_number,
            password
        },
        {
            withCredentials: true,
        },
    );
    return response;
};


export const signIn = async (email_number: string, password: string) => {
    const response = await api.post(
        `/api/auth/sign-in`,
        {
            email_number: email_number,
            password,
            signInWith: "credentials",
        },
        {
            withCredentials: true,
        },
    );
    return response;
};

export const signOut = async () => {
    const response = await api.get(`/api/auth/sign-out`, {
        withCredentials: true,
    });
    return response;
};

export const getConversations = async (
    page: number = 1,
    limit: number = 10,
    search?: string,
) => {
    const response = await api.get(`/api/conversation`, {
        params: {
            page,
            limit,
            ...(search?.trim() ? { search: search.trim() } : {}),
        },
        withCredentials: true,
    });
    return response;
};

export type ConversationSummary = {
    _id: string;
    name: string;
    documentation: string;
    createdAt?: string;
    updatedAt?: string;
};

export const createConversation = async (body?: {
    name?: string;
    documentation?: string;
}) => {
    const response = await api.post(
        `/api/conversation`,
        {
            name: body?.name ?? "New Chat",
            documentation: body?.documentation ?? "stripe",
        },
        { withCredentials: true },
    );
    return response;
};

export const getMessages = async (conversationId: string, page: number = 1, limit: number = 10) => {
    const response = await api.get(`/api/messages/${conversationId}`, {
        params: { page, limit },
        withCredentials: true,
    });
    return response;
};

export type ConversationMeta = {
    _id: string;
    name: string;
    documentation: string;
};

export const deleteConversation = async (conversationId: string) => {
    const response = await api.delete(`/api/conversation/${conversationId}`, {
        withCredentials: true,
    });
    return response;
};

export const updateConversation = async (
    conversationId: string,
    body: { name?: string; documentation?: string },
) => {
    const response = await api.put(
        `/api/conversation/${conversationId}`,
        body,
        { withCredentials: true },
    );
    return response;
};

export const updateConversationName = async (
    conversationId: string,
    name: string,
) => {
    return updateConversation(conversationId, { name });
};

export type UploadedMedia = {
    url: string;
    key: string;
    mediaType: "image" | "audio" | "video" | "document";
    mimeType: string;
    size: number;
};

export const uploadMedia = async (file: File): Promise<UploadedMedia> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/api/upload/media`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
    });
    return response.data?.data as UploadedMedia;
};

export type SerializedMessage = {
    _id: string;
    conversationId: string;
    sender: "user" | "assistant";
    content: string;
    media?: Array<{
        url: string;
        mimeType: string;
        fileName?: string;
        mediaType?: "image" | "audio" | "video" | "document";
    }>;
    createdAt?: string;
    updatedAt?: string;
};

export type CreateMessageBody = {
    content: string;
    conversationId?: string;
    provider?: "openai" | "groq" | "anthropic" | "google";
    model?: string;
    documentation?: string;
    media?: Array<{
        url: string;
        mimeType: string;
        fileName?: string;
        mediaType?: "image" | "audio" | "video" | "document";
    }>;
};

export type CreateMessageStreamHandlers = {
    onStart?: (payload: {
        newConversationId: string | null;
        userMessage: SerializedMessage;
        documentation?: string;
    }) => void;
    onDelta?: (text: string) => void;
    onDone?: (payload: { assistantMessage: SerializedMessage }) => void;
    onError?: (message: string) => void;
};

async function refreshAccessTokenForFetch(): Promise<string | null> {
    if (!isBrowser) return null;
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return null;
    try {
        const response = await refreshApi.get("/api/auth/refresh-token", {
            headers: {
                "x-refresh-token": `Bearer ${refreshToken}`,
            },
        });
        const accessToken =
            response?.data?.data?.accessToken ?? response?.data?.accessToken;
        const newRefreshToken =
            response?.data?.data?.refreshToken ?? response?.data?.refreshToken;
        if (!accessToken) return null;
        setAccessToken(accessToken);
        if (newRefreshToken) setRefreshToken(newRefreshToken);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        return accessToken;
    } catch {
        clearTokens();
        if (isBrowser) window.location.href = "/sign-in";
        return null;
    }
}

export async function createMessageStream(
    body: CreateMessageBody,
    handlers: CreateMessageStreamHandlers,
): Promise<void> {
    const baseURL = process.env.NEXT_PUBLIC_API_URL;
    if (!baseURL) {
        throw new Error("NEXT_PUBLIC_API_URL is not set");
    }

    const payload = {
        content: body.content,
        provider: body.provider ?? "groq",
        model: body.model ?? "openai/gpt-oss-120b",
        ...(body.documentation ? { documentation: body.documentation } : {}),
        media: body.media ?? [],
        ...(body.conversationId ? { conversationId: body.conversationId } : {}),
    };

    const doFetch = (token: string | null) =>
        fetch(`${baseURL}/api/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
            body: JSON.stringify(payload),
        });

    let token = getAccessToken();
    let res = await doFetch(token);

    if (res.status === 401) {
        const newToken = await refreshAccessTokenForFetch();
        if (newToken) {
            res = await doFetch(newToken);
        }
    }

    if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg =
            errJson?.message ??
            errJson?.data?.message ??
            errJson?.error ??
            res.statusText;
        throw new Error(typeof msg === "string" ? msg : "Request failed");
    }

    const reader = res.body?.getReader();
    if (!reader) {
        throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    const processChunk = (chunk: string) => {
        buffer += chunk;
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data: ")) continue;
            let data: Record<string, unknown>;
            try {
                data = JSON.parse(line.slice(6)) as Record<string, unknown>;
            } catch {
                continue;
            }
            const type = data.type as string;
            if (type === "start") {
                handlers.onStart?.({
                    newConversationId:
                        data.newConversationId != null
                            ? String(data.newConversationId)
                            : null,
                    userMessage: data.userMessage as SerializedMessage,
                    documentation:
                        typeof data.documentation === "string"
                            ? data.documentation
                            : undefined,
                });
            } else if (type === "data") {
                handlers.onDelta?.(String(data.text ?? ""));
            } else if (type === "done") {
                handlers.onDone?.({
                    assistantMessage: data.assistantMessage as SerializedMessage,
                });
            } else if (type === "error") {
                handlers.onError?.(String(data.message ?? "Generation failed"));
            }
        }
    };

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            if (buffer.trim()) {
                buffer += "\n\n";
            }
            processChunk("");
            break;
        }
        processChunk(decoder.decode(value, { stream: true }));
    }
}