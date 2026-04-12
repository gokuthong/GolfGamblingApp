import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { crossPlatformAlert } from "../../utils/crossPlatformAlert";
import { Input, Button, Card, Icon } from "../../components/common";
import { authService } from "../../services/firebase";
import { typography, spacing, fontFamilies } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";
import { useNavigation } from "@react-navigation/native";

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemedColors();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      crossPlatformAlert("Validation Error", "Please enter your email address");
      return;
    }
    if (!validateEmail(email)) {
      crossPlatformAlert(
        "Validation Error",
        "Please enter a valid email address",
      );
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email.trim());
      setEmailSent(true);
      crossPlatformAlert(
        "Email Sent",
        "Password reset instructions have been sent to your email address.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (error: any) {
      let errorMessage = "Failed to send reset email";
      if (error.code === "auth/user-not-found")
        errorMessage = "No account found with this email address";
      else if (error.code === "auth/invalid-email")
        errorMessage = "Invalid email address";
      crossPlatformAlert("Reset Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <Icon name="lock-reset" size={40} color={colors.accent.gold} />
            </View>
            <Text style={styles.eyebrow}>Forgot your password?</Text>
            <Text style={styles.title}>Reset password</Text>
            <View style={styles.goldRule} />
            <Text style={styles.description}>
              Enter your email address and we'll send you instructions to reset
              your password.
            </Text>
          </View>

          <Card style={styles.formCard}>
            <Input
              label="Email address"
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
              title={
                loading
                  ? "Sending…"
                  : emailSent
                    ? "Email sent"
                    : "Send reset link"
              }
              onPress={handleResetPassword}
              disabled={loading || emailSent}
              loading={loading}
              variant={emailSent ? "secondary" : "gold"}
              fullWidth
              style={styles.resetButton}
            />

            {emailSent && (
              <View style={styles.successMessage}>
                <Icon
                  name="check-circle-outline"
                  size={18}
                  color={colors.scoring.positive}
                />
                <Text style={styles.successText}>Check your inbox</Text>
              </View>
            )}
          </Card>

          <View style={styles.backSection}>
            <Button
              title="Back to sign in"
              onPress={() => navigation.goBack()}
              variant="outline"
              fullWidth
              disabled={loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    keyboardView: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.xl,
    },
    headerSection: {
      marginBottom: spacing.xl,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surfaces.level2,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    eyebrow: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.displayMedium,
      color: colors.text.primary,
      marginBottom: spacing.md,
    },
    goldRule: {
      height: 1.5,
      width: 48,
      backgroundColor: colors.accent.gold,
      borderRadius: 1,
      marginBottom: spacing.md,
    },
    description: {
      ...typography.bodyLarge,
      color: colors.text.secondary,
      lineHeight: 24,
      maxWidth: 340,
    },
    formCard: {
      padding: spacing.xl,
      marginBottom: spacing.lg,
    },
    resetButton: {
      marginTop: spacing.sm,
    },
    successMessage: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    successText: {
      ...typography.bodyMedium,
      fontFamily: fontFamilies.bodySemiBold,
      color: colors.scoring.positive,
    },
    backSection: {
      marginTop: spacing.sm,
    },
  });

export default ForgotPasswordScreen;
