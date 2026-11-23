import { showToast } from '@/components/Toast';
import { logout, setCredentials } from '@/redux/authSlice';
import { getCurrentRoute } from '@/utils/routeStore';
import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  API_BASE,
  clearSession,
  loginAsGuest,
  refreshAccessToken,
} from '@/utils/session';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: async (headers) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      headers.set('Authorization', `${token}`);
    }
    return headers;
  },
});

let isRedirectingToLogin = false;
let lastLoginTime = 0;

export const setLastLoginTime = () => {
  lastLoginTime = Date.now();
};

const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/guest',
  '/auth/refresh-token',
  '/user/register',
  '/user/verify-code',
  '/auth/forget-password',
  '/auth/verify-reset-otp',
  '/auth/reset-password',
];

// On 401: refresh the access token and retry once. A guest whose session
// can't be refreshed gets a new guest session; a logged-in user is sent to
// the login screen.
const baseQueryWithAuth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);
  if (!result.error || (result.error as FetchBaseQueryError).status !== 401) {
    return result;
  }

  const url = typeof args === 'string' ? args : args?.url || '';
  if (AUTH_ENDPOINTS.some((p) => url.includes(p))) return result;

  const { store } = require('@/redux/store');
  const currentRole = store.getState().auth.userRole;
  if (!currentRole || !(await SecureStore.getItemAsync('accessToken'))) {
    return result;
  }

  const refreshed = await refreshAccessToken();
  if (refreshed) {
    api.dispatch(setCredentials({ role: currentRole, token: refreshed }));
    result = await baseQuery(args, api, extraOptions);
    if (!result.error || (result.error as FetchBaseQueryError).status !== 401) {
      return result;
    }
  }

  if (currentRole === 'guest') {
    const guestToken = await loginAsGuest();
    if (guestToken) {
      api.dispatch(setCredentials({ role: 'guest', token: guestToken }));
      return baseQuery(args, api, extraOptions);
    }
    return result;
  }

  // a 401 right after logging in is a role mismatch, not an expired session
  if (isRedirectingToLogin || Date.now() - lastLoginTime < 3000) return result;

  showToast('Session expired. Please login again.', 'error');
  isRedirectingToLogin = true;
  await clearSession();
  api.dispatch(logout());

  const savedPath = getCurrentRoute();
  setTimeout(() => {
    router.replace({
      pathname: '/(auth)/login',
      params: { returnTo: savedPath ? encodeURIComponent(savedPath) : '' },
    });
    setTimeout(() => {
      isRedirectingToLogin = false;
    }, 2000);
  }, 100);

  return result;
};

export const baseApis = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['auth', 'Profile', 'order', 'venue', 'Jobs', 'Cart', 'Applications', 'Notification'],
  endpoints: () => ({}),
});