import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Email as EmailIcon,
  LockReset as LockResetIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { crossPlatformAlert } from '../utils/alert';
import { authService } from '../services/firebase';
import { useThemedColors } from '../contexts/ThemeContext';
import { typography, fontFamilies, spacing } from '../theme';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const colors = useThemedColors();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      crossPlatformAlert(
        'Validation Error',
        'Please enter your email address'
      );
      return;
    }
    if (!validateEmail(email)) {
      crossPlatformAlert(
        'Validation Error',
        'Please enter a valid email address'
      );
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email.trim());
      setEmailSent(true);
      crossPlatformAlert(
        'Email Sent',
        'Password reset instructions have been sent to your email address.',
        [{ text: 'OK', onPress: () => navigate('/login') }]
      );
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email';
      if (error.code === 'auth/user-not-found')
        errorMessage = 'No account found with this email address';
      else if (error.code === 'auth/invalid-email')
        errorMessage = 'Invalid email address';
      crossPlatformAlert('Reset Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && !emailSent) {
      handleResetPassword();
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: colors.background.primary,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          px: `${spacing.xl}px`,
          pt: `${spacing.xxxl}px`,
          pb: `${spacing.xl}px`,
          maxWidth: 480,
          width: '100%',
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header Section */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          {/* Icon Container */}
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: colors.surfaces.level2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: `${spacing.lg}px`,
            }}
          >
            <LockResetIcon sx={{ fontSize: 40, color: colors.accent.gold }} />
          </Box>

          <Typography
            sx={{
              ...typography.label,
              color: colors.text.tertiary,
              textTransform: 'uppercase',
              mb: `${spacing.sm}px`,
            }}
          >
            Forgot your password?
          </Typography>
          <Typography
            sx={{
              ...typography.displayMedium,
              color: colors.text.primary,
              mb: `${spacing.md}px`,
            }}
          >
            Reset password
          </Typography>
          <Box
            sx={{
              height: 1.5,
              width: 48,
              bgcolor: colors.accent.gold,
              borderRadius: '1px',
              mb: `${spacing.md}px`,
            }}
          />
          <Typography
            sx={{
              ...typography.bodyLarge,
              color: colors.text.secondary,
              lineHeight: '24px',
              maxWidth: 340,
            }}
          >
            Enter your email address and we'll send you instructions to reset
            your password.
          </Typography>
        </Box>

        {/* Form Card */}
        <Paper
          elevation={0}
          sx={{
            p: `${spacing.xl}px`,
            mb: `${spacing.lg}px`,
            bgcolor: colors.background.card,
            border: `1px solid ${colors.border.light}`,
            borderRadius: '20px',
          }}
        >
          <TextField
            label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            type="email"
            autoComplete="email"
            placeholder="your@email.com"
            fullWidth
            size="small"
            disabled={loading || emailSent}
            sx={{ mb: `${spacing.md}px` }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon
                    sx={{ color: colors.text.tertiary, fontSize: 20 }}
                  />
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={handleResetPassword}
            disabled={loading || emailSent}
            sx={{
              mt: `${spacing.sm}px`,
              py: 1.5,
              bgcolor: emailSent
                ? colors.surfaces.level3
                : colors.accent.gold,
              color: emailSent
                ? colors.text.secondary
                : colors.text.inverse,
              fontFamily: fontFamilies.bodySemiBold,
              fontWeight: 600,
              fontSize: typography.button.fontSize,
              borderRadius: '9999px',
              textTransform: 'none',
              '&:hover': {
                bgcolor: emailSent
                  ? colors.surfaces.level3
                  : colors.accent.goldDark,
              },
              '&.Mui-disabled': {
                bgcolor: emailSent
                  ? colors.surfaces.level3
                  : colors.accent.goldMuted,
                color: emailSent
                  ? colors.text.secondary
                  : colors.text.disabled,
              },
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} sx={{ color: 'inherit' }} />
                Sending...
              </Box>
            ) : emailSent ? (
              'Email sent'
            ) : (
              'Send reset link'
            )}
          </Button>

          {/* Success Message */}
          {emailSent && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mt: `${spacing.md}px`,
                gap: `${spacing.sm}px`,
              }}
            >
              <CheckCircleOutlineIcon
                sx={{ fontSize: 18, color: colors.scoring.positive }}
              />
              <Typography
                sx={{
                  ...typography.bodyMedium,
                  fontFamily: fontFamilies.bodySemiBold,
                  fontWeight: 600,
                  color: colors.scoring.positive,
                }}
              >
                Check your inbox
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Back Section */}
        <Box sx={{ mt: `${spacing.sm}px` }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate('/login')}
            disabled={loading}
            sx={{
              py: 1.5,
              borderColor: colors.border.medium,
              color: colors.text.primary,
              fontFamily: fontFamilies.bodySemiBold,
              fontWeight: 600,
              fontSize: typography.button.fontSize,
              borderRadius: '9999px',
              textTransform: 'none',
              '&:hover': {
                borderColor: colors.accent.gold,
                bgcolor: 'transparent',
              },
            }}
          >
            Back to sign in
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;
