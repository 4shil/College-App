import { Stack } from 'expo-router';

export default function TimetableLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="substitutions" />
      <Stack.Screen name="reports" />
    </Stack>
  );
}
