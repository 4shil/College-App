import React from 'react';
import { Stack } from 'expo-router';

export default function TeacherAttendanceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="mark" />
      <Stack.Screen name="history" />
    </Stack>
  );
}
