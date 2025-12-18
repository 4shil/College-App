import React from 'react';
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="academic-year" />
      <Stack.Screen name="appearance" />
      <Stack.Screen name="backup" />
      <Stack.Screen name="backup-restore" />
    </Stack>
  );
}
