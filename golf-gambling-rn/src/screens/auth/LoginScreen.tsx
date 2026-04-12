import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { crossPlatformAlert } from "../../utils/crossPlatformAlert";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Card, Divider } from "../../components/common";
import { authService } from "../../services/firebase";
import { dataService } from "../../services/DataService";
import { typography, spacing, fontFamilies } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../types";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "Login"
>;

export const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const colors = useThemedColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      crossPlatformAlert("Validation Error", "Please fill in all fields");
      return;
    }
    if (!validateEmail(email.trim())) {
      crossPlatformAlert(
        "Validation Error",
        "Please enter a valid email address",
      );
      return;
    }

    setLoading(true);
    try {
      const userCredential = await authService.signIn(email.trim(), password);
      const approvalStatus = await dataService.getApprovalStatus(
        userCredential.uid,
      );

      if (approvalStatus === "pending") {
        await authService.signOut();
        crossPlatformAlert(
          "Account Pending Approval",
          "Your account is awaiting administrator approval. Please check back later.",
          [{ text: "OK" }],
        );
        setLoading(false);
        return;
      }

      if (approvalStatus === "rejected") {
        await authService.signOut();
        crossPlatformAlert(
          "Account Not Approved",
          "Your account application was not approved. Please contact support for more information.",
          [{ text: "OK" }],
        );
        setLoading(false);
        return;
      }
    } catch (error: any) {
      let errorMessage = "Failed to sign in";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled";
      }
      crossPlatformAlert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandSection}>
            <Text style={styles.eyebrow}>Golf · Gambling · Tracker</Text>
            <Text style={styles.brandTitle}>Tee up.</Text>
            <View style={styles.goldRule} />
            <Text style={styles.tagline}>
              Track scores. Settle bets. Keep the record.
            </Text>
          </View>

          <Card style={styles.loginCard}>
            <Text style={styles.cardTitle}>Sign in</Text>

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
              rightIcon={showPassword ? "eye-off" : "eye"}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <Button
              title={loading ? "Signing in…" : "Sign in"}
              onPress={handleLogin}
              disabled={loading}
              loading={loading}
              variant="gold"
              fullWidth
              style={styles.signInButton}
            />

            <Button
              title="Forgot password?"
              onPress={() => navigation.navigate("ForgotPassword")}
              variant="text"
              disabled={loading}
              style={styles.forgotButton}
            />
          </Card>

          <View style={styles.createSection}>
            <View style={styles.dividerRow}>
              <Divider thin style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <Divider thin style={styles.dividerLine} />
            </View>

            <Button
              title="Create account"
              onPress={() => navigation.navigate("Register")}
              variant="outline"
              fullWidth
              disabled={loading}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Premium golf scoring · Est. 2024
            </Text>
          </View>
        </ScrollView>
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
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.xl,
    },
    brandSection: {
      marginBottom: spacing.xl,
    },
    eyebrow: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    brandTitle: {
      ...typography.display,
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
    tagline: {
      ...typography.bodyLarge,
      color: colors.text.secondary,
      lineHeight: 24,
      maxWidth: 320,
    },
    loginCard: {
      padding: spacing.xl,
      marginBottom: spacing.xl,
    },
    cardTitle: {
      ...typography.h2,
      color: colors.text.primary,
      marginBottom: spacing.lg,
    },
    signInButton: {
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    forgotButton: {
      alignSelf: "center",
    },
    createSection: {
      marginBottom: spacing.xl,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    dividerLine: {
      flex: 1,
      marginVertical: 0,
    },
    dividerText: {
      ...typography.bodySmall,
      fontFamily: fontFamilies.bodyMedium,
      color: colors.text.tertiary,
      paddingHorizontal: spacing.md,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    footer: {
      alignItems: "center",
      marginTop: "auto",
      paddingTop: spacing.lg,
    },
    footerText: {
      ...typography.bodySmall,
      color: colors.text.tertiary,
      letterSpacing: 0.8,
    },
  });

export default LoginScreen;
