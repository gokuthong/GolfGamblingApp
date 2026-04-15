import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  CircularProgress,
  InputAdornment,
  IconButton,
  LinearProgress,
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  LockOpen as LockCheckIcon,
  Person as PersonIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { crossPlatformAlert } from "../utils/alert";
import { authService } from "../services/firebase";
import { dataService } from "../services/DataService";
import { useThemedColors } from "../contexts/ThemeContext";
import { typography, fontFamilies, spacing } from "../theme";

export const RegisterPage = () => {
  const navigate = useNavigate();
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
      return {
        valid: false,
        message: "Password must be at least 8 characters",
      };
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
          localStorage.setItem(
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
          [{ text: "OK", onPress: () => navigate("/login") }],
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
    if (!password)
      return { strength: "", color: colors.text.tertiary, width: 0 };
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleRegister();
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: colors.background.primary,
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          px: `${spacing.xl}px`,
          pt: `${spacing.xxxl}px`,
          pb: `${spacing.xl}px`,
          maxWidth: 480,
          width: "100%",
          mx: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Brand Section */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Typography
            sx={{
              ...typography.label,
              color: colors.text.tertiary,
              textTransform: "uppercase",
              mb: `${spacing.sm}px`,
            }}
          >
            Join the club
          </Typography>
          <Typography
            sx={{
              ...typography.displayMedium,
              color: colors.text.primary,
              mb: `${spacing.md}px`,
            }}
          >
            Create account
          </Typography>
          <Box
            sx={{
              height: 1.5,
              width: 48,
              bgcolor: colors.accent.gold,
              borderRadius: "1px",
              mb: `${spacing.md}px`,
            }}
          />
          <Typography
            sx={{
              ...typography.bodyLarge,
              color: colors.text.secondary,
              maxWidth: 320,
            }}
          >
            Sign up to start tracking scores, stats, and bets.
          </Typography>
        </Box>

        {/* Register Card */}
        <Paper
          elevation={0}
          sx={{
            p: `${spacing.xl}px`,
            mb: `${spacing.xl}px`,
            bgcolor: colors.background.card,
            border: `1px solid ${colors.border.light}`,
            borderRadius: "20px",
          }}
        >
          <TextField
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Your name"
            autoComplete="name"
            fullWidth
            size="small"
            sx={{ mb: `${spacing.md}px` }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon
                      sx={{ color: colors.text.tertiary, fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            type="email"
            autoComplete="email"
            placeholder="your@email.com"
            fullWidth
            size="small"
            sx={{ mb: `${spacing.md}px` }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon
                      sx={{ color: colors.text.tertiary, fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            type={showPassword ? "text" : "password"}
            placeholder="Create password"
            fullWidth
            size="small"
            sx={{
              mb: password.length > 0 ? `${spacing.sm}px` : `${spacing.md}px`,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon
                    sx={{ color: colors.text.tertiary, fontSize: 20 }}
                  />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? (
                      <VisibilityOff
                        sx={{ color: colors.text.tertiary, fontSize: 20 }}
                      />
                    ) : (
                      <Visibility
                        sx={{ color: colors.text.tertiary, fontSize: 20 }}
                      />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: `${spacing.md}px`,
                gap: `${spacing.sm}px`,
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  height: 4,
                  bgcolor: colors.border.light,
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    width: `${passwordStrength.width}%`,
                    bgcolor: passwordStrength.color,
                    borderRadius: "2px",
                    transition: "width 0.3s ease, background-color 0.3s ease",
                  }}
                />
              </Box>
              <Typography
                sx={{
                  fontFamily: fontFamilies.bodySemiBold,
                  fontSize: 11,
                  letterSpacing: 0.5,
                  width: 50,
                  textAlign: "right",
                  color: passwordStrength.color,
                  fontWeight: 600,
                }}
              >
                {passwordStrength.strength}
              </Typography>
            </Box>
          )}

          <TextField
            label="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm password"
            fullWidth
            size="small"
            sx={{ mb: `${spacing.md}px` }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockCheckIcon
                    sx={{ color: colors.text.tertiary, fontSize: 20 }}
                  />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    size="small"
                  >
                    {showConfirmPassword ? (
                      <VisibilityOff
                        sx={{ color: colors.text.tertiary, fontSize: 20 }}
                      />
                    ) : (
                      <Visibility
                        sx={{ color: colors.text.tertiary, fontSize: 20 }}
                      />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={handleRegister}
            disabled={loading}
            sx={{
              mt: `${spacing.sm}px`,
              py: 1.5,
              bgcolor: colors.accent.gold,
              color: colors.text.inverse,
              fontFamily: fontFamilies.bodySemiBold,
              fontWeight: 600,
              fontSize: typography.button.fontSize,
              borderRadius: "9999px",
              textTransform: "none",
              "&:hover": {
                bgcolor: colors.accent.goldDark,
              },
              "&.Mui-disabled": {
                bgcolor: colors.accent.goldMuted,
                color: colors.text.disabled,
              },
            }}
          >
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={18} sx={{ color: "inherit" }} />
                Creating account...
              </Box>
            ) : (
              "Create account"
            )}
          </Button>
        </Paper>

        {/* Sign In Section */}
        <Box sx={{ mb: `${spacing.lg}px` }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: `${spacing.lg}px`,
            }}
          >
            <Divider sx={{ flex: 1, borderColor: colors.border.light }} />
            <Typography
              sx={{
                ...typography.bodySmall,
                fontFamily: fontFamilies.bodyMedium,
                color: colors.text.tertiary,
                px: `${spacing.md}px`,
              }}
            >
              Already a member?
            </Typography>
            <Divider sx={{ flex: 1, borderColor: colors.border.light }} />
          </Box>

          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate("/login")}
            disabled={loading}
            sx={{
              py: 1.5,
              borderColor: colors.border.medium,
              color: colors.text.primary,
              fontFamily: fontFamilies.bodySemiBold,
              fontWeight: 600,
              fontSize: typography.button.fontSize,
              borderRadius: "9999px",
              textTransform: "none",
              "&:hover": {
                borderColor: colors.accent.gold,
                bgcolor: "transparent",
              },
            }}
          >
            Sign in
          </Button>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mt: "auto",
            pt: `${spacing.lg}px`,
          }}
        >
          <Typography
            sx={{
              ...typography.bodySmall,
              color: colors.text.tertiary,
              textAlign: "center",
              maxWidth: 320,
            }}
          >
            By creating an account, you agree to our Terms of Service and
            Privacy Policy.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterPage;
