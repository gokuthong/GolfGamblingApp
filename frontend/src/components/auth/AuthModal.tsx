import React from 'react';
import {
  Dialog,
  Box,
  Typography,
  Button,
  Slide,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { useThemedColors } from '../../contexts/ThemeContext';
import { fontFamilies, spacing } from '../../theme';

const SlideUp = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSignUp: () => void;
  onSignIn: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  onSignUp,
  onSignIn,
}) => {
  const colors = useThemedColors();

  return (
    <Dialog
      open={visible}
      onClose={onClose}
      TransitionComponent={SlideUp}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          position: 'fixed',
          bottom: 0,
          m: 0,
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          bgcolor: colors.background.card,
          borderTop: `1px solid ${colors.border.light}`,
          borderLeft: `1px solid ${colors.border.light}`,
          borderRight: `1px solid ${colors.border.light}`,
          px: '24px',
          pt: '12px',
          pb: '40px',
          minHeight: '40vh',
          maxHeight: '80vh',
          width: '100%',
          maxWidth: 600,
        },
      }}
      sx={{
        '& .MuiBackdrop-root': {
          bgcolor: 'rgba(0, 0, 0, 0.7)',
        },
      }}
    >
      {/* Handle */}
      <Box
        sx={{
          width: 40,
          height: 4,
          bgcolor: colors.border.medium,
          borderRadius: '2px',
          mx: 'auto',
          mb: '20px',
        }}
      />

      {/* Title */}
      <Typography
        sx={{
          fontSize: 28,
          fontFamily: fontFamilies.heading,
          fontWeight: 600,
          color: colors.text.primary,
          textAlign: 'center',
          mb: '8px',
        }}
      >
        Welcome to Golf Gambling
      </Typography>

      {/* Subtitle */}
      <Typography
        sx={{
          fontSize: 16,
          fontFamily: fontFamilies.body,
          color: colors.text.secondary,
          textAlign: 'center',
          mb: '32px',
          lineHeight: '22px',
        }}
      >
        Sign up to sync your data and access online features
      </Typography>

      {/* Buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Sign Up */}
        <Button
          variant="contained"
          fullWidth
          onClick={() => {
            onClose();
            onSignUp();
          }}
          sx={{
            py: 1.5,
            bgcolor: colors.accent.gold,
            color: colors.text.inverse,
            fontFamily: fontFamilies.bodySemiBold,
            fontWeight: 600,
            fontSize: 15,
            borderRadius: '9999px',
            textTransform: 'none',
            '&:hover': {
              bgcolor: colors.accent.goldDark,
            },
          }}
        >
          Sign Up
        </Button>

        {/* Sign In */}
        <Button
          variant="outlined"
          fullWidth
          onClick={() => {
            onClose();
            onSignIn();
          }}
          sx={{
            py: 1.5,
            borderColor: colors.border.medium,
            color: colors.text.primary,
            fontFamily: fontFamilies.bodySemiBold,
            fontWeight: 600,
            fontSize: 15,
            borderRadius: '9999px',
            textTransform: 'none',
            '&:hover': {
              borderColor: colors.accent.gold,
              bgcolor: 'transparent',
            },
          }}
        >
          Sign In
        </Button>

        {/* Continue as Guest */}
        <Button
          variant="text"
          fullWidth
          onClick={onClose}
          sx={{
            py: 2,
            color: colors.text.secondary,
            fontFamily: fontFamilies.body,
            fontSize: 16,
            textTransform: 'none',
            textDecoration: 'underline',
            '&:hover': {
              bgcolor: 'transparent',
              textDecoration: 'underline',
              color: colors.text.primary,
            },
          }}
        >
          Continue as Guest
        </Button>
      </Box>
    </Dialog>
  );
};

export default AuthModal;
