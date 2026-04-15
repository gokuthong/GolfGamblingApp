import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { crossPlatformAlert } from '../utils/alert';
import { authService } from '../services/firebase';
import { dataService } from '../services/DataService';
import { useThemedColors } from '../contexts/ThemeContext';
import { typography, fontFamilies, spacing } from '../theme';

export const LoginPage = () => {
  const navigate = useNavigate();
  const colors = useThemedColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      crossPlatformAlert(
        'Validation Error',
        'Please enter a valid email address'
      );
      return;
    }

    setLoading(true);
    try {
      const userCredential = await authService.signIn(email.trim(), password);
      const approvalStatus = await dataService.getApprovalStatus(
        userCredential.uid
      );

      if (approvalStatus === 'pending') {
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
        await authService.signOut();
        crossPlatformAlert(
          'Account Not Approved',
          'Your account application was not approved. Please contact support for more information.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin();
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
        {/* Brand Section */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Typography
            sx={{
              ...typography.label,
              color: colors.text.tertiary,
              textTransform: 'uppercase',
              mb: `${spacing.sm}px`,
            }}
          >
            Golf &middot; Gambling &middot; Tracker
          </Typography>
          <Typography
            sx={{
              ...typography.display,
              color: colors.text.primary,
              mb: `${spacing.md}px`,
            }}
          >
            Tee up.
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
              maxWidth: 320,
            }}
          >
            Track scores. Settle bets. Keep the record.
          </Typography>
        </Box>

        {/* Login Card */}
        <Paper
          elevation={0}
          sx={{
            p: `${spacing.xl}px`,
            mb: `${spacing.xl}px`,
            bgcolor: colors.background.card,
            border: `1px solid ${colors.border.light}`,
            borderRadius: '20px',
          }}
        >
          <Typography
            sx={{
              ...typography.h2,
              color: colors.text.primary,
              mb: `${spacing.lg}px`,
            }}
          >
            Sign in
          </Typography>

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

          <TextField
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter password"
            fullWidth
            size="small"
            sx={{ mb: `${spacing.md}px` }}
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

          <Button
            variant="contained"
            fullWidth
            onClick={handleLogin}
            disabled={loading}
            sx={{
              mt: `${spacing.sm}px`,
              mb: `${spacing.sm}px`,
              py: 1.5,
              bgcolor: colors.accent.gold,
              color: colors.text.inverse,
              fontFamily: fontFamilies.bodySemiBold,
              fontWeight: 600,
              fontSize: typography.button.fontSize,
              borderRadius: '9999px',
              textTransform: 'none',
              '&:hover': {
                bgcolor: colors.accent.goldDark,
              },
              '&.Mui-disabled': {
                bgcolor: colors.accent.goldMuted,
                color: colors.text.disabled,
              },
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} sx={{ color: 'inherit' }} />
                Signing in...
              </Box>
            ) : (
              'Sign in'
            )}
          </Button>

          <Button
            variant="text"
            onClick={() => navigate('/forgot-password')}
            disabled={loading}
            sx={{
              display: 'block',
              mx: 'auto',
              color: colors.text.secondary,
              fontFamily: fontFamilies.body,
              fontSize: typography.bodySmall.fontSize,
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'transparent',
                color: colors.text.primary,
              },
            }}
          >
            Forgot password?
          </Button>
        </Paper>

        {/* Create Account Section */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
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
                textTransform: 'uppercase',
                letterSpacing: 1.2,
              }}
            >
              or
            </Typography>
            <Divider sx={{ flex: 1, borderColor: colors.border.light }} />
          </Box>

          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate('/register')}
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
            Create account
          </Button>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mt: 'auto',
            pt: `${spacing.lg}px`,
          }}
        >
          <Typography
            sx={{
              ...typography.bodySmall,
              color: colors.text.tertiary,
              letterSpacing: 0.8,
            }}
          >
            Premium golf scoring &middot; Est. 2024
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
