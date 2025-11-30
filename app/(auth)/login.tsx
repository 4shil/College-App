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
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedBackground,
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
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRoleCategory>('staff');
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
          {/* Content Container - No Card */}
          <View style={styles.contentContainer}>
            {/* Logo - College graduation cap */}
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={isDark ? ['#A78BFA', '#8B5CF6', '#7C3AED'] : ['#60A5FA', '#3B82F6', '#2563EB']}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <FontAwesome5 name="graduation-cap" size={32} color="#fff" />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#1F2937' }]}>JPM College</Text>
            <Text style={[styles.subtitle, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)' }]}>Sign in to continue</Text>

            {/* Role Selector */}
            <View style={styles.roleContainer}>
              <Text style={[styles.roleLabel, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)' }]}>Login as</Text>
              <View style={styles.roleButtons}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role.key}
                    onPress={() => setSelectedRole(role.key)}
                    style={[
                      styles.roleButton,
                      { 
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      },
                      selectedRole === role.key && {
                        backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                        borderColor: colors.primary,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <FontAwesome5
                      name={role.icon}
                      size={18}
                      color={selectedRole === role.key ? colors.primary : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)')}
                    />
                    <View style={styles.roleTextContainer}>
                      <Text
                        style={[
                          styles.roleButtonText,
                          { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' },
                          selectedRole === role.key && { color: colors.primary },
                        ]}
                      >
                        {role.label}
                      </Text>
                      <Text
                        style={[
                          styles.roleDescription,
                          { color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.35)' },
                          selectedRole === role.key && { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)' },
                        ]}
                      >
                        {role.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Input Fields */}
            <View style={styles.inputsContainer}>
              <Text style={[styles.inputLabel, { color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)' }]}>Email / Username</Text>
              <View style={[
                styles.inputWrapper,
                { 
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                }
              ]}>
                <TextInput
                  style={[styles.input, { color: isDark ? '#FFFFFF' : '#1F2937' }]}
                  placeholder="Enter your email"
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <Text style={[styles.inputLabel, { marginTop: 16, color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)' }]}>Password</Text>
              <View style={[
                styles.inputWrapper,
                { 
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                }
              ]}>
                <TextInput
                  style={[styles.input, { color: isDark ? '#FFFFFF' : '#1F2937' }]}
                  placeholder="Enter your password"
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'}
                  />
                </TouchableOpacity>
              </View>

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
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={styles.signInButtonWrapper}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signInButton}
              >
                <Text style={styles.signInButtonText}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Register / Contact Admin */}
            <View style={styles.contactContainer}>
              {selectedRole === 'student' ? (
                <>
                  <Text style={[styles.contactText, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }]}>Don't have an account?{' '}</Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                    <Text style={styles.contactLink}>Create an account</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={[styles.contactText, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }]}>Need an account?{' '}</Text>
                  <TouchableOpacity>
                    <Text style={styles.contactLink}>Contact admin</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
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
    paddingHorizontal: 24,
  },
  themeToggleContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 380,
    paddingHorizontal: 4,
  },
  logoContainer: {
    alignSelf: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
  },
  inputsContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
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
    color: '#818CF8',
  },
  signInButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  signInButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  contactText: {
    fontSize: 14,
  },
  contactLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F472B6',
  },
  roleContainer: {
    marginBottom: 24,
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
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
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
    marginTop: 2,
  },
});
