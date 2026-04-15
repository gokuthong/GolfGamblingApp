import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { motion } from "framer-motion";
import { useThemedColors } from "../../contexts/ThemeContext";
import { typography, spacing, borderRadius, animations } from "../../theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "text" | "gold";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: React.CSSProperties;
  textStyle?: React.CSSProperties;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  sx?: Record<string, unknown>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  iconPosition = "left",
  sx,
}) => {
  const colors = useThemedColors();

  const isPrimary = variant === "primary" || variant === "gold";
  const isSecondary = variant === "secondary";
  const isOutline = variant === "outline";
  const isText = variant === "text";

  const sizeConfig = (() => {
    switch (size) {
      case "small":
        return {
          height: 40,
          px: spacing.md,
          iconSize: 16,
          radius: borderRadius.full,
        };
      case "large":
        return {
          height: 56,
          px: spacing.xl,
          iconSize: 22,
          radius: borderRadius.full,
        };
      default:
        return {
          height: 48,
          px: spacing.lg,
          iconSize: 20,
          radius: borderRadius.full,
        };
    }
  })();

  // Secondary + outline use rounded-lg (less dominant); primary/gold are pill
  const radius =
    isSecondary || isOutline ? borderRadius.lg : sizeConfig.radius;

  const textColor = (() => {
    if (isPrimary) return colors.text.inverse;
    if (isSecondary) return colors.text.primary;
    return colors.text.primary;
  })();

  const backgroundColor = (() => {
    if (isPrimary) return "transparent"; // gradient handles it
    if (isSecondary) return colors.background.card;
    return "transparent";
  })();

  const borderStyle: React.CSSProperties = isOutline
    ? { border: `1.5px solid ${colors.accent.gold}` }
    : isSecondary
      ? { border: `1px solid ${colors.border.light}` }
      : {};

  const labelFontSize = (() => {
    if (size === "small") return typography.buttonSmall.fontSize;
    if (size === "large") return 17;
    return typography.button.fontSize;
  })();

  return (
    <motion.button
      onClick={disabled || loading ? undefined : onPress}
      whileTap={
        disabled || loading ? undefined : { scale: animations.scale.pressIn }
      }
      whileHover={
        disabled || loading ? undefined : { scale: animations.scale.hover }
      }
      transition={{ duration: 0.12, ease: "easeOut" }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: sizeConfig.height,
        paddingLeft: isText ? 0 : sizeConfig.px,
        paddingRight: isText ? 0 : sizeConfig.px,
        backgroundColor,
        borderRadius: radius,
        overflow: "hidden",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.45 : 1,
        width: fullWidth ? "100%" : undefined,
        position: "relative",
        outline: "none",
        ...borderStyle,
        ...(isPrimary
          ? {
              boxShadow: `0px 6px 14px ${colors.accent.gold}20`,
            }
          : {}),
        ...style,
        ...(sx as React.CSSProperties),
      }}
    >
      {/* Gold gradient background for primary/gold */}
      {isPrimary && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${colors.accent.gold}, ${colors.accent.goldDark})`,
            borderRadius: `${radius}px`,
          }}
        />
      )}

      {/* Content */}
      <Box
        sx={{
          display: "flex",
          flexDirection: iconPosition === "right" ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {loading ? (
          <CircularProgress size={20} sx={{ color: textColor }} />
        ) : (
          <>
            {icon && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: textColor,
                  "& .MuiSvgIcon-root": {
                    fontSize: sizeConfig.iconSize,
                  },
                }}
              >
                {icon}
              </Box>
            )}
            <Typography
              noWrap
              sx={{
                fontFamily: typography.button.fontFamily,
                fontSize: labelFontSize,
                fontWeight: 600,
                letterSpacing: "0.2px",
                color: textColor,
                ...(isText
                  ? {
                      color: colors.accent.gold,
                      textDecoration: "underline",
                    }
                  : {}),
                ...textStyle,
              }}
            >
              {title}
            </Typography>
          </>
        )}
      </Box>
    </motion.button>
  );
};

export default Button;
