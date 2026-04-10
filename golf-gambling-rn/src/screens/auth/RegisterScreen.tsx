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
import { SafeAreaView } from 'react-native-safe-area-context';
import { crossPlatformAlert } from '../../utils/crossPlatformAlert';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Input, Button, Card } from '../../components/common';
import { authService } from '../../services/firebase';
import { dataService } from '../../services/DataService';
import { typography, spacing, fontFamilies } from '../../theme';
import { useThemedColors } from '../../contexts/ThemeContext';
import { useStore } from '../../store';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemedColors();
  const settings = useStore((state) => state.settings);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain an uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain a lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain a number' };
    }
    return { valid: true };
  };

  const validateForm = (): boolean => {
    if (!email.trim()) {
      crossPlatformAlert('Validation Error', 'Please enter your email');
      return false;
    }
    if (!validateEmail(email)) {
      crossPlatformAlert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    if (!displayName.trim()) {
      crossPlatformAlert('Validation Error', 'Please enter your display name');
      return false;
    }
    if (displayName.trim().length < 2) {
      crossPlatformAlert('Validation Error', 'Display name must be at least 2 characters');
      return false;
    }
    if (displayName.trim().length > 50) {
      crossPlatformAlert('Validation Error', 'Display name must be less than 50 characters');
      return false;
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      crossPlatformAlert('Validation Error', passwordValidation.message || 'Invalid password');
      return false;
    }
    if (password !== confirmPassword) {
      crossPlatformAlert('Validation Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userCredential = await authService.signUp(email.trim(), password, displayName.trim());

      // Create user profile with unique user number
      const userNumber = await dataService.createUserProfile(
        userCredential.uid,
        email.trim(),
        displayName.trim()
      );

      // Check if this is the first user (User #001)
      if (userNumber === '001') {
        // First user automatically becomes super admin
        await dataService.setUserRole(userCredential.uid, 'super_admin');
        await dataService.setApprovalStatus(userCredential.uid, 'approved');

        // Update the stored profile with super_admin role
        const profile = await dataService.getUserProfile(userCredential.uid);
        if (profile) {
          await AsyncStorage.setItem(
            `@user:${userCredential.uid}`,
            JSON.stringify({
              ...profile,
              role: 'super_admin',
              approvalStatus: 'approved',
            })
          );
        }

        crossPlatformAlert(
          'Welcome, Super Admin!',
          `Your account (#${userNumber}) has been created with administrator privileges. You are now signed in.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        // Subsequent users need approval
        await dataService.setApprovalStatus(userCredential.uid, 'pending');

        // Add to pending users list for admin approval
        await dataService.addPendingUser(userCredential.uid, {
          email: email.trim(),
          displayName: displayName.trim(),
          userNumber,
        });

        // Sign out immediately - keep user in guest mode
        await authService.signOut();

        crossPlatformAlert(
          'Account Created',
          `Your account (#${userNumber}) is pending approval by an administrator. You'll be able to sign in once your account is approved.`,
          [
            {
              text: 'OK',
            },
          ]
        );
      }
    } catch (error: any) {
      let errorMessage = 'Failed to create account';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
      crossPlatformAlert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (): { strength: string; color: string; width: number } => {
    if (!password) return { strength: '', color: colors.text.secondary, width: 0 };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { strength: 'Weak', color: colors.scoring.negative, width: 25 };
    if (score === 3) return { strength: 'Fair', color: '#FFA500', width: 50 };
    if (score === 4) return { strength: 'Good', color: colors.primary[500], width: 75 };
    return { strength: 'Strong', color: colors.scoring.positive, width: 100 };
  };

  const passwordStrength = getPasswordStrength();

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
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(600)}
            style={styles.headerSection}
          >
            <Text style={styles.brandLabel}>JOIN THE</Text>
            <Text style={styles.brandTitle}>CLUB</Text>
          </Animated.View>

          {/* Tagline */}
          <Animated.Text
            entering={FadeInUp.delay(200).duration(500)}
            style={styles.tagline}
          >
            Create your account to start tracking
          </Animated.Text>

          {/* Register Card */}
          <Animated.View
            entering={FadeInUp.delay(300).duration(600)}
            style={styles.cardWrapper}
          >
            <Card glass goldBorder style={styles.registerCard}>
              <Text style={styles.cardTitle}>Sign Up</Text>

              <Input
                label="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                autoCapitalize="words"
                leftIcon="account-outline"
              />

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon="email-outline"
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Create password"
                leftIcon="lock-outline"
                rightIcon={showPassword ? 'eye-off' : 'eye'}
                onRightIconPress={() => setShowPassword(!showPassword)}
              />

              {/* Password strength indicator */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarBg}>
                    <Animated.View
                      style={[
                        styles.strengthBarFill,
                        { width: `${passwordStrength.width}%`, backgroundColor: passwordStrength.color },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                    {passwordStrength.strength}
                  </Text>
                </View>
              )}

              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholder="Confirm password"
                leftIcon="lock-check-outline"
                rightIcon={showConfirmPassword ? 'eye-off' : 'eye'}
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />

              <Button
                title={loading ? 'Creating Account...' : 'Create Account'}
                onPress={handleRegister}
                disabled={loading}
                loading={loading}
                variant="gold"
                glow
                fullWidth
                style={styles.registerButton}
              />
            </Card>
          </Animated.View>

          {/* Sign In Section */}
          <Animated.View
            entering={FadeInUp.delay(500).duration(500)}
            style={styles.signInSection}
          >
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>ALREADY HAVE AN ACCOUNT?</Text>
              <View style={styles.divider} />
            </View>

            <Button
              title="Sign In"
              onPress={() => navigation.goBack()}
              variant="outline"
              fullWidth
              disabled={loading}
            />
          </Animated.View>

          {/* Footer */}
          <Animated.View
            entering={FadeInUp.delay(700).duration(400)}
            style={styles.footer}
          >
            <Text style={styles.footerText}>
              By creating an account, you agree to our{'\n'}
              Terms of Service and Privacy Policy
            </Text>
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
    paddingTop: SCREEN_HEIGHT * 0.06,
    paddingBottom: spacing.xl,
  },
  glowOrb: {
    position: 'absolute',
    top: -100,
    left: -100,
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
    fontSize: 20,
    color: colors.text.secondary,
    letterSpacing: 4,
  },
  brandTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 56,
    color: colors.accent.gold,
    letterSpacing: 2,
    lineHeight: 60,
  },
  tagline: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  cardWrapper: {
    marginBottom: spacing.lg,
  },
  registerCard: {
    padding: spacing.xl,
  },
  cardTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.h3.fontSize,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  strengthBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border.light,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
    width: 50,
    textAlign: 'right',
  },
  registerButton: {
    marginTop: spacing.sm,
  },
  signInSection: {
    marginBottom: spacing.lg,
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
    fontSize: 10,
    color: colors.text.tertiary,
    paddingHorizontal: spacing.md,
    letterSpacing: 1,
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
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RegisterScreen;
