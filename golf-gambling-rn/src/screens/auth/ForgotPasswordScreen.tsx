import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { crossPlatformAlert } from '../../utils/crossPlatformAlert';
import Animated, {
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Input, Button, Card, Icon } from '../../components/common';
import { authService } from '../../services/firebase';
import { typography, spacing, fontFamilies } from '../../theme';
import { useThemedColors } from '../../contexts/ThemeContext';
import { useStore } from '../../store';
import { useNavigation } from '@react-navigation/native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemedColors();
  const settings = useStore((state) => state.settings);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Lock icon animation
  const lockRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    lockRotate.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 200 }),
        withTiming(5, { duration: 400 }),
        withTiming(0, { duration: 200 })
      ),
      -1,
      false
    );
    glowOpacity.value = withRepeat(
      withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const lockStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${lockRotate.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const styles = useMemo(() => createStyles(colors), [colors]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      crossPlatformAlert('Validation Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      crossPlatformAlert('Validation Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email.trim());
      setEmailSent(true);
      crossPlatformAlert(
        'Email Sent',
        'Password reset instructions have been sent to your email address.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      crossPlatformAlert('Reset Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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

      {/* Decorative glow orb */}
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
        <View style={styles.content}>
          {/* Header with animated lock icon */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(600)}
            style={styles.headerSection}
          >
            <Animated.View style={[styles.iconContainer, lockStyle]}>
              <Icon name="lock-reset" size={64} color={colors.accent.gold} />
            </Animated.View>
            <Text style={styles.title}>RESET</Text>
            <Text style={styles.subtitle}>PASSWORD</Text>
          </Animated.View>

          {/* Description */}
          <Animated.Text
            entering={FadeInUp.delay(200).duration(500)}
            style={styles.description}
          >
            Enter your email address and we'll send you instructions to reset your password.
          </Animated.Text>

          {/* Form Card */}
          <Animated.View
            entering={FadeInUp.delay(300).duration(600)}
            style={styles.cardWrapper}
          >
            <Card glass goldBorder style={styles.formCard}>
              <Input
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon="email-outline"
                editable={!loading && !emailSent}
              />

              <Button
                title={loading ? 'Sending...' : emailSent ? 'Email Sent' : 'Send Reset Link'}
                onPress={handleResetPassword}
                disabled={loading || emailSent}
                loading={loading}
                variant={emailSent ? 'secondary' : 'gold'}
                glow={!emailSent}
                fullWidth
                style={styles.resetButton}
              />

              {emailSent && (
                <View style={styles.successMessage}>
                  <Icon name="check-circle" size={20} color={colors.scoring.positive} />
                  <Text style={styles.successText}>Check your inbox</Text>
                </View>
              )}
            </Card>
          </Animated.View>

          {/* Back button */}
          <Animated.View
            entering={FadeInUp.delay(500).duration(500)}
            style={styles.backSection}
          >
            <Button
              title="Back to Sign In"
              onPress={() => navigation.goBack()}
              variant="outline"
              fullWidth
              disabled={loading}
            />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  glowOrb: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.1,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 100,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 48,
    color: colors.accent.gold,
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    color: colors.text.primary,
    letterSpacing: 6,
    marginTop: -spacing.xs,
  },
  description: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    lineHeight: 24,
  },
  cardWrapper: {
    marginBottom: spacing.xl,
  },
  formCard: {
    padding: spacing.xl,
  },
  resetButton: {
    marginTop: spacing.sm,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  successText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.scoring.positive,
  },
  backSection: {
    marginTop: spacing.md,
  },
});

export default ForgotPasswordScreen;
