import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import {
  getAuth,
  inMemoryPersistence,
  initializeAuth,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const requiredConfigValues = [
  firebaseConfig.apiKey,
  firebaseConfig.projectId,
  firebaseConfig.appId,
];

export const isFirebaseConfigured = requiredConfigValues.every(
  (value) => typeof value === 'string' && value.trim().length > 0,
);

function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;

  const existingApp = getApps().find((app) => app.name === 'fishspot');
  return existingApp ?? initializeApp(firebaseConfig, 'fishspot');
}

const firebaseApp = getFirebaseApp();

function hasErrorCode(error: unknown, ...expectedCodes: string[]) {
  return typeof error === 'object' && error !== null && 'code' in error
    && expectedCodes.includes(String(error.code));
}

const firebaseAuthStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(toSecureStoreKey(key)),
  setItem: (key: string, value: string) =>
    SecureStore.setItemAsync(toSecureStoreKey(key), value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(toSecureStoreKey(key)),
};

// The React Native entry point exports this helper at runtime, but Firebase's
// generic public type entry point does not currently include its declaration.
const getReactNativePersistence = (FirebaseAuth as typeof FirebaseAuth & {
  getReactNativePersistence: (storage: typeof firebaseAuthStorage) => Persistence;
}).getReactNativePersistence;

function toSecureStoreKey(key: string) {
  // SecureStore keys accept letters, numbers, periods, hyphens, and underscores.
  // Escape every other character (including underscores) so Firebase keys map uniquely.
  return `firebase-auth-${Array.from(key)
    .map((character) => /^[a-zA-Z0-9.-]$/.test(character)
      ? character
      : `_x${character.codePointAt(0)?.toString(16)}_`)
    .join('')}`;
}

function getPersistentAuth(app: FirebaseApp): Auth {
  try {
    const persistence = Platform.OS === 'web'
      ? inMemoryPersistence
      : getReactNativePersistence(firebaseAuthStorage);
    return initializeAuth(app, { persistence });
  } catch (error) {
    // Fast Refresh can re-evaluate this module after Firebase has initialized.
    if (hasErrorCode(error, 'auth/already-initialized')) return getAuth(app);
    throw error;
  }
}

function getMemoryFirestore(app: FirebaseApp): Firestore {
  try {
    return initializeFirestore(app, { localCache: memoryLocalCache() });
  } catch (error) {
    // Fast Refresh can re-evaluate this module after Firestore has initialized.
    if (hasErrorCode(error, 'failed-precondition', 'firestore/failed-precondition')) {
      return getFirestore(app);
    }
    throw error;
  }
}

export const auth = firebaseApp ? getPersistentAuth(firebaseApp) : null;
export const firestore = firebaseApp ? getMemoryFirestore(firebaseApp) : null;

export function requireFirebaseAuth(): Auth {
  if (!auth) {
    throw new Error('Configure as variáveis Firebase em .env.local para entrar.');
  }
  return auth;
}

export function requireFirestore(): Firestore {
  if (!firestore) {
    throw new Error('Configure o Firebase e o Cloud Firestore para usar seus pontos.');
  }
  return firestore;
}
