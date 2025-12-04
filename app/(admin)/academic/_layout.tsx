import { Stack } from 'expo-router';
import { useThemeStore } from '../../../store/themeStore';

export default function AcademicLayout() {
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
      <Stack.Screen name="departments/index" />
      <Stack.Screen name="courses/index" />
    </Stack>
  );
}
