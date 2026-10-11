import { StyleSheet } from 'react-native';

export const style = StyleSheet.create({
  screen: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  scrollContentWithKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: { marginBottom: 20, fontSize: 22, fontWeight: 'bold' },
  formContainer: {
    width: 320,
    alignSelf: 'center',
  },
  input: {
    width: '100%',
    marginBottom: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  primaryButton: {
    alignItems: 'center',
    width: '100%',
    marginTop: 5,
    padding: 14,
    borderRadius: 6,
    backgroundColor: '#2563eb',
  },
  actionText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryLinkContainer: { alignItems: 'center', marginTop: 20 },
  secondaryLinkText: { color: '#2563eb', fontSize: 15 },
});
