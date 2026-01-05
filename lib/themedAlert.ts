import { Alert } from 'react-native';

export type ThemedAlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export type ThemedAlertOptions = {
  title: string;
  message?: string;
  buttons?: ThemedAlertButton[];
  cancelable?: boolean;
};

type ThemedAlertHandler = (options: ThemedAlertOptions) => void;

let handler: ThemedAlertHandler | null = null;
let shimInstalled = false;
const nativeAlert = Alert.alert.bind(Alert);

export function registerThemedAlertHandler(next: ThemedAlertHandler) {
  handler = next;
  return () => {
    if (handler === next) handler = null;
  };
}

export function showThemedAlert(
  title: string,
  message?: string,
  buttons?: ThemedAlertButton[],
  cancelable?: boolean
) {
  if (handler) {
    handler({ title, message, buttons, cancelable });
    return;
  }
  nativeAlert(title, message, buttons as any);
}

/**
 * Installs a global shim so existing `Alert.alert(...)` calls show the themed alert
 * when the provider is mounted. Falls back to native alerts if not available.
 */
export function installThemedAlertShim() {
  if (shimInstalled) return;
  shimInstalled = true;

  // Patch in place so all imports share the same Alert object reference.
  (Alert as any).alert = (
    title: string,
    message?: string,
    buttons?: ThemedAlertButton[],
    options?: { cancelable?: boolean }
  ) => {
    const cancelable = options?.cancelable;
    showThemedAlert(title, message, buttons, cancelable);
  };
}
