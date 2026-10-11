import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { SecurityLevel } from 'expo-local-authentication';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';

export type DeviceAuthenticationStatus =
  | 'checking'
  | 'available'
  | 'device-credential'
  | 'unsupported'
  | 'not-enrolled'
  | 'error';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  isSessionLocked: boolean;
  deviceAuthenticationAvailable: boolean;
  deviceAuthenticationStatus: DeviceAuthenticationStatus;
  unlockWithDeviceAuthentication: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextData>({
  user: null,
  loading: false,
  isSessionLocked: false,
  deviceAuthenticationAvailable: false,
  deviceAuthenticationStatus: 'checking',
  unlockWithDeviceAuthentication: async () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!auth);
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [deviceAuthenticationStatus, setDeviceAuthenticationStatus] =
    useState<DeviceAuthenticationStatus>('checking');
  const userRef = useRef<User | null>(null);
  const deviceAuthenticationAvailableRef = useRef(false);
  const authEventRef = useRef(0);
  const hasReceivedInitialAuthState = useRef(false);
  const wasBackgroundedWithUser = useRef(false);
  const isBiometricPromptActive = useRef(false);
  const biometricPromptReturnedFromSystemUi = useRef(false);

  const detectDeviceAuthenticationStatus =
    useCallback(async (): Promise<DeviceAuthenticationStatus> => {
      if (Platform.OS === 'web') return 'unsupported';

      try {
        const [hasHardware, isEnrolled, enrolledLevel] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
          LocalAuthentication.getEnrolledLevelAsync(),
        ]);

        if (isEnrolled) return 'available';
        if (enrolledLevel === SecurityLevel.SECRET) return 'device-credential';
        if (!hasHardware) return 'unsupported';
        return 'not-enrolled';
      } catch (error) {
        console.warn('Não foi possível consultar a autenticação do dispositivo:', error);
        return 'error';
      }
    }, []);

  const applyDeviceAuthenticationStatus = useCallback((status: DeviceAuthenticationStatus) => {
    const isAvailable = status === 'available' || status === 'device-credential';
    deviceAuthenticationAvailableRef.current = isAvailable;
    setDeviceAuthenticationStatus(status);
  }, []);

  useEffect(() => {
    if (!auth) return;

    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      const isInitialAuthState = !hasReceivedInitialAuthState.current;
      hasReceivedInitialAuthState.current = true;
      const authEvent = authEventRef.current + 1;
      authEventRef.current = authEvent;
      userRef.current = nextUser;
      setUser(nextUser);

      if (!nextUser) {
        wasBackgroundedWithUser.current = false;
        deviceAuthenticationAvailableRef.current = false;
        setDeviceAuthenticationStatus('checking');
        setIsSessionLocked(false);
        setAuthReady(true);
        return;
      }

      // A user delivered in Firebase's first auth event was restored from local
      // persistence, so require device authentication before exposing the session.
      if (isInitialAuthState) setIsSessionLocked(true);
      setDeviceAuthenticationStatus('checking');
      void (async () => {
        const status = await detectDeviceAuthenticationStatus();
        if (!isMounted || authEventRef.current !== authEvent) return;

        applyDeviceAuthenticationStatus(status);
        setAuthReady(true);
      })();
    });

    return () => {
      isMounted = false;
      authEventRef.current += 1;
      unsubscribe();
    };
  }, [applyDeviceAuthenticationStatus, detectDeviceAuthenticationStatus]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background') {
        if (isBiometricPromptActive.current) {
          biometricPromptReturnedFromSystemUi.current = true;
          return;
        }

        wasBackgroundedWithUser.current = Boolean(userRef.current);
        if (userRef.current && deviceAuthenticationAvailableRef.current) {
          setIsSessionLocked(true);
        }
      }

      if (nextState === 'active' && biometricPromptReturnedFromSystemUi.current) {
        biometricPromptReturnedFromSystemUi.current = false;
        return;
      }

      if (nextState === 'active' && wasBackgroundedWithUser.current && userRef.current) {
        wasBackgroundedWithUser.current = false;
        const userId = userRef.current.uid;
        void detectDeviceAuthenticationStatus().then((status) => {
          if (userRef.current?.uid !== userId) return;
          applyDeviceAuthenticationStatus(status);
          if (status === 'available' || status === 'device-credential') {
            setIsSessionLocked(true);
          }
        });
      }
    });

    return () => subscription.remove();
  }, [applyDeviceAuthenticationStatus, detectDeviceAuthenticationStatus]);

  const unlockWithDeviceAuthentication = useCallback(async () => {
    if (!userRef.current || !deviceAuthenticationAvailableRef.current) return false;

    isBiometricPromptActive.current = true;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear FishSpot',
        disableDeviceFallback: false,
        fallbackLabel: 'Usar código do aparelho',
      });

      if (result.success) setIsSessionLocked(false);
      return result.success;
    } catch {
      return false;
    } finally {
      isBiometricPromptActive.current = false;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: !authReady,
        isSessionLocked,
        deviceAuthenticationAvailable:
          deviceAuthenticationStatus === 'available'
          || deviceAuthenticationStatus === 'device-credential',
        deviceAuthenticationStatus,
        unlockWithDeviceAuthentication,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
