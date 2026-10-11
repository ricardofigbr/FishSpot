import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { style } from './styles';
import { getAuthErrorMessage, registerWithUsername, signInWithUsername } from '../../services/firebaseAuth';

const usernamePattern = /^[a-zA-Z0-9._-]{3,30}$/;

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!loginUser.trim() || !loginPass) {
      Alert.alert('Atenção', 'Preencha usuário e senha.');
      return;
    }

    if (!usernamePattern.test(loginUser.trim())) {
      Alert.alert('Atenção', 'Use um usuário com 3 a 30 letras, números, ponto, hífen ou sublinhado.');
      return;
    }

    setIsAuthenticating(true);
    try {
      await signInWithUsername(loginUser, loginPass);
    } catch (error) {
      Alert.alert('Não foi possível entrar', getAuthErrorMessage(error));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !username.trim() || !password) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    if (!usernamePattern.test(username.trim())) {
      Alert.alert('Atenção', 'Use um usuário com 3 a 30 letras, números, ponto, hífen ou sublinhado.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setIsAuthenticating(true);
    try {
      await registerWithUsername(username, password, name);
      Alert.alert('Sucesso', 'Conta de teste criada.');
    } catch (error) {
      Alert.alert('Não foi possível cadastrar', getAuthErrorMessage(error));
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <SafeAreaView style={style.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={style.keyboardAvoidingView}
      >
        <ScrollView
          style={style.scrollView}
          contentContainerStyle={[
            style.scrollContent,
            keyboardVisible && style.scrollContentWithKeyboard,
          ]}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
            <Text style={style.title}>
              {isRegistering ? 'Criar Conta' : 'Login'}
            </Text>

            <View style={style.formContainer}>
              {isRegistering ? (
                <>
                  <TextInput
                    style={style.input}
                    placeholder="Nome Completo"
                    autoCapitalize="words"
                    value={name}
                    onChangeText={setName}
                    editable={!isAuthenticating}
                  />
                  <TextInput
                    style={style.input}
                    placeholder="Usuário"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={username}
                    onChangeText={setUsername}
                    editable={!isAuthenticating}
                  />
                  <TextInput
                    style={style.input}
                    placeholder="Senha (mínimo 6 caracteres)"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    editable={!isAuthenticating}
                  />
                  <TouchableOpacity
                    style={style.primaryButton}
                    onPress={handleRegister}
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={style.actionText}>
                        Cadastrar
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsRegistering(false)}
                    style={style.secondaryLinkContainer}
                    disabled={isAuthenticating}
                  >
                    <Text style={style.secondaryLinkText}>Já tem conta? Faça login</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TextInput
                    style={style.input}
                    placeholder="Usuário"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={loginUser}
                    onChangeText={setLoginUser}
                    editable={!isAuthenticating}
                  />
                  <TextInput
                    style={style.input}
                    placeholder="Senha"
                    secureTextEntry
                    value={loginPass}
                    onChangeText={setLoginPass}
                    editable={!isAuthenticating}
                  />
                  <TouchableOpacity
                    style={style.primaryButton}
                    onPress={handleLogin}
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={style.actionText}>
                        Entrar
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsRegistering(true)}
                    style={style.secondaryLinkContainer}
                    disabled={isAuthenticating}
                  >
                    <Text style={style.secondaryLinkText}>Não tem conta? Registre-se</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
        </ScrollView>
        <StatusBar style="auto" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
