import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Prevent splash auto-hide on native only
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  // Read theme colors for the initial loading UI without hard-coded values.
  // The store has a default theme even before full hydration.
  const { useThemeStore } = require('../store/themeStore');
  const { colors } = useThemeStore();

  useEffect(() => {
    // Small delay to let stores initialize, then show app
    const init = async () => {
      // Wait a tick for React to be ready
      await new Promise(resolve => setTimeout(resolve, 50));
      setIsReady(true);
      
      if (Platform.OS !== 'web') {
        await SplashScreen.hideAsync().catch(() => {});
      }
    };
    
    init();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  // Import theme store here AFTER initial render
  const { useThemeStore } = require('../store/themeStore');
  const { isDark } = useThemeStore();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(teacher)" options={{ headerShown: false }} />
        <Stack.Screen name="(student)" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
