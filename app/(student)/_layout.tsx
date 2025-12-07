import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { View } from 'react-native';
import { BottomNav } from '../../components/ui';

type NavPage = 'dashboard' | 'attendance' | 'materials' | 'results' | 'profile';

export default function StudentLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');

  // Update current page based on pathname
  useEffect(() => {
    if (pathname.includes('attendance')) setCurrentPage('attendance');
    else if (pathname.includes('materials')) setCurrentPage('materials');
    else if (pathname.includes('results')) setCurrentPage('results');
    else if (pathname.includes('profile')) setCurrentPage('profile');
    else setCurrentPage('dashboard');
  }, [pathname]);

  const handleNavigate = (page: NavPage) => {
    // Navigate to the corresponding route
    const routes: Record<NavPage, string> = {
      dashboard: '/(student)/dashboard',
      attendance: '/(student)/attendance',
      materials: '/(student)/materials',
      results: '/(student)/results',
      profile: '/(student)/profile',
    };
    router.push(routes[page] as any);
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="attendance" />
        <Stack.Screen name="materials" />
        <Stack.Screen name="results" />
        <Stack.Screen name="profile" />
      </Stack>
      <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />
    </View>
  );
}
