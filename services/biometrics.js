import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export async function checkBiometricHardware() {
  if (Platform.OS === 'web') {
    return {
      isAvailable: false,
      hasHardware: false,
      isEnrolled: false,
      supportsFaceId: false,
      supportsFingerprint: false,
    };
  }
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    return {
      isAvailable: hasHardware && isEnrolled,
      hasHardware,
      isEnrolled,
      supportsFaceId: supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION),
      supportsFingerprint: supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT),
    };
  } catch {
    return {
      isAvailable: false,
      hasHardware: false,
      isEnrolled: false,
      supportsFaceId: false,
      supportsFingerprint: false,
    };
  }
}

export async function authenticateWithBiometrics(promptMessage = 'Unlock Panda Vault with Face ID / Fingerprint') {
  try {
    const { isAvailable } = await checkBiometricHardware();
    if (!isAvailable) {
      return { success: false, error: 'Biometrics not available or enrolled' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Use Master Password',
      fallbackLabel: 'Enter Password',
      disableDeviceFallback: false,
    });

    return {
      success: result.success,
      error: result.error || null,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
