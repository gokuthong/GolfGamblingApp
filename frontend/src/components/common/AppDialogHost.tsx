import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { motion } from "framer-motion";
import { useThemedColors } from "../../contexts/ThemeContext";
import { fontFamilies, spacing, borderRadius } from "../../theme";
import { Button } from "./Button";
import {
  registerAlertHandler,
  type AlertRequest,
  type AlertButton,
} from "../../utils/alert";

// A red "destructive" pill that mirrors the gold primary button's shape/feel
// but signals a dangerous action (delete, discard, etc.).
const DestructiveButton: React.FC<{ title: string; onPress: () => void }> = ({
  title,
  onPress,
}) => {
  const colors = useThemedColors();
  return (
    <motion.button
      onClick={onPress}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minHeight: 40,
        border: "none",
        cursor: "pointer",
        borderRadius: `${borderRadius.full}px`,
        background: `linear-gradient(135deg, ${colors.status.error}, ${colors.scoring.negative})`,
        boxShadow: `0px 6px 14px ${colors.status.error}33`,
        outline: "none",
      }}
    >
      <Typography
        sx={{
          fontFamily: fontFamilies.bodySemiBold,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "0.2px",
          color: "#FFFFFF",
        }}
      >
        {title}
      </Typography>
    </motion.button>
  );
};

/**
 * Global host for in-app alerts/confirms. Mounted once near the app root.
 * Listens for `crossPlatformAlert(...)` calls and renders a themed MUI dialog
 * instead of the browser's native window.alert / window.confirm.
 *
 * Requests are queued so rapid successive alerts (e.g. an error followed by a
 * navigation prompt) are shown one at a time rather than clobbering each other.
 */
export const AppDialogHost: React.FC = () => {
  const colors = useThemedColors();
  const [queue, setQueue] = useState<AlertRequest[]>([]);
  const current = queue[0];

  useEffect(() => {
    registerAlertHandler((request) => setQueue((q) => [...q, request]));
    return () => registerAlertHandler(null);
  }, []);

  const dismiss = (button?: AlertButton) => {
    setQueue((q) => q.slice(1));
    button?.onPress?.();
  };

  // Normalize: an alert with no buttons becomes a single "OK".
  const buttons: AlertButton[] =
    current && current.buttons && current.buttons.length > 0
      ? current.buttons
      : [{ text: "OK", style: "default" }];

  // 3+ buttons stack vertically so labels never get cramped.
  const stack = buttons.length > 2;

  const handleClose = () => {
    // Backdrop / Esc dismissal behaves like the cancel action when one exists,
    // otherwise it just closes (firing the lone button's action, if any).
    const cancelButton = buttons.find((b) => b.style === "cancel");
    dismiss(cancelButton ?? (buttons.length === 1 ? undefined : undefined));
  };

  return (
    <Dialog
      open={!!current}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            bgcolor: colors.background.primary,
            borderRadius: `${borderRadius.lg}px`,
            border: `1px solid ${colors.border.light}`,
            backgroundImage: "none",
            minWidth: { xs: "90vw", sm: 360 },
            maxWidth: 440,
          },
        },
      }}
    >
      {current && (
        <>
          <DialogTitle
            sx={{
              fontFamily: fontFamilies.bodySemiBold,
              fontWeight: 700,
              fontSize: 18,
              color: colors.text.primary,
              letterSpacing: "-0.2px",
              pb: current.message ? `${spacing.xs}px` : `${spacing.sm}px`,
            }}
          >
            {current.title}
          </DialogTitle>
          {current.message && (
            <DialogContent>
              <DialogContentText
                sx={{
                  fontFamily: fontFamilies.body,
                  fontSize: 14,
                  color: colors.text.secondary,
                  lineHeight: 1.5,
                  whiteSpace: "pre-line",
                }}
              >
                {current.message}
              </DialogContentText>
            </DialogContent>
          )}
          <DialogActions
            sx={{
              px: `${spacing.md}px`,
              pb: `${spacing.md}px`,
              pt: current.message ? 0 : `${spacing.sm}px`,
              gap: `${spacing.sm}px`,
              flexDirection: stack ? "column-reverse" : "row",
            }}
          >
            {buttons.map((button, index) => (
              <Box
                key={`${button.text}-${index}`}
                sx={{
                  flex: stack ? "none" : 1,
                  width: stack ? "100%" : "auto",
                  m: 0,
                }}
              >
                {button.style === "destructive" ? (
                  <DestructiveButton
                    title={button.text}
                    onPress={() => dismiss(button)}
                  />
                ) : (
                  <Button
                    title={button.text}
                    variant={button.style === "cancel" ? "outline" : "gold"}
                    size="small"
                    onPress={() => dismiss(button)}
                    style={{ width: "100%" }}
                  />
                )}
              </Box>
            ))}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default AppDialogHost;
