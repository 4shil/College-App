import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedBackground,
  GlassCard,
  GlassInput,
  PrimaryButton,
  ThemeToggle,
} from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { signInWithEmail } from '../../lib/supabase';
import { getAuthUser } from '../../lib/database';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

// Only 2 role categories: Student and Staff (Teachers + Admins)
type UserRoleCategory = 'student' | 'staff';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useThemeStore();
  const { setSession, setAuthUser, setLoading } = useAuthStore();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRoleCategory>('student');
  const [loading, setLoadingState] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only 2 login modes: Student and Staff (Teachers/Admins)
  const roles: { key: UserRoleCategory; label: string; icon: string; description: string }[] = [
    { key: 'student', label: 'Student', icon: 'user-graduate', description: 'For enrolled students' },
    { key: 'staff', label: 'Staff', icon: 'chalkboard-teacher', description: 'Teachers & Admins' },
  ];

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setError(null);
    setLoadingState(true);
    setLoading(true);

    try {
      const { data, error: authError } = await signInWithEmail(email.trim(), password);

      if (authError) {
        setError(authError.message);
        setLoadingState(false);
        setLoading(false);
        return;
      }

      if (data.session && data.user) {
        // Fetch user profile and roles from database
        const authUser = await getAuthUser(data.user.id);
        
        if (authUser) {
          // Validate role against selected login mode
          const isStudent = !authUser.isTeacher && !authUser.isAdmin;
          const isStaff = authUser.isTeacher || authUser.isAdmin;

          // Role restriction check
          if (selectedRole === 'student' && !isStudent) {
            setError('This account is not a student account. Please use the Staff login.');
            setLoadingState(false);
            setLoading(false);
            return;
          }

          if (selectedRole === 'staff' && !isStaff) {
            setError('This account is a student account. Please use the Student login.');
            setLoadingState(false);
            setLoading(false);
            return;
          }

          // Set session and user
          setSession(data.session);
          setAuthUser(authUser);
          
          // Navigate based on actual roles from database
          if (authUser.isAdmin) {
            router.replace('/(admin)/dashboard');
          } else if (authUser.isTeacher) {
            router.replace('/(teacher)/dashboard');
          } else {
            router.replace('/(student)/dashboard');
          }
        } else {
          // No profile found - check if this is a new student
          if (selectedRole === 'student') {
            setSession(data.session);
            router.replace('/(student)/dashboard');
          } else {
            setError('No staff account found. Contact administrator to set up your account.');
            setLoadingState(false);
            setLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoadingState(false);
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      {/* Theme Toggle */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(500).springify()}
        style={[styles.themeToggleContainer, { top: insets.top + 12 }]}
      >
        <ThemeToggle />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Login Card */}
          <Animated.View
            entering={SlideInUp.delay(150).duration(600).springify().damping(18)}
            style={styles.cardContainer}
          >
            <GlassCard style={styles.card}>
              {/* Logo */}
              <Animated.View
                entering={FadeInDown.delay(250).duration(500).springify()}
                style={styles.logoContainer}
              >
                <LinearGradient
                  colors={isDark ? ['#A78BFA', '#8B5CF6', '#7C3AED'] : ['#8B5CF6', '#7C3AED', '#6D28D9']}
                  style={styles.logoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <FontAwesome5 name="graduation-cap" size={32} color="#fff" />
                </LinearGradient>
              </Animated.View>

              {/* Title */}
              <Animated.View entering={FadeInDown.delay(300).duration(500).springify()}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  JPM College
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Sign in to continue
                </Text>
              </Animated.View>

              {/* Role Selector - Only 2 tabs: Student and Staff */}
              <Animated.View
                entering={FadeInDown.delay(350).duration(500).springify()}
                style={styles.roleContainer}
              >
                <Text style={[styles.roleLabel, { color: colors.textSecondary }]}>
                  Login as
                </Text>
                <View style={styles.roleButtons}>
                  {roles.map((role) => (
                    <TouchableOpacity
                      key={role.key}
                      onPress={() => setSelectedRole(role.key)}
                      style={[
                        styles.roleButton,
                        {
                          backgroundColor:
                            selectedRole === role.key
                              ? isDark
                                ? 'rgba(139, 92, 246, 0.15)'
                                : 'rgba(124, 58, 237, 0.1)'
                              : 'transparent',
                          borderColor:
                            selectedRole === role.key
                              ? colors.primary
                              : isDark
                              ? 'rgba(255,255,255,0.1)'
                              : 'rgba(0,0,0,0.08)',
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <FontAwesome5
                        name={role.icon}
                        size={18}
                        color={
                          selectedRole === role.key
                            ? colors.primary
                            : colors.textMuted
                        }
                      />
                      <View style={styles.roleTextContainer}>
                        <Text
                          style={[
                            styles.roleButtonText,
                            {
                              color:
                                selectedRole === role.key
                                  ? colors.primary
                                  : colors.textMuted,
                            },
                          ]}
                        >
                          {role.label}
                        </Text>
                        <Text
                          style={[
                            styles.roleDescription,
                            {
                              color:
                                selectedRole === role.key
                                  ? colors.textSecondary
                                  : colors.textMuted,
                            },
                          ]}
                        >
                          {role.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>

              {/* Input Fields */}
              <Animated.View
                entering={FadeInDown.delay(400).duration(500).springify()}
                style={styles.inputsContainer}
              >
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Email
                </Text>
                <GlassInput
                  icon="mail-outline"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoComplete="email"
                  error={!!error && !email}
                />

                <Text
                  style={[
                    styles.inputLabel,
                    { color: colors.textSecondary, marginTop: 18 },
                  ]}
                >
                  Password
                </Text>
                <GlassInput
                  icon="lock-closed-outline"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  error={!!error && !password}
                />

                {/* Error Message */}
                {error && (
                  <Animated.Text
                    entering={FadeInDown.duration(250).springify()}
                    style={styles.errorText}
                  >
                    {error}
                  </Animated.Text>
                )}

                {/* Forgot Password */}
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => router.push('/(auth)/forgot-password')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Sign In Button */}
              <Animated.View entering={FadeInDown.delay(450).duration(500).springify()}>
                <PrimaryButton
                  title="Sign In"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                />
              </Animated.View>

              {/* Register / Contact Admin */}
              <Animated.View
                entering={FadeInDown.delay(500).duration(500).springify()}
                style={styles.contactContainer}
              >
                {selectedRole === 'student' ? (
                  <>
                    <Text style={[styles.contactText, { color: colors.textMuted }]}>
                      New student?{' '}
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                      <Text style={[styles.contactLink, { color: colors.primary }]}>
                        Register here
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={[styles.contactText, { color: colors.textMuted }]}>
                      Need an account?{' '}
                    </Text>
                    <TouchableOpacity>
                      <Text style={[styles.contactLink, { color: colors.primary }]}>
                        Contact admin
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </Animated.View>
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  themeToggleContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    width: '100%',
  },
  logoContainer: {
    alignSelf: 'center',
    marginBottom: 22,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  logoGradient: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 26,
  },
  roleContainer: {
    marginBottom: 26,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  roleTextContainer: {
    alignItems: 'flex-start',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  roleDescription: {
    fontSize: 10,
    marginTop: 3,
  },
  inputsContainer: {
    marginBottom: 22,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    marginTop: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 14,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  contactText: {
    fontSize: 14,
  },
  contactLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
