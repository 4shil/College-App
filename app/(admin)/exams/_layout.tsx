import React from 'react';
import { Stack } from 'expo-router';
import { useThemeStore } from '../../../store/themeStore';

export default function ExamsLayout() {
  const { colors } = useThemeStore();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="manage" />
      <Stack.Screen name="marks" />
      <Stack.Screen name="external" />
      <Stack.Screen name="reports" />
    </Stack>
  );
}
