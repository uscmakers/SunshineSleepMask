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
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { AlarmProvider } from '@/alarm/AlarmContext';
import { GlobalAudioProvider } from '@/audio/GlobalAudioContext';
import { StarfieldBackground } from '@/components/ui/StarfieldBackground';
import { appTheme } from '@/theme/appTheme';

/** Lets `StarfieldBackground` show through on iOS (native screens default to an opaque theme background). */
const navigationDarkTransparent = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: 'transparent',
    card: appTheme.colors.surface,
  },
};


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
  // Starfield sits under all routes; navigation layer stays interactive above it.
  return (
    <View style={styles.rootShell}>
      <StarfieldBackground />
      <View style={styles.navAboveStars} pointerEvents="box-none">
        <GlobalAudioProvider>
          <AlarmProvider>
            <ThemeProvider value={navigationDarkTransparent}>
              <Stack
                screenOptions={{
                  contentStyle: { backgroundColor: 'transparent' },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
              </Stack>
            </ThemeProvider>
          </AlarmProvider>
        </GlobalAudioProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Matches starfield base so any gap still reads as black */
  rootShell: { flex: 1, backgroundColor: appTheme.colors.background },
  navAboveStars: {
    flex: 1,
    zIndex: 1,
    elevation: 1,
    backgroundColor: 'transparent',
  },
});
