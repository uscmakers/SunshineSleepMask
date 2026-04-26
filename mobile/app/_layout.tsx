import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  useFonts as useInterFonts,
} from '@expo-google-fonts/inter';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AlarmProvider } from '@/alarm/AlarmContext';
import { GlobalAudioProvider } from '@/audio/GlobalAudioContext';


export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [interLoaded, interError] = useInterFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
  });
  const [expoFontLoaded, expoFontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const loaded = interLoaded && expoFontLoaded;
  const error = interError ?? expoFontError;

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  // App uses a dark, token-driven layout (`appTheme`); keep navigation in dark mode
  // so modals and nested routes match the Figma spec.
  return (
    <GlobalAudioProvider>
      <AlarmProvider>
        <ThemeProvider value={DarkTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </AlarmProvider>
    </GlobalAudioProvider>
  );
}
