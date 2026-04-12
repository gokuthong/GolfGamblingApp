import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { crossPlatformAlert } from "../../utils/crossPlatformAlert";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Input, Button, Card, Divider } from "../../components/common";
import { authService } from "../../services/firebase";
import { dataService } from "../../services/DataService";
import { typography, spacing, fontFamilies } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";
import { useNavigation } from "@react-navigation/native";

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemedColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (
    password: string,
  ): { valid: boolean; message?: string } => {
    if (password.length < 8)
      return { valid: false, message: "Password must be at least 8 characters" };
    if (!/[A-Z]/.test(password))
      return {
        valid: false,
        message: "Password must contain an uppercase letter",
      };
    if (!/[a-z]/.test(password))
      return {
        valid: false,
        message: "Password must contain a lowercase letter",
      };
    if (!/[0-9]/.test(password))
      return { valid: false, message: "Password must contain a number" };
    return { valid: true };
  };

  const validateForm = (): boolean => {
    if (!email.trim()) {
      crossPlatformAlert("Validation Error", "Please enter your email");
      return false;
    }
    if (!validateEmail(email)) {
      crossPlatformAlert(
        "Validation Error",
        "Please enter a valid email address",
      );
      return false;
    }
    if (!displayName.trim()) {
      crossPlatformAlert("Validation Error", "Please enter your display name");
      return false;
    }
    if (displayName.trim().length < 2) {
      crossPlatformAlert(
        "Validation Error",
        "Display name must be at least 2 characters",
      );
      return false;
    }
    if (displayName.trim().length > 50) {
      crossPlatformAlert(
        "Validation Error",
        "Display name must be less than 50 characters",
      );
      return false;
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      crossPlatformAlert(
        "Validation Error",
        passwordValidation.message || "Invalid password",
      );
      return false;
    }
    if (password !== confirmPassword) {
      crossPlatformAlert("Validation Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const userCredential = await authService.signUp(
        email.trim(),
        password,
        displayName.trim(),
      );
      const userNumber = await dataService.createUserProfile(
        userCredential.uid,
        email.trim(),
        displayName.trim(),
      );

      if (userNumber === "001") {
        await dataService.setUserRole(userCredential.uid, "super_admin");
        await dataService.setApprovalStatus(userCredential.uid, "approved");
        const profile = await dataService.getUserProfile(userCredential.uid);
        if (profile) {
          await AsyncStorage.setItem(
            `@user:${userCredential.uid}`,
            JSON.stringify({
              ...profile,
              role: "super_admin",
              approvalStatus: "approved",
            }),
          );
        }
        crossPlatformAlert(
          "Welcome, Super Admin!",
          `Your account (#${userNumber}) has been created with administrator privileges. You are now signed in.`,
          [{ text: "OK", onPress: () => navigation.goBack() }],
        );
      } else {
        await dataService.setApprovalStatus(userCredential.uid, "pending");
        await dataService.addPendingUser(userCredential.uid, {
          email: email.trim(),
          displayName: displayName.trim(),
          userNumber,
        });
        await authService.signOut();
        crossPlatformAlert(
          "Account Created",
          `Your account (#${userNumber}) is pending approval by an administrator. You'll be able to sign in once your account is approved.`,
          [{ text: "OK" }],
        );
      }
    } catch (error: any) {
      let errorMessage = "Failed to create account";
      if (error.code === "auth/email-already-in-use")
        errorMessage = "This email is already registered";
      else if (error.code === "auth/invalid-email")
        errorMessage = "Invalid email address";
      else if (error.code === "auth/weak-password")
        errorMessage = "Password is too weak";
      crossPlatformAlert("Registration Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (): {
    strength: string;
    color: string;
    width: number;
  } => {
    if (!password) return { strength: "", color: colors.text.tertiary, width: 0 };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2)
      return { strength: "Weak", color: colors.scoring.negative, width: 25 };
    if (score === 3) return { strength: "Fair", color: "#C98A2E", width: 50 };
    if (score === 4)
      return { strength: "Good", color: colors.primary[500], width: 75 };
    return { strength: "Strong", color: colors.scoring.positive, width: 100 };
  };

  const passwordStrength = getPasswordStrength();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandSection}>
            <Text style={styles.eyebrow}>Join the club</Text>
            <Text style={styles.brandTitle}>Create account</Text>
            <View style={styles.goldRule} />
            <Text style={styles.tagline}>
              Sign up to start tracking scores, stats, and bets.
            </Text>
          </View>

          <Card style={styles.registerCard}>
            <Input
              label="Display name"
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
              rightIcon={showPassword ? "eye-off" : "eye"}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBarBg}>
                  <View
                    style={[
                      styles.strengthBarFill,
                      {
                        width: `${passwordStrength.width}%`,
                        backgroundColor: passwordStrength.color,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.strengthText, { color: passwordStrength.color }]}
                >
                  {passwordStrength.strength}
                </Text>
              </View>
            )}

            <Input
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholder="Confirm password"
              leftIcon="lock-check-outline"
              rightIcon={showConfirmPassword ? "eye-off" : "eye"}
              onRightIconPress={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
            />

            <Button
              title={loading ? "Creating account…" : "Create account"}
              onPress={handleRegister}
              disabled={loading}
              loading={loading}
              variant="gold"
              fullWidth
              style={styles.registerButton}
            />
          </Card>

          <View style={styles.signInSection}>
            <View style={styles.dividerRow}>
              <Divider thin style={styles.dividerLine} />
              <Text style={styles.dividerText}>Already a member?</Text>
              <Divider thin style={styles.dividerLine} />
            </View>
            <Button
              title="Sign in"
              onPress={() => navigation.goBack()}
              variant="outline"
              fullWidth
              disabled={loading}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By creating an account, you agree to our Terms of Service and
              Privacy Policy.
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
    tagline: {
      ...typography.bodyLarge,
      color: colors.text.secondary,
      maxWidth: 320,
    },
    registerCard: {
      padding: spacing.xl,
      marginBottom: spacing.xl,
    },
    strengthContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: -spacing.sm,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    strengthBarBg: {
      flex: 1,
      height: 4,
      backgroundColor: colors.border.light,
      borderRadius: 2,
      overflow: "hidden",
    },
    strengthBarFill: {
      height: "100%",
      borderRadius: 2,
    },
    strengthText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 11,
      letterSpacing: 0.5,
      width: 50,
      textAlign: "right",
    },
    registerButton: {
      marginTop: spacing.sm,
    },
    signInSection: {
      marginBottom: spacing.lg,
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
    },
    footer: {
      alignItems: "center",
      marginTop: "auto",
      paddingTop: spacing.lg,
    },
    footerText: {
      ...typography.bodySmall,
      color: colors.text.tertiary,
      textAlign: "center",
      maxWidth: 320,
    },
  });

export default RegisterScreen;
