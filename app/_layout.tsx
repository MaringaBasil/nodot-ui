import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/locales/i18n';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';

// Hold native splash until fonts resolve — prevents flash of wrong typeface
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTintColor: '#1A1D1A',
            headerShadowVisible: false,
          }}
        >
          {/* Entry */}
          <Stack.Screen name="index" options={{ headerShown: false }} />

          {/* Auth flow */}
          <Stack.Screen name="Auth/splash"           options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="Auth/onboarding"       options={{ headerShown: false, animation: 'none' }} />
          {/* get-started fades in over the onboarding green — feels like a reveal */}
          <Stack.Screen name="Auth/get-started"      options={{ headerShown: false, animation: 'fade' }} />
          {/* Lateral steps through the sign-up funnel */}
          <Stack.Screen name="Auth/sign-in"          options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="Auth/register"         options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="Auth/create-password"  options={{ headerShown: false, animation: 'slide_from_right' }} />
          {/* Forgot password slides up as a supplementary action */}
          <Stack.Screen name="Auth/forgot-password"  options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="Auth/login"            options={{ headerShown: false }} />

          {/* App shells */}
          <Stack.Screen name="Citizen" options={{ headerShown: false }} />
          <Stack.Screen name="Picker/home" options={{ title: 'Picker Mode' }} />
          <Stack.Screen name="Business/dashboard" options={{ title: 'Business Dashboard' }} />
          <Stack.Screen name="Admin/dashboard" options={{ title: 'Admin Dashboard' }} />
        </Stack>
      </ErrorBoundary>
    </I18nextProvider>
  );
}
