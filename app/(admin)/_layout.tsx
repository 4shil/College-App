import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
          height: 85 + insets.bottom,
          paddingBottom: insets.bottom + 10,
          paddingTop: 12,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 80 : 120}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            {/* Glassmorphic overlay */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark 
                    ? 'rgba(15, 15, 35, 0.7)' 
                    : 'rgba(255, 255, 255, 0.75)',
                  borderTopWidth: 0.5,
                  borderTopColor: isDark 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            />
            {/* Top glow line */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 20,
                right: 20,
                height: 1,
                backgroundColor: isDark
                  ? 'rgba(139, 92, 246, 0.3)'
                  : 'rgba(99, 102, 241, 0.2)',
                shadowColor: isDark ? '#8B5CF6' : '#6366f1',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
              }}
            />
          </View>
        ),
        tabBarActiveTintColor: isDark ? '#a78bfa' : '#7c3aed',
        tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
          letterSpacing: 0.2,
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
            <View style={focused ? styles.activeIconContainer : undefined}>
              <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <FontAwesome5 name="users" size={18} color={color} solid={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="academic"
        options={{
          title: 'Academic',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
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
            <View style={focused ? styles.activeIconContainer : undefined}>
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
            <View style={focused ? styles.activeIconContainer : undefined}>
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
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 12,
    padding: 8,
    marginTop: -4,
  },
});
