import React from "react";
import MuiSkeleton from "@mui/material/Skeleton";
import { SxProps, Theme } from "@mui/material/styles";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  variant?: "text" | "rectangular" | "rounded" | "circular";
  sx?: SxProps<Theme>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = "rounded",
  sx,
}) => (
  <MuiSkeleton
    variant={variant}
    width={width}
    height={height}
    sx={{
      bgcolor: "rgba(255,255,255,0.06)",
      ...((sx as object) || {}),
    }}
  />
);

export default Skeleton;
