import Toast, { showToast } from '@/components/Toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { setCredentials } from '@/redux/authSlice';
import { clearCart, setCartRole, setItemQuantity } from '@/redux/cartSlice';
import { useViewCartQuery } from '@/redux/services/orderApi';
import { RootState, store } from '@/redux/store';
import {
  clearSession,
  getStoredSession,
  loginAsGuest,
  refreshAccessToken,
} from '@/utils/session';
import { setCurrentRoute } from '@/utils/routeStore';
import {
  Nunito_400Regular,
  Nunito_400Regular_Italic,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_600SemiBold_Italic,
  Nunito_700Bold,
  Nunito_700Bold_Italic,
  Nunito_800ExtraBold,
  useFonts
} from "@expo-google-fonts/nunito";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { router, Stack, usePathname, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from 'expo-status-bar';
import { jwtDecode } from 'jwt-decode';
import React, { useEffect } from 'react';
import { LogBox, View } from 'react-native';
import { LogLevel, OneSignal } from 'react-native-onesignal';
import 'react-native-reanimated';
import { Provider, useDispatch, useSelector } from 'react-redux';

SplashScreen.preventAutoHideAsync();
if (__DEV__) {
  // keep warnings visible in release crash reports; only hide in dev
  LogBox.ignoreLogs(['Require cycle:']);
}

const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
if (ONESIGNAL_APP_ID) {
  if (__DEV__) OneSignal.Debug.setLogLevel(LogLevel.Verbose);
  OneSignal.initialize(ONESIGNAL_APP_ID);
  OneSignal.Notifications.addEventListener('click', () => {
    const role = store.getState().auth.userRole;
    if (role === 'bartender') {
      router.push('/bartender/profile/notification' as any);
    } else if (role === 'customer') {
      router.push('/customer/notification' as any);
    }
  });
}

// ── Route Tracker ─────────────────────────────────────────────
function RouteTracker() {
  const pathname = usePathname();
  useEffect(() => {
    setCurrentRoute(pathname);
  }, [pathname]);
  return null;
}

// ── Auth Guard ────────────────────────────────────────────────
function AuthGuard() {
  const token = useSelector((state: RootState) => state.auth.token);
  const userRole = useSelector((state: RootState) => state.auth.userRole);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const first = segments[0] as string | undefined;
    const isPublic =
      !first ||
      first === '(auth)' ||
      first === 'select-role' ||
      first === 'onboarding' ||
      first === 'bartender-info' ||
      first === 'guest' ||
      first === 'payment-success' ||
      first === 'payment-cancel';
    if (isPublic) return;

    // customer screens need a customer account, bartender screens a bartender
    const allowed =
      !!token &&
      ((first === 'customer' && userRole === 'customer') ||
        (first === 'bartender' && userRole === 'bartender'));
    if (!allowed) {
      router.replace('/(auth)/login');
    }
  }, [token, userRole, segments]);

  return null;
}
// ── App Init ──────────────────────────────────────────────────
function AppInit() {
  const dispatch = useDispatch();
  const { data: cartData } = useViewCartQuery(undefined);

  useEffect(() => {
    if (cartData?.items?.length) {
      dispatch(clearCart());
      cartData.items.forEach((item: any) => {
        if (item.product?._id && item.quantity) {
          dispatch(setItemQuantity({
            id: item.product._id,
            quantity: item.quantity,
            barId: cartData.venue?._id,
          }));
        }
      });
    }
  }, [cartData]);

  useEffect(() => {
    const isExpired = (token: string) => {
      try {
        const decoded: any = jwtDecode(token);
        return decoded.exp * 1000 < Date.now() + 30000;
      } catch {
        return true;
      }
    };

    const initAuth = async () => {
      const saved = await getStoredSession();
      let role = saved.role;

      // sessions saved before the role was stored: only remembered
      // customer/bartender logins are kept (old guest sessions start fresh)
      if (saved.accessToken && !role && saved.remember) {
        try {
          const decoded: any = jwtDecode(saved.accessToken);
          if (decoded.role === 'customer' || decoded.role === 'bartender') {
            role = decoded.role;
          }
        } catch {}
      }

      if (saved.accessToken && role && (role === 'guest' || saved.remember)) {
        let token: string | null = saved.accessToken;
        if (isExpired(token)) token = await refreshAccessToken();
        if (token) {
          if (!saved.role) await SecureStore.setItemAsync('authRole', role);
          dispatch(setCredentials({ role, token }));
          dispatch(setCartRole(role));
          return;
        }
      }

      // nothing to restore: start as a guest
      await clearSession();
      const guestToken = await loginAsGuest();
      if (guestToken) {
        dispatch(setCredentials({ role: 'guest', token: guestToken }));
        dispatch(setCartRole('guest'));
      } else {
        showToast('Could not connect. Please check your internet connection.', 'error');
      }
    };

    initAuth();
  }, []);

  // ask for push permission once someone is using the app (not at launch)
  const userRole = useSelector((state: RootState) => state.auth.userRole);
  useEffect(() => {
    if (ONESIGNAL_APP_ID && (userRole === 'customer' || userRole === 'bartender')) {
      OneSignal.Notifications.requestPermission(true).catch(() => undefined);
    }
  }, [userRole]);

  return null;
}

// ── Root Layout Inner ─────────────────────────────────────────
function RootLayoutInner() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_400Regular_Italic,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_600SemiBold_Italic,
    Nunito_700Bold,
    Nunito_700Bold_Italic,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    async function prepare() {
      if (fontsLoaded || fontError) {
        await SplashScreen.hideAsync();
      }
      if (fontError) {
        showToast("Font Load Error", "error");
      }
    }
    prepare();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D1A' }}>
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
        merchantIdentifier="merchant.com.flonx"
        urlScheme="flonx"
      >
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AppInit />
          <RouteTracker />
          <AuthGuard />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0D0D1A' },
              animation: 'slide_from_right',
              animationDuration: 300,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen
              name="(auth)"
              options={{ animation: 'none' }}
            />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </StripeProvider>
      <Toast />
    </View>
  );
}

// ── Root Layout ───────────────────────────────────────────────
export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutInner />
    </Provider>
  );
}