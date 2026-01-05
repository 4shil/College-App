import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { TriangleLoader } from '../components/ui/TriangleLoader';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { getAuthUser } from '../lib/database';

export default function Index() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { setSession, setAuthUser } = useAuthStore();

  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          router.replace('/(auth)/login');
          return;
        }

        const session = data.session;
        setSession(session);

        const userId = session?.user?.id;
        if (!userId) {
          router.replace('/(auth)/login');
          return;
        }

        const authUser = await getAuthUser(userId);
        setAuthUser(authUser);

        const roles = authUser?.roles || [];

        // HOD is an admin-category role but should default into Teacher module.
        if (roles.includes('hod')) {
          router.replace('/(teacher)/dashboard');
        } else if (authUser?.isTeacher) {
          router.replace('/(teacher)/dashboard');
        } else if (authUser?.isAdmin) {
          router.replace('/(admin)/dashboard');
        } else {
          router.replace('/(student)/dashboard');
        }
      } finally {
        if (mounted) setBooting(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [router, setAuthUser, setSession]);

  if (!booting) return null;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <TriangleLoader size={50} />
    </View>
  );
}
