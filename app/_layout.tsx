import { Stack } from 'expo-router';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/locales/i18n';

export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
            headerTintColor: '#1A1D1A',
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="Auth/login" options={{ title: 'Login', headerShown: false }} />
          <Stack.Screen name="Citizen" options={{ headerShown: false }} />
          <Stack.Screen name="Picker/home" options={{ title: 'Picker Mode' }} />
          <Stack.Screen name="Business/dashboard" options={{ title: 'Business Dashboard' }} />
          <Stack.Screen name="Admin/dashboard" options={{ title: 'Admin Dashboard' }} />
        </Stack>
      </ErrorBoundary>
    </I18nextProvider>
  );
}
