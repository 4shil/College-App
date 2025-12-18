import React from 'react';
import { Stack } from 'expo-router';

export default function AuditLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="logs" />
    </Stack>
  );
}
