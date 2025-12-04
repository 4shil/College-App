import { Stack } from 'expo-router';

export default function AttendanceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="mark" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="holidays" />
      <Stack.Screen name="logs" />
    </Stack>
  );
}
