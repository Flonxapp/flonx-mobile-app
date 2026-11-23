import * as SecureStore from 'expo-secure-store';
import { getDeviceId, resetDeviceId } from './deviceId';

// Backend base URL (without /api/v1); EXPO_PUBLIC_API_URL is set at build time
export const API_URL = (
    process.env.EXPO_PUBLIC_API_URL || 'https://api.flonxapp.com'
).replace(/\/+$/, '');
export const API_BASE = `${API_URL}/api/v1`;

export type AppRole = 'customer' | 'bartender' | 'guest';

const KEYS = {
    access: 'accessToken',
    refresh: 'refreshToken',
    // the token itself can't tell a guest from a customer (both have
    // role "customer"), so the role is stored next to it
    role: 'authRole',
    remember: 'rememberMe',
    guestSecret: 'guestSecret',
};

const setOrDelete = (key: string, value?: string | null) =>
    value ? SecureStore.setItemAsync(key, value) : SecureStore.deleteItemAsync(key);

export const saveSession = async (s: {
    accessToken: string;
    refreshToken?: string | null;
    role: AppRole;
    remember?: boolean;
}) => {
    await SecureStore.setItemAsync(KEYS.access, s.accessToken);
    await setOrDelete(KEYS.refresh, s.refreshToken);
    await SecureStore.setItemAsync(KEYS.role, s.role);
    await SecureStore.setItemAsync(
        KEYS.remember,
        s.role === 'guest' || s.remember ? 'true' : 'false',
    );
};

export const clearSession = async () => {
    await Promise.all(
        [KEYS.access, KEYS.refresh, KEYS.role, KEYS.remember].map((k) =>
            SecureStore.deleteItemAsync(k),
        ),
    );
};

export const getStoredSession = async () => {
    const [accessToken, refreshToken, role, remember] = await Promise.all([
        SecureStore.getItemAsync(KEYS.access),
        SecureStore.getItemAsync(KEYS.refresh),
        SecureStore.getItemAsync(KEYS.role),
        SecureStore.getItemAsync(KEYS.remember),
    ]);
    return {
        accessToken,
        refreshToken,
        role: role as AppRole | null,
        remember: remember === 'true',
    };
};

const post = async (path: string, body: unknown) => {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data: json?.data };
};

// Logs this device in as a guest and saves the session. The server issues a
// secret on the first login that proves the device later; if it is rejected
// (lost after a reinstall), a fresh guest identity is started once.
let guestInFlight: Promise<string | null> | null = null;
export const loginAsGuest = (): Promise<string | null> => {
    if (guestInFlight) return guestInFlight;
    guestInFlight = (async () => {
        for (let attempt = 0; attempt < 2; attempt++) {
            const deviceId = await getDeviceId();
            const guestSecret = await SecureStore.getItemAsync(KEYS.guestSecret);
            const res = await post('/auth/guest', {
                deviceId,
                ...(guestSecret ? { guestSecret } : {}),
            });
            if (res.ok && res.data?.accessToken) {
                if (res.data.guestSecret) {
                    await SecureStore.setItemAsync(KEYS.guestSecret, res.data.guestSecret);
                }
                await saveSession({
                    accessToken: res.data.accessToken,
                    refreshToken: res.data.refreshToken,
                    role: 'guest',
                });
                return res.data.accessToken as string;
            }
            if (res.status !== 401) return null;
            await SecureStore.deleteItemAsync(KEYS.guestSecret);
            await resetDeviceId();
        }
        return null;
    })().finally(() => {
        guestInFlight = null;
    });
    return guestInFlight;
};

// Exchanges the stored refresh token for a new access token
let refreshInFlight: Promise<string | null> | null = null;
export const refreshAccessToken = (): Promise<string | null> => {
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = (async () => {
        const refreshToken = await SecureStore.getItemAsync(KEYS.refresh);
        if (!refreshToken) return null;
        const res = await post('/auth/refresh-token', { refreshToken });
        if (!res.ok || !res.data?.accessToken) return null;
        await SecureStore.setItemAsync(KEYS.access, res.data.accessToken);
        return res.data.accessToken as string;
    })().finally(() => {
        refreshInFlight = null;
    });
    return refreshInFlight;
};
