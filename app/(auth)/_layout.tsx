import React from 'react';
import { Stack } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';

export default function AuthLayout() {
  const { colors } = useThemeStore();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
