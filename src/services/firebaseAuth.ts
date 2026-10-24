import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
  User,
} from 'firebase/auth';
import { requireFirebaseAuth } from './firebase';

const TEST_AUTH_DOMAIN = '@fishspot.test';

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function usernameToFirebaseEmail(username: string) {
  return `${normalizeUsername(username)}${TEST_AUTH_DOMAIN}`;
}

export function firebaseEmailToUsername(email: string | null | undefined) {
  if (!email) return '';
  return email.toLowerCase().endsWith(TEST_AUTH_DOMAIN)
    ? email.slice(0, -TEST_AUTH_DOMAIN.length)
    : email;
}

export async function registerWithUsername(
  username: string,
  password: string,
  displayName: string,
) {
  const auth = requireFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(
    auth,
    usernameToFirebaseEmail(username),
    password,
  );

  await updateProfile(credential.user, { displayName: displayName.trim() });
  return credential.user;
}

export async function signInWithUsername(username: string, password: string) {
  const auth = requireFirebaseAuth();
  const credential = await signInWithEmailAndPassword(
    auth,
    usernameToFirebaseEmail(username),
    password,
  );
  return credential.user;
}

export async function updateAccountProfile(
  user: User,
  displayName: string,
  photoURL: string | null,
) {
  await updateProfile(user, { displayName: displayName.trim(), photoURL });
}

export async function updateAccountCredentials(
  user: User,
  currentPassword: string,
  username: string | null,
  newPassword: string | null,
) {
  if (!user.email) throw new Error('A conta Firebase não possui um identificador de login.');

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  if (username) {
    const nextEmail = usernameToFirebaseEmail(username);
    if (nextEmail !== user.email) await updateEmail(user, nextEmail);
  }
  if (newPassword) await updatePassword(user, newPassword);
}

export async function signOutAccount() {
  await signOut(requireFirebaseAuth());
}

export function getAuthErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error
    ? String(error.code)
    : '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Esse nome de usuário já está cadastrado.';
    case 'auth/invalid-email':
      return 'Nome de usuário inválido. Use letras, números, ponto, hífen ou sublinhado.';
    case 'auth/weak-password':
      return 'A senha precisa ter pelo menos 6 caracteres.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Usuário ou senha incorretos.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet. Conecte-se para entrar ou criar a conta.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
    default:
      return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
  }
}
