import React from "react";
import Box from "@mui/material/Box";
import { SxProps, Theme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { Skeleton } from "./Skeleton";
import { useThemedColors } from "../../contexts/ThemeContext";
import { spacing, borderRadius, shadows } from "../../theme";

interface CardProps {
  children: React.ReactNode;
  elevation?: 0 | 1 | 2 | 3 | 4;
  padding?: number;
  gradient?: string[];
  glassMorphism?: boolean;
  goldBorder?: boolean;
  onClick?: () => void;
  loading?: boolean;
  sx?: SxProps<Theme>;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevation = 1,
  padding = spacing.lg,
  gradient,
  glassMorphism = false,
  goldBorder = false,
  onClick,
  loading = false,
  sx,
}) => {
  const colors = useThemedColors();

  const baseBg = glassMorphism
    ? colors.glass.medium
    : gradient
      ? "transparent"
      : colors.background.card;

  const borderColor = goldBorder
    ? colors.border.goldSubtle
    : glassMorphism
      ? colors.glass.border
      : colors.border.light;

  const shadowColor = goldBorder ? colors.shadowColors.gold : shadows.medium;

  const cardSx: SxProps<Theme> = {
    backgroundColor: baseBg,
    borderRadius: `${borderRadius.xl}px`,
    padding: `${padding}px`,
    overflow: "hidden",
    border: `1px solid ${borderColor}`,
    boxShadow: shadowColor,
    position: "relative",
    ...(glassMorphism
      ? {
          backdropFilter: `blur(${colors.glass.blur}px)`,
          WebkitBackdropFilter: `blur(${colors.glass.blur}px)`,
        }
      : {}),
    ...((sx as object) || {}),
  };

  if (loading) {
    return (
      <Box sx={cardSx}>
        <Skeleton height={100} />
      </Box>
    );
  }

  const gradientOverlay = gradient ? (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(135deg, ${gradient.join(", ")})`,
        borderRadius: `${borderRadius.xl}px`,
      }}
    />
  ) : null;

  const content = (
    <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>
  );

  if (onClick) {
    return (
      <motion.div
        onClick={onClick}
        whileTap={{ y: 1, scale: 0.995 }}
        whileHover={{ y: -1 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        style={{ cursor: "pointer" }}
      >
        <Box sx={cardSx}>
          {gradientOverlay}
          {content}
        </Box>
      </motion.div>
    );
  }

  return (
    <Box sx={cardSx}>
      {gradientOverlay}
      {content}
    </Box>
  );
};

export default Card;
