import { Alert, Platform } from 'react-native';

type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

/**
 * Cross-platform alert that works on native and web.
 * - Native: delegates to Alert.alert()
 * - Web: uses window.confirm() for two-button dialogs, window.alert() for info
 */
export function crossPlatformAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons as any);
    return;
  }

  // Web implementation
  const fullMessage = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length === 0) {
    window.alert(fullMessage);
    return;
  }

  if (buttons.length === 1) {
    window.alert(fullMessage);
    buttons[0].onPress?.();
    return;
  }

  // Two or more buttons: use confirm()
  // The "cancel" button maps to Cancel, the other (destructive/default) maps to OK
  const cancelButton = buttons.find((b) => b.style === 'cancel');
  const actionButton = buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];

  const confirmed = window.confirm(fullMessage);
  if (confirmed) {
    actionButton?.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}
