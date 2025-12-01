import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/themeStore';

export default function AdminLayout() {
  const { colors, isDark } = useThemeStore();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 88 + insets.bottom,
          paddingBottom: insets.bottom + 12,
          paddingTop: 14,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 70 : 100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            {/* Glassmorphic overlay with purple tint */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark 
                    ? 'rgba(15, 15, 26, 0.75)' 
                    : 'rgba(248, 250, 252, 0.78)',
                },
              ]}
            />
            {/* Top border with purple glow */}
            <LinearGradient
              colors={
                isDark 
                  ? ['rgba(139, 92, 246, 0.35)', 'rgba(99, 102, 241, 0.15)', 'transparent']
                  : ['rgba(124, 58, 237, 0.2)', 'rgba(139, 92, 246, 0.08)', 'transparent']
              }
              style={styles.topBorder}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            {/* Top glow line */}
            <View
              style={[
                styles.glowLine,
                {
                  backgroundColor: isDark
                    ? 'rgba(139, 92, 246, 0.5)'
                    : 'rgba(124, 58, 237, 0.3)',
                  shadowColor: '#8B5CF6',
                  shadowOpacity: isDark ? 0.6 : 0.3,
                },
              ]}
            />
          </View>
        ),
        tabBarActiveTintColor: isDark ? '#8B5CF6' : '#7C3AED',
        tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(30,30,46,0.35)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 5,
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? [styles.activeIconContainer, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.18)' : 'rgba(124, 58, 237, 0.12)' }] : undefined}>
              <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      {/* Users tab - points to users folder */}
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? [styles.activeIconContainer, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.18)' : 'rgba(124, 58, 237, 0.12)' }] : undefined}>
              <FontAwesome5 name="users" size={18} color={color} solid={focused} />
            </View>
          ),
        }}
      />
      {/* Academic tab - points to academic folder */}
      <Tabs.Screen
        name="academic"
        options={{
          title: 'Academic',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? [styles.activeIconContainer, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.18)' : 'rgba(124, 58, 237, 0.12)' }] : undefined}>
              <FontAwesome5 name="graduation-cap" size={18} color={color} solid={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: 'Notices',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? [styles.activeIconContainer, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.18)' : 'rgba(124, 58, 237, 0.12)' }] : undefined}>
              <Ionicons name={focused ? 'megaphone' : 'megaphone-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? [styles.activeIconContainer, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.18)' : 'rgba(124, 58, 237, 0.12)' }] : undefined}>
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconContainer: {
    borderRadius: 14,
    padding: 9,
    marginTop: -5,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  glowLine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 0,
  },
});
