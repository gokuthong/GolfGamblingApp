// Simple alert/confirm utilities for web
// Replace React Native Alert.alert() calls

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export const crossPlatformAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[]
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

  if (buttons.length === 2) {
    const cancelButton = buttons.find(b => b.style === 'cancel') || buttons[0];
    const confirmButton = buttons.find(b => b !== cancelButton) || buttons[1];

    const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
    if (confirmed) {
      confirmButton.onPress?.();
    } else {
      cancelButton.onPress?.();
    }
    return;
  }

  // For 3+ buttons, use confirm for the destructive/primary action
  const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
  if (confirmed) {
    const actionButton = buttons.find(b => b.style === 'destructive') || buttons.find(b => b.style !== 'cancel');
    actionButton?.onPress?.();
  } else {
    const cancelButton = buttons.find(b => b.style === 'cancel');
    cancelButton?.onPress?.();
  }
};
