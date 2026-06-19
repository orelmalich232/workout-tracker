import { Alert, Platform } from 'react-native';

interface Btn {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export function alertMsg(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

export function alertConfirm(title: string, message: string, buttons: Btn[]) {
  if (Platform.OS === 'web') {
    const action = buttons.find(b => b.style !== 'cancel');
    if (window.confirm(`${title}\n\n${message}`)) {
      action?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}
