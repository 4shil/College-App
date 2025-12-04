import { Stack } from 'expo-router';
import { useThemeStore } from '../../../store/themeStore';

export default function UsersLayout() {
  const { colors } = useThemeStore();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="pending" />
      <Stack.Screen name="teachers/index" />
      <Stack.Screen name="teachers/create" />
      <Stack.Screen name="teachers/[id]" />
      <Stack.Screen name="students/index" />
      <Stack.Screen name="students/create" />
      <Stack.Screen name="students/[id]" />
    </Stack>
  );
}
