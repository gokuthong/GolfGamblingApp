import React, { Component, ErrorInfo, ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MuiButton from "@mui/material/Button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            flex: 1,
            bgcolor: "#1a0000",
            p: "20px",
            pt: "60px",
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography
            sx={{
              color: "#ff4444",
              fontSize: 24,
              fontWeight: "bold",
              mb: 1,
            }}
          >
            App Error
          </Typography>
          <Typography
            sx={{
              color: "#ff8888",
              fontSize: 14,
              mb: 2,
            }}
          >
            The app encountered an error. Copy this info for debugging:
          </Typography>
          <Box sx={{ flex: 1, overflow: "auto" }}>
            <Typography
              sx={{
                color: "#ffcc00",
                fontSize: 14,
                fontWeight: "bold",
                mt: 1.5,
                mb: 0.5,
              }}
            >
              Error:
            </Typography>
            <Typography
              sx={{
                color: "#ff8888",
                fontSize: 14,
                userSelect: "text",
              }}
            >
              {this.state.error?.toString()}
            </Typography>
            <Typography
              sx={{
                color: "#ffcc00",
                fontSize: 14,
                fontWeight: "bold",
                mt: 1.5,
                mb: 0.5,
              }}
            >
              Stack:
            </Typography>
            <Typography
              sx={{
                color: "#ffaaaa",
                fontSize: 11,
                userSelect: "text",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {this.state.error?.stack || "No stack trace"}
            </Typography>
            {this.state.errorInfo?.componentStack && (
              <>
                <Typography
                  sx={{
                    color: "#ffcc00",
                    fontSize: 14,
                    fontWeight: "bold",
                    mt: 1.5,
                    mb: 0.5,
                  }}
                >
                  Component Stack:
                </Typography>
                <Typography
                  sx={{
                    color: "#ffaaaa",
                    fontSize: 11,
                    userSelect: "text",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {this.state.errorInfo.componentStack}
                </Typography>
              </>
            )}
          </Box>
          <MuiButton
            variant="contained"
            onClick={() =>
              this.setState({ hasError: false, error: null, errorInfo: null })
            }
            sx={{
              bgcolor: "#cc0000",
              color: "#ffffff",
              fontSize: 16,
              fontWeight: "bold",
              p: 2,
              borderRadius: "8px",
              mt: 2,
              "&:hover": {
                bgcolor: "#aa0000",
              },
            }}
          >
            Try Again
          </MuiButton>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
