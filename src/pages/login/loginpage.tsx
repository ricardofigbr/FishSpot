import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { style } from './styles';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
  const navigation = useNavigation<NavigationProp<any>>();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  // Função para acionar o leitor biométrico nativo
  const triggerBiometricPrompt = async (message: string): Promise<boolean> => {
    try {
      setIsAuthenticating(true);
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: message,
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar Senha',
        disableDeviceFallback: false,
      });

      if (authResult.success) {
        await AsyncStorage.setItem('@fishspot_logged_in', 'true');
        navigation.reset({
          index: 0,
          routes: [{ name: 'BottomRoutes' }],
        });
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.error('Erro na autenticação biométrica:', e);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Login por Biometria (exige nome de usuário digitado)
  const handleLoginWithBiometrics = async () => {
    if (!loginUser.trim()) {
      Alert.alert('Atenção', 'Digite o nome de usuário primeiro.');
      return;
    }

    try {
      const savedUserJson = await AsyncStorage.getItem('@fishspot_user');
      if (!savedUserJson) {
        Alert.alert('Erro', 'Nenhuma conta cadastrada neste dispositivo. Registre-se primeiro.');
        return;
      }

      const savedUser = JSON.parse(savedUserJson);

      // Valida se o usuário digitado confere com o cadastrado
      if (savedUser.username.toLowerCase() !== loginUser.trim().toLowerCase()) {
        Alert.alert('Erro', 'Usuário incorreto ou não encontrado neste dispositivo.');
        return;
      }

      // Chama a biometria diretamente
      const success = await triggerBiometricPrompt(
        `Autenticar biometria para @${savedUser.username}`
      );

      if (!success) {
        Alert.alert('Aviso', 'Autenticação biométrica não concluída.');
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível realizar o login por biometria.');
    }
  };

  // Login tradicional por Senha
  const handleLoginWithPassword = async () => {
    if (!loginUser.trim() || !loginPass.trim()) {
      Alert.alert('Atenção', 'Preencha usuário e senha.');
      return;
    }

    try {
      const savedUserJson = await AsyncStorage.getItem('@fishspot_user');
      if (!savedUserJson) {
        Alert.alert('Erro', 'Nenhuma conta cadastrada neste dispositivo. Registre-se primeiro.');
        return;
      }

      const savedUser = JSON.parse(savedUserJson);

      if (
        savedUser.username.toLowerCase() === loginUser.trim().toLowerCase() &&
        savedUser.password === loginPass
      ) {
        await AsyncStorage.setItem('@fishspot_logged_in', 'true');
        navigation.reset({ index: 0, routes: [{ name: 'BottomRoutes' }] });
      } else {
        Alert.alert('Erro', 'Usuário ou senha incorretos.');
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível realizar o login.');
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Precisamos de permissão para acessar a galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const newUser = {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password,
        photo: photo,
      };

      await AsyncStorage.setItem('@fishspot_user', JSON.stringify(newUser));
      await AsyncStorage.setItem('@fishspot_logged_in', 'true');

      Alert.alert('Sucesso', 'Conta cadastrada com sucesso!');
      navigation.reset({ index: 0, routes: [{ name: 'BottomRoutes' }] });
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o cadastro.');
    }
  };

  if (isRegistering) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 30,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Criar Conta</Text>

              <TouchableOpacity onPress={pickImage} style={{ marginBottom: 20 }}>
                {photo ? (
                  <Image source={{ uri: photo }} style={{ width: 90, height: 90, borderRadius: 45 }} />
                ) : (
                  <View
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 45,
                      backgroundColor: '#ddd',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#555', fontWeight: '500' }}>+ Foto</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={style.formContainer}>
                <TextInput
                  style={style.input}
                  placeholder="Nome Completo"
                  value={name}
                  onChangeText={setName}
                />
                <TextInput
                  style={style.input}
                  placeholder="Usuário"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />
                <TextInput
                  style={style.input}
                  placeholder="Senha"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                <TouchableOpacity style={style.primaryButton} onPress={handleRegister}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Cadastrar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsRegistering(false)}
                  style={{ marginTop: 20, alignItems: 'center' }}
                >
                  <Text style={{ color: '#2563eb', fontSize: 15 }}>Já tem conta? Faça login</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
          <StatusBar style="auto" />
        </SafeAreaView>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 30,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Login</Text>

            <View style={style.formContainer}>
              <TextInput
                style={style.input}
                placeholder="Usuário"
                autoCapitalize="none"
                value={loginUser}
                onChangeText={setLoginUser}
              />
              <TextInput
                style={style.input}
                placeholder="Senha"
                secureTextEntry
                value={loginPass}
                onChangeText={setLoginPass}
              />

              <TouchableOpacity
                style={style.primaryButton}
                onPress={handleLoginWithPassword}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Entrar com Senha</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[style.primaryButton, { backgroundColor: '#10b981', marginTop: 10 }]}
                onPress={handleLoginWithBiometrics}
                disabled={isAuthenticating}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                  Entrar com Biometria
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsRegistering(true)}
                style={{ marginTop: 20, alignItems: 'center' }}
              >
                <Text style={{ color: '#2563eb', fontSize: 15 }}>não tem conta? registre aqui</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <StatusBar style="auto" />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}