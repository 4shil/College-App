import React from 'react';
import { Stack } from 'expo-router';

export default function TeacherSettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="appearance" />
    </Stack>
  );
}
