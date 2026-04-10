import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { crossPlatformAlert } from '../../utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Button, Input, Card, GoldGlow } from '../../components/common';
import { authService } from '../../services/firebase';
import { dataService } from '../../services/DataService';
import { typography, spacing, fontFamilies } from '../../theme';
import { useThemedColors } from '../../contexts/ThemeContext';
import { useStore } from '../../store';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const colors = useThemedColors();
  const settings = useStore((state) => state.settings);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animated glow pulse
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      crossPlatformAlert('Validation Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email.trim())) {
      crossPlatformAlert('Validation Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await authService.signIn(email.trim(), password);

      // Check approval status
      const approvalStatus = await dataService.getApprovalStatus(userCredential.uid);

      if (approvalStatus === 'pending') {
        // Sign out immediately
        await authService.signOut();
        crossPlatformAlert(
          'Account Pending Approval',
          'Your account is awaiting administrator approval. Please check back later.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      if (approvalStatus === 'rejected') {
        // Sign out immediately
        await authService.signOut();
        crossPlatformAlert(
          'Account Not Approved',
          'Your account application was not approved. Please contact support for more information.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // If approved, login successful - auth state change in App.tsx will swap to AppNavigator
    } catch (error: any) {
      let errorMessage = 'Failed to sign in';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      }
      crossPlatformAlert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.innerContainer}>
        {/* Background gradient */}
        <LinearGradient
          colors={
            settings.darkMode
              ? [colors.background.primary, colors.primary[900], colors.background.primary]
              : [colors.background.primary, colors.primary[300], colors.background.primary]
          }
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Decorative gold glow orb */}
        <Animated.View style={[styles.glowOrb, glowStyle]}>
          <LinearGradient
            colors={[colors.glow.gold, 'transparent']}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={styles.glowGradient}
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section - Staggered animation */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(600)}
            style={styles.headerSection}
          >
            <Text style={styles.brandLabel}>GOLF</Text>
            <Text style={styles.brandTitle}>GAMBLING</Text>
            <Text style={styles.brandSubtitle}>TRACKER</Text>
          </Animated.View>

          {/* Tagline */}
          <Animated.Text
            entering={FadeInUp.delay(300).duration(500)}
            style={styles.tagline}
          >
            Track scores. Compete with friends.
          </Animated.Text>

          {/* Login Card */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(600)}
            style={styles.cardWrapper}
          >
            <Card goldBorder glass={settings.darkMode} style={[styles.loginCard, !settings.darkMode && styles.loginCardLight]}>
              <Text style={styles.cardTitle}>Sign In</Text>

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="your@email.com"
                leftIcon="email-outline"
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Enter password"
                leftIcon="lock-outline"
                rightIcon={showPassword ? 'eye-off' : 'eye'}
                onRightIconPress={() => setShowPassword(!showPassword)}
              />

              <Button
                title={loading ? 'Signing In...' : 'Sign In'}
                onPress={handleLogin}
                disabled={loading}
                loading={loading}
                variant="gold"
                glow
                fullWidth
                style={styles.signInButton}
              />

              <Button
                title="Forgot Password?"
                onPress={() => navigation.navigate('ForgotPassword')}
                variant="text"
                disabled={loading}
                style={styles.forgotButton}
              />
            </Card>
          </Animated.View>

          {/* Create Account Section */}
          <Animated.View
            entering={FadeInUp.delay(600).duration(500)}
            style={styles.createAccountSection}
          >
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <Button
              title="Create Account"
              onPress={() => navigation.navigate('Register')}
              variant="outline"
              fullWidth
              disabled={loading}
            />

          </Animated.View>

          {/* Footer branding */}
          <Animated.View
            entering={FadeInUp.delay(800).duration(400)}
            style={styles.footer}
          >
            <Text style={styles.footerText}>Premium Golf Scoring</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  innerContainer: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: SCREEN_HEIGHT * 0.08,
    paddingBottom: spacing.xl,
  },
  glowOrb: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 150,
  },
  headerSection: {
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  brandLabel: {
    fontFamily: fontFamilies.display,
    fontSize: 24,
    color: colors.text.secondary,
    letterSpacing: 4,
  },
  brandTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 52,
    color: colors.accent.gold,
    letterSpacing: 2,
    lineHeight: 56,
  },
  brandSubtitle: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    color: colors.text.primary,
    letterSpacing: 6,
  },
  tagline: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  cardWrapper: {
    marginBottom: spacing.lg,
  },
  loginCard: {
    padding: spacing.xl,
  },
  loginCardLight: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  cardTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.h3.fontSize,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  signInButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  forgotButton: {
    alignSelf: 'center',
  },
  createAccountSection: {
    marginBottom: spacing.xl,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    paddingHorizontal: spacing.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
  footerText: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    letterSpacing: 2,
  },
});

export default LoginScreen;
