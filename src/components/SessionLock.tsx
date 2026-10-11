import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import {
  firebaseEmailToUsername,
  getAuthErrorMessage,
  signOutAccount,
} from '../services/firebaseAuth';

export default function SessionLock() {
  const {
    user,
    isSessionLocked,
    deviceAuthenticationAvailable,
    deviceAuthenticationStatus,
    unlockWithDeviceAuthentication,
  } = useAuth();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [message, setMessage] = useState('');
  const unlockInProgress = useRef(false);

  const tryUnlock = useCallback(async () => {
    if (unlockInProgress.current) return;

    unlockInProgress.current = true;
    setIsUnlocking(true);
    setMessage('');

    try {
      const unlocked = await unlockWithDeviceAuthentication();
      if (!unlocked) {
        setMessage(
          'A autenticação do aparelho não foi confirmada. Tente novamente ou entre com sua senha.',
        );
      }
    } finally {
      unlockInProgress.current = false;
      setIsUnlocking(false);
    }
  }, [unlockWithDeviceAuthentication]);

  useEffect(() => {
    if (!isSessionLocked || !deviceAuthenticationAvailable) return;

    let promptTimeout: ReturnType<typeof setTimeout> | undefined;
    let foregroundSubscription: ReturnType<typeof AppState.addEventListener> | undefined;

    const promptWhenForegrounded = () => {
      if (AppState.currentState === 'active') {
        promptTimeout = setTimeout(() => void tryUnlock(), 300);
        return;
      }

      foregroundSubscription = AppState.addEventListener('change', (nextState) => {
        if (nextState !== 'active') return;
        foregroundSubscription?.remove();
        foregroundSubscription = undefined;
        promptTimeout = setTimeout(() => void tryUnlock(), 300);
      });
    };

    promptWhenForegrounded();

    return () => {
      if (promptTimeout) clearTimeout(promptTimeout);
      foregroundSubscription?.remove();
    };
  }, [deviceAuthenticationAvailable, isSessionLocked, tryUnlock]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setMessage('');

    try {
      await signOutAccount();
    } catch (error) {
      setMessage(getAuthErrorMessage(error));
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!isSessionLocked) return null;

  const username = firebaseEmailToUsername(user?.email);
  const isBusy = isUnlocking || isSigningOut;

  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.card}>
          <Text style={styles.lockIcon} accessibilityLabel="Cadeado">🔒</Text>
          <Text style={styles.title}>FishSpot bloqueado</Text>
          {username ? <Text style={styles.account}>Conta: @{username}</Text> : null}
          <Text style={styles.description}>
            Confirme sua identidade com a biometria ou o bloqueio de tela do aparelho.
          </Text>

          {isUnlocking ? (
            <ActivityIndicator size="large" color="#166534" style={styles.spinner} />
          ) : (
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.primaryButton}
              onPress={() => void tryUnlock()}
              disabled={isBusy}
            >
              <Text style={styles.primaryButtonText}>
                {deviceAuthenticationStatus === 'device-credential'
                  ? 'Confirmar padrão ou código do aparelho'
                  : 'Confirmar com biometria ou código do aparelho'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={() => void handleSignOut()}
            disabled={isBusy}
          >
            <Text style={styles.secondaryButtonText}>Sair e entrar com usuário e senha</Text>
          </TouchableOpacity>

          {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: '#f5f7f5',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 32,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  lockIcon: { fontSize: 38, marginBottom: 12 },
  title: { color: '#173b25', fontSize: 23, fontWeight: '700', textAlign: 'center' },
  account: { color: '#4b5563', fontSize: 15, marginTop: 8 },
  description: {
    color: '#5b6470',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  spinner: { marginVertical: 12 },
  primaryButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#166534',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  secondaryButton: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  secondaryButtonText: { color: '#166534', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  message: { color: '#b91c1c', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 12 },
});
