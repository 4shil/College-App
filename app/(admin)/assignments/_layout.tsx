import React from 'react';
import { Stack } from 'expo-router';
import { useThemeStore } from '../../../store/themeStore';

export default function AssignmentsLayout() {
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
      <Stack.Screen name="submissions" />
      <Stack.Screen name="grade" />
      <Stack.Screen name="reports" />
    </Stack>
  );
}
