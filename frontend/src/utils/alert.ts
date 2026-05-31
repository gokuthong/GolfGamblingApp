// Cross-platform alert/confirm utility.
//
// Public API is unchanged: `crossPlatformAlert(title, message?, buttons?)`.
// When an in-app dialog host is mounted (see AppDialogHost), the call renders a
// themed MUI popup instead of the browser's native window.alert/window.confirm,
// which feels seamless and avoids the native dialog freezing browser automation.
// If no host is registered yet (e.g. before the React tree mounts), it falls
// back to the native dialogs so an alert is never silently dropped.

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export interface AlertRequest {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

type AlertHandler = (request: AlertRequest) => void;

let activeHandler: AlertHandler | null = null;

/**
 * Registers the in-app dialog host. Pass `null` to unregister (on unmount).
 */
export const registerAlertHandler = (handler: AlertHandler | null) => {
  activeHandler = handler;
};

// Native fallback (used only when no in-app host is mounted).
const nativeAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => {
  if (!buttons || buttons.length === 0) {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }

  if (buttons.length === 1) {
    window.alert(message ? `${title}\n\n${message}` : title);
    buttons[0].onPress?.();
    return;
  }

  const cancelButton = buttons.find((b) => b.style === "cancel") || buttons[0];
  const confirmButton =
    buttons.find((b) => b.style === "destructive") ||
    buttons.find((b) => b !== cancelButton) ||
    buttons[buttons.length - 1];

  const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
  if (confirmed) {
    confirmButton.onPress?.();
  } else {
    cancelButton.onPress?.();
  }
};

export const crossPlatformAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => {
  if (activeHandler) {
    activeHandler({ title, message, buttons });
    return;
  }
  nativeAlert(title, message, buttons);
};
